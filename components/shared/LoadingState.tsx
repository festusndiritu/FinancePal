type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
