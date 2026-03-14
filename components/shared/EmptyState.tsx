type EmptyStateProps = {
  message: string;
};

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
