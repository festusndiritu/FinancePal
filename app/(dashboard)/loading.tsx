export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-28 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-28 animate-pulse rounded-xl bg-muted/60" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}
