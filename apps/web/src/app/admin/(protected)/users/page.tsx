export const dynamic = "force-dynamic";

import { getUsers } from "@/features/admin/api/get-users";
import { Role } from "@/shared/types/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { RoleSelect } from "@/features/admin/ui/role-select";
import { AdminUserFilters } from "@/features/admin/ui/admin-user-filters";
import { Pagination } from "@/shared/ui/custom/pagination";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const role = (params.role as Role | undefined) || undefined;
  const page = Number(params.page) || 1;

  const data = await getUsers({ page, search, role });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Пользователи</h1>
        <p className="text-slate-500 mt-1">Всего: {data.total}</p>
      </div>

      {/* Filters */}
      <AdminUserFilters initialSearch={search} initialRole={role} />

      {/* Table */}
      <div className="bg-[#16162a] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-bold">Пользователь</th>
              <th className="text-left p-4 font-bold">Роль</th>
              <th className="text-left p-4 font-bold">Дата</th>
              <th className="text-left p-4 font-bold">Статус</th>
              <th className="text-left p-4 font-bold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar || ""} />
                      <AvatarFallback className="text-xs font-bold bg-slate-800 text-slate-400">
                        {user.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white">{user.firstName}</p>
                      <p className="text-xs text-slate-500">
                        {user.telegramId ? `TG: ${user.telegramId}` : "No TG"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="p-4 text-slate-500 text-xs">
                  {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="p-4">
                  {user.providerProfile ? (
                    user.providerProfile.isVerified ? (
                      <span className="text-xs font-bold text-emerald-500">Верифицирован</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-500">Не верифицирован</span>
                    )
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </td>
                <td className="p-4">
                  <RoleSelect userId={user.id} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination totalPages={data.totalPages} currentPage={page} />
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const colors: Record<Role, string> = {
    USER: "bg-slate-700/50 text-slate-300",
    PROVIDER: "bg-emerald-700/50 text-emerald-300",
    ADMIN: "bg-violet-700/50 text-violet-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${colors[role]}`}>
      {role}
    </span>
  );
}