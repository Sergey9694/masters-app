import { verifyEmailAction } from "@/features/auth/model/actions";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <VerifyCard title="Ошибка" icon={<XCircle className="w-12 h-12 text-red-500" />} message="Токен отсутствует." />
      </div>
    );
  }

  const result = await verifyEmailAction({ token });

  if (result?.serverError || !result?.data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <VerifyCard 
          title="Ошибка" 
          icon={<XCircle className="w-12 h-12 text-red-500" />} 
          message={result?.serverError || "Неверный или просроченный токен."} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <VerifyCard 
        title="Email подтвержден!" 
        icon={<CheckCircle2 className="w-12 h-12 text-green-500" />} 
        message="Ваша почта успешно подтверждена. Теперь вы можете пользоваться всеми функциями сервиса."
        showLogin
      />
    </div>
  );
}

function VerifyCard({ title, icon, message, showLogin }: { title: string; icon: React.ReactNode; message: string; showLogin?: boolean }) {
  return (
    <Card className="glass-premium border-white/10 shadow-2xl max-w-md w-full text-center p-6 rounded-[32px]">
      <CardHeader>
        <div className="flex justify-center mb-4">{icon}</div>
        <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-slate-400">{message}</p>
        <Button asChild variant="premium" className="w-full h-12 rounded-xl">
          <Link href={showLogin ? "/auth/login" : "/"}>
            {showLogin ? "Перейти к входу" : "На главную"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
