import { useRouterState } from "@tanstack/react-router";

/** Indicador circular exibido enquanto uma tela carrega. */
export function RouteLoader() {
  const isLoading = useRouterState({ select: (s) => s.status === "pending" || s.isLoading });
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center pointer-events-none">
      <div className="glass-strong rounded-2xl p-4 shadow-lg animate-in fade-in duration-150">
        <span className="block size-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
      </div>
    </div>
  );
}
