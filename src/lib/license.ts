import { supabase } from "@/integrations/supabase/client";

export type LicenseKind = "trial" | "monthly" | "lifetime" | "custom";

export interface LicenseInfo {
  kind: LicenseKind;
  startedAt: string | null;
  expiresAt: string | null;
}

export const DAY = 86400000;
export const TRIAL_CYCLE_DAYS = 30;

export async function fetchLicense(userId: string): Promise<LicenseInfo | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("license_kind, license_started_at, license_expires_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    kind: (data.license_kind as LicenseKind) ?? "trial",
    startedAt: data.license_started_at ?? null,
    expiresAt: data.license_expires_at ?? null,
  };
}

/** Data de vencimento efetiva: licença paga, ou ciclos de 30 dias desde o 1º login. */
export function dueDate(license: LicenseInfo | null, firstLoginISO: string): Date | null {
  if (license?.kind === "lifetime") return null;
  if (license?.expiresAt) return new Date(license.expiresAt);
  const start = new Date(firstLoginISO);
  const base = isNaN(start.getTime()) ? new Date() : start;
  const cycles = Math.floor((Date.now() - base.getTime()) / (TRIAL_CYCLE_DAYS * DAY)) + 1;
  return new Date(base.getTime() + cycles * TRIAL_CYCLE_DAYS * DAY);
}

export function daysLeft(due: Date | null): number | null {
  if (!due) return null;
  return Math.ceil((due.getTime() - Date.now()) / DAY);
}

export function licenseLabel(license: LicenseInfo | null): string {
  switch (license?.kind) {
    case "lifetime": return "Vitalícia";
    case "monthly": return "Mensal";
    case "custom": return "Personalizada";
    default: return "Período de avaliação";
  }
}

export function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  return clean.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

export async function redeemKey(code: string) {
  const { data, error } = await supabase.rpc("redeem_access_key", {
    _code: code.replace(/-/g, ""),
  });
  if (error) throw new Error(error.message.includes("invalid_key") ? "Chave inválida ou já utilizada." : "Não foi possível validar a chave.");
  const row = Array.isArray(data) ? data[0] : data;
  return row as { license_kind: string; license_expires_at: string | null } | null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}
