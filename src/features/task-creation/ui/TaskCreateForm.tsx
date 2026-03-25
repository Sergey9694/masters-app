"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Camera, MapPin, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { createOrderAction } from "../api/create-task-action";
import { taskSchema, type TaskFormValues } from "../model/task-schema";

interface Category {
  id: string;
  name: string;
}

interface TaskCreateFormProps {
  categories: Category[];
  userId: string;
}

export function TaskCreateForm({ categories }: TaskCreateFormProps) {
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "Академический микрорайон", // Default for hyperlocal
      budget: "",
    },
  });

  async function onSubmit(data: TaskFormValues) {
    setIsPending(true);
    try {
      await createOrderAction(data);
      
      toast.success("Заказ успешно опубликован!", {
        description: "Мастера района скоро увидят вашу заявку.",
      });
      form.reset();
    } catch (error: any) {
      toast.error("Ошибка при создании заказа", {
        description: error.message || "Попробуйте еще раз позже.",
      });
    } finally {
      setIsPending(false);
    }
  }


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="space-y-6 glass p-8 rounded-[40px] border border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden">
            {/* Decoration Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Что нужно сделать?</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Починить кран на кухне" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип работ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Детали проблемы</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Опишите подробности, чтобы мастер мог точнее оценить работу..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Расскажите, какие инструменты или материалы могут понадобиться.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примерный бюджет (₽)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Договорная" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Где именно?</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input className="pl-10" placeholder="Улица, дом..." {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Photo Upload Placeholder (Feature to be implemented) */}
          <div className="glass p-6 rounded-[32px] border border-dashed border-white/20 dark:border-white/10 flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-blue-500 transition-all">
                <Camera className="w-6 h-6" />
            </div>
            <div className="text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">Добавить фото</p>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide leading-none uppercase">Максимум 5 снимков</p>
            </div>
          </div>

          <Button 
            disabled={isPending}
            className="w-full h-16 rounded-[28px] bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black uppercase tracking-[0.25em] text-xs shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Опубликовать тендер
                <Send className="w-4 h-4 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </Button>
          
        </form>
      </Form>
    </motion.div>
  );
}
