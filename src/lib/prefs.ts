import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HideableTab = "/educacao" | "/missoes" | "/projetos" | "/assinaturas" | "/devedores" | "/dividas" | "/transacoes";

export const HIDEABLE_TABS: { to: HideableTab; label: string; note?: string }[] = [
  { to: "/educacao", label: "Educação" },
  { to: "/missoes", label: "Missões", note: "pausa as notificações de missões" },
  { to: "/projetos", label: "Projetos" },
  { to: "/assinaturas", label: "Assinaturas (BETA)" },
  { to: "/devedores", label: "Devedores" },
  { to: "/dividas", label: "Dívidas" },
  { to: "/transacoes", label: "Transações (BETA)" },
];

type Prefs = { babyMode: boolean; hiddenTabs: string[] };
const KEY = "cf_prefs_v1";
let prefs: Prefs = { babyMode: false, hiddenTabs: [] };
let loaded = false;
const subs = new Set<() => void>();
const emit = () => {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  subs.forEach(f => f());
};

function init() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) prefs = { ...prefs, ...JSON.parse(raw) }; } catch { /* ignore */ }
  void (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.from("profiles").select("baby_mode, hidden_tabs").eq("id", u.user.id).maybeSingle();
    if (data) { prefs = { babyMode: !!data.baby_mode, hiddenTabs: data.hidden_tabs ?? [] }; emit(); }
  })();
}

async function persist(patch: { baby_mode?: boolean; hidden_tabs?: string[] }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("profiles").update(patch).eq("id", u.user.id);
}

export function getPrefs(): Prefs { init(); return prefs; }
export function isTabHidden(to: string) { return getPrefs().hiddenTabs.includes(to); }

export function setBabyMode(v: boolean) {
  prefs = { ...prefs, babyMode: v }; emit(); void persist({ baby_mode: v });
}
export function setTabHidden(to: string, hidden: boolean) {
  const set = new Set(prefs.hiddenTabs);
  if (hidden) set.add(to); else set.delete(to);
  prefs = { ...prefs, hiddenTabs: [...set] }; emit(); void persist({ hidden_tabs: prefs.hiddenTabs });
}

const SERVER: Prefs = { babyMode: false, hiddenTabs: [] };
export function usePrefs(): Prefs {
  return useSyncExternalStore(
    cb => { init(); subs.add(cb); return () => { subs.delete(cb); }; },
    () => getPrefs(),
    () => SERVER,
  );
}
