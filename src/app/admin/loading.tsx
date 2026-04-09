export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-500 text-sm font-bold animate-pulse">Загрузка данных...</p>
    </div>
  );
}
