import { useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { fetchLicense, dueDate, daysLeft, licenseLabel, type LicenseInfo, DAY, TRIAL_CYCLE_DAYS } from "@/lib/license";

const KEY = "closefinance:licenseNotice";

export function LicenseNotice() {
  const [, , user] = useStore();
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [show, setShow] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchLicense(user.id).then((l) => {
      if (!alive) return;
      setLicense(l);
      if (l?.kind === "lifetime") return;
      const start = new Date(user.createdAt).getTime();
      const c = Math.floor((Date.now() - (isNaN(start) ? Date.now() : start)) / (TRIAL_CYCLE_DAYS * DAY));
      const due = dueDate(l, user.createdAt);
      const left = daysLeft(due);
      if (left === null || left > 5) return;
      if (localStorage.getItem(KEY) === String(c)) return;
      setCycle(c);
      setShow(true);
    });
    return () => { alive = false; };
  }, [user?.id]);

  if (!user || !show) return null;

  const due = dueDate(license, user.createdAt);
  const left = daysLeft(due);

  function dismiss() {
    localStorage.setItem(KEY, String(cycle));
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-strong relative w-full max-w-md rounded-lg p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
        <button onClick={dismiss} className="absolute right-3 top-3 rounded-md p-1.5 hover:bg-white/10" aria-label="Fechar">
          <X className="size-4" />
        </button>
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 border border-primary/30">
          <CalendarClock className="size-6 text-primary" />
        </div>
        <h2 className="mt-4 text-xl font-bold">
          {left !== null && left <= 0 ? "Seu acesso expirou" : "Renovação do plano"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {left !== null && left <= 0
            ? "Insira uma chave de acesso para continuar aproveitando todos os recursos do CloseFinance."
            : `Sua licença (${licenseLabel(license).toLowerCase()}) vence em ${due?.toLocaleDateString("pt-BR")}${left !== null ? ` — faltam ${left} dia(s)` : ""}.`}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            to="/perfil"
            onClick={dismiss}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Inserir chave de acesso
          </Link>
          <button onClick={dismiss} className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-white/5">
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}
