import { Sparkles, Sprout, GraduationCap, ShieldCheck, Swords, Gem, Crown, Trophy, type LucideIcon } from "lucide-react";

export type Gender = "male" | "female" | "other";

export interface Rank {
  id: string;
  /** masculine name */
  name: string;
  /** feminine variant */
  nameF: string;
  min: number;
  color: string;
  Icon: LucideIcon;
}

export const RANKS: Rank[] = [
  { id: "iniciante",   name: "Iniciante",            nameF: "Iniciante",             min: 0,    color: "#FFCC00", Icon: Sprout },
  { id: "aprendiz",    name: "Aprendiz",             nameF: "Aprendiz",              min: 1200, color: "#22C3CC", Icon: GraduationCap },
  { id: "disciplinado",name: "Disciplinado",         nameF: "Disciplinada",          min: 2400, color: "#2BD9A1", Icon: ShieldCheck },
  { id: "estrategista",name: "Estrategista",         nameF: "Estrategista",          min: 3800, color: "#540BD3", Icon: Swords },
  { id: "graomestre",  name: "Grão Mestre Financeiro", nameF: "Grã Mestra Financeira", min: 5600, color: "#B388FF", Icon: Gem },
  { id: "mestre",      name: "Mestre Financeiro",    nameF: "Mestra Financeira",     min: 7000, color: "#FF6B1A", Icon: Trophy },
  { id: "rei",         name: "Rei das Finanças",     nameF: "Rainha das Finanças",   min: 8500, color: "#FFD700", Icon: Crown },
];

export function getRank(points: number, gender?: Gender) {
  let current = RANKS[0];
  for (const r of RANKS) if (points >= r.min) current = r;
  const next = RANKS.find(r => r.min > points);
  const progress = next ? Math.max(0, Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100))) : 100;
  const displayName = gender === "female" ? current.nameF : current.name;
  const nextDisplayName = next ? (gender === "female" ? next.nameF : next.name) : null;
  return { current, next, progress, displayName, nextDisplayName };
}

export { Sparkles };
