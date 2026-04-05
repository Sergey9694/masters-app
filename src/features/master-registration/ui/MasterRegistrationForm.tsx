"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Hammer, SendHorizontal, Check } from "lucide-react";

import { SLIDE_UP, HOVER_GLOW, CLICK_SCALE } from "@/shared/lib/motion";
import { Button } from "@/shared/ui/button";
import { MotionToast } from "@/shared/ui/motion-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/textarea";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";
import {
  masterProfileSchema,
  type MasterProfileFormValues,
} from "../model/schema";
import { createMasterProfileAction } from "../api/actions";

interface Props {
  categories: { id: string; name: string }[];
}

export function MasterRegistrationForm({ categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<MasterProfileFormValues>({
    resolver: zodResolver(masterProfileSchema),
    defaultValues: { bio: "", categoryIds: [] },
  });

  const onSubmit = (vals: MasterProfileFormValues) => {
    startTransition(async () => {
      const res = await createMasterProfileAction(vals);
      if ("success" in res) {
        toast.custom(() => (
          <MotionToast type="success">Вы теперь мастер!</MotionToast>
        ));
        setTimeout(() => router.push(res.redirect), 800);
        return;
      }
      toast.error(res.error);
    });
  };

  return (
    <div className="container-standard">
      <Form {...form}>
        <motion.form
          initial="initial"
          animate="animate"
          variants={SLIDE_UP}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <Card className="glass-premium border-none p-6 sm:p-8 rounded-[var(--ui-radius-premium)] shadow-2xl relative overflow-visible">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[100px] -mr-24 -mt-24 pointer-events-none" />

            <header className="space-y-1 mb-6 relative z-10">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                Стать мастером
                <Hammer className="w-5 h-5 text-emerald-400" />
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                District Master • Onboarding
              </p>
            </header>

            <div className="space-y-6 relative z-10">
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">
                      О себе
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Расскажите о вашем опыте, квалификации, какие работы выполняете..."
                        className="min-h-[140px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="categoryIds"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">
                      В каких категориях работаете?
                    </FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const selected = field.value.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? field.value.filter((id) => id !== cat.id)
                                : [...field.value, cat.id];
                              field.onChange(next);
                            }}
                            className={cn(
                              "px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5",
                              selected
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20",
                            )}
                          >
                            {selected && <Check className="w-3 h-3" />}
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                    {fieldState.error && (
                      <p className="text-xs text-red-400 font-bold mt-2">
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              variant="premium"
              size="xl"
              asChild
              disabled={isPending}
              className="w-full relative group rounded-[var(--ui-radius-premium)] mt-8"
            >
              <motion.button whileHover={HOVER_GLOW} whileTap={CLICK_SCALE}>
                {isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="flex items-center gap-4">
                    <span>Зарегистрироваться как мастер</span>
                    <SendHorizontal className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
                  </div>
                )}
              </motion.button>
            </Button>
          </Card>
        </motion.form>
      </Form>
    </div>
  );
}
