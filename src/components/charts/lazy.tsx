import { lazy, Suspense, type ComponentType } from "react";

/** Placeholder leve enquanto o pacote de gráficos é carregado sob demanda. */
function ChartSkeleton() {
  return (
    <div className="h-full w-full grid place-items-center">
      <div className="size-6 rounded-full border-2 border-border border-t-primary animate-spin" />
    </div>
  );
}

function withSuspense<P extends object>(Comp: ComponentType<P>) {
  return function LazyChart(props: P) {
    return (
      <Suspense fallback={<ChartSkeleton />}>
        <Comp {...props} />
      </Suspense>
    );
  };
}

export const TrendAreaChart = withSuspense(lazy(() => import("./TrendAreaChart")));
export const CategoryBarChart = withSuspense(lazy(() => import("./CategoryBarChart")));
export const FlowAreaChart = withSuspense(lazy(() => import("./FlowAreaChart")));
export const CatStackBarChart = withSuspense(lazy(() => import("./CatStackBarChart")));
export const CatPieChart = withSuspense(lazy(() => import("./CatPieChart")));
export const BabyMonthlyBar = withSuspense(lazy(() => import("./BabyCharts").then(m => ({ default: m.BabyMonthlyBar }))));
export const BabyEssentialPie = withSuspense(lazy(() => import("./BabyCharts").then(m => ({ default: m.BabyEssentialPie }))));
