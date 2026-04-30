import Link from "next/link";
import type { ReportReason, ReportStatus, ReportTargetType } from "@prisma/client";
import { Flag, Filter, ShieldAlert } from "lucide-react";
import { trustService } from "@/services/trust.service";
import { ReportModerationActions } from "@/features/trust/ui/ReportModerationActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Жалобы — Админ" };

const statuses = ["PENDING", "REVIEWED", "ACTIONED", "DISMISSED"] as const;
const reasons = [
  "SPAM",
  "HARASSMENT",
  "FRAUD",
  "INAPPROPRIATE_CONTENT",
  "CONTACT_EXCHANGE",
  "SAFETY_THREAT",
  "OTHER",
] as const;
const targetTypes = ["USER", "MESSAGE", "CONVERSATION", "ORDER", "LISTING", "REVIEW", "PROVIDER"] as const;

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalize<T extends readonly string[]>(value: string | undefined, allowed: T): T[number] | undefined {
  return value && allowed.includes(value as T[number]) ? value : undefined;
}

function userName(user?: { firstName: string; lastName: string | null; email?: string | null } | null) {
  if (!user) return "Неизвестный пользователь";
  return `${user.firstName} ${user.lastName ?? ""}`.trim() || user.email || "Пользователь";
}

function evidenceLines(evidence: unknown) {
  if (!evidence || typeof evidence !== "object") return ["Evidence не приложен"];
  const data = evidence as {
    version?: unknown;
    conversationId?: unknown;
    reportedMessageId?: unknown;
    messages?: unknown;
    context?: unknown;
  };
  const lines = [`Версия: ${String(data.version ?? "n/a")}`];
  if (typeof data.conversationId === "string") lines.push(`Диалог: ${data.conversationId}`);
  if (typeof data.reportedMessageId === "string") lines.push(`Сообщение: ${data.reportedMessageId}`);
  if (Array.isArray(data.messages)) lines.push(`Сообщений в snapshot: ${data.messages.length}`);
  lines.push("Plaintext сообщений не хранится в evidence.");
  return lines;
}

function buildHref(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/admin/reports?${query}` : "/admin/reports";
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const status = normalize(single(params.status), statuses) as ReportStatus | undefined;
  const reason = normalize(single(params.reason), reasons) as ReportReason | undefined;
  const targetType = normalize(single(params.targetType), targetTypes) as ReportTargetType | undefined;
  const page = Math.max(1, Number(single(params.page) ?? "1") || 1);

  const { data: reports, total } = await trustService.listReports({ status, reason, targetType }, page, 20);

  const baseParams = new URLSearchParams();
  if (status) baseParams.set("status", status);
  if (reason) baseParams.set("reason", reason);
  if (targetType) baseParams.set("targetType", targetType);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-white">
            <ShieldAlert className="size-8 text-rose-400" />
            Жалобы
          </h1>
          <p className="mt-1 text-slate-500">Очередь Trust/Safety: всего {total}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#16162a] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Filter className="size-4" />
          Фильтры
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15" href="/admin/reports">
            Все
          </Link>
          {statuses.map((item) => {
            const next = new URLSearchParams(baseParams);
            next.set("status", item);
            next.delete("page");
            return (
              <Link key={item} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10" href={buildHref(next)}>
                {item}
              </Link>
            );
          })}
          {targetTypes.map((item) => {
            const next = new URLSearchParams(baseParams);
            next.set("targetType", item);
            next.delete("page");
            return (
              <Link key={item} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10" href={buildHref(next)}>
                {item}
              </Link>
            );
          })}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#16162a] py-24 text-slate-600">
          <Flag className="mb-3 size-12" />
          <p className="text-sm">Жалоб по выбранным фильтрам нет</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-white/5 bg-[#16162a] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-300">
                      {report.status}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">
                      {report.targetType}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">
                      {report.reason}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-white">
                    {userName(report.reporter)} → {userName(report.targetUser)}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(report.createdAt).toLocaleString("ru-RU")} · targetId: {report.targetId}
                  </p>
                </div>
                {report.status === "PENDING" && <ReportModerationActions reportId={report.id} />}
              </div>

              {report.description && (
                <p className="mt-4 rounded-xl bg-white/[0.03] p-3 text-sm text-slate-300">
                  {report.description}
                </p>
              )}

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
                <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Evidence
                  </p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {evidenceLines(report.evidence).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  {report.conversationId && (
                    <Link className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10" href={`/admin/chats/${report.conversationId}`}>
                      Открыть чат
                    </Link>
                  )}
                  {report.targetUserId && (
                    <Link className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10" href="/admin/users">
                      Открыть пользователей
                    </Link>
                  )}
                  {report.orderId && (
                    <Link className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10" href="/admin/orders">
                      Открыть задачи
                    </Link>
                  )}
                  {report.resolvedBy && (
                    <p className="text-xs text-slate-500">
                      Решил: {userName(report.resolvedBy)}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
