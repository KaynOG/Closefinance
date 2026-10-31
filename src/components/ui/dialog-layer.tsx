import { useEffect, useState, type ReactNode } from "react";

let nextLayer = 100;

// Assign a stacking context in opening order, independent of portal DOM order.
export function DialogLayer({ children }: { children: ReactNode }) {
  const [layer, setLayer] = useState(100);
  useEffect(() => { setLayer(++nextLayer); }, []);
  return <div data-popup-layer className="pointer-events-none fixed inset-0" style={{ zIndex: layer }}>{children}</div>;
}