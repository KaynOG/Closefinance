import { useEffect, useState } from "react";
import { useStore, formatBRL } from "@/lib/store";
import { PiggyBank, Sparkles, Bell, X } from "lucide-react";

const MOTIVATIONAL = [
  "Cada real guardado é um tijolo da sua liberdade financeira. 🧱",
  "Você acabou de comprar um pedacinho do seu futuro. 🌱",
  "Disciplina hoje, tranquilidade amanhã. Continue assim!",
  "Warren Buffett aplaudiria essa jogada. 👏",
  "Reserva crescendo, ansiedade diminuindo. Que combo!",
  "Você tá construindo seu próprio Wakanda financeiro. 🐆",
  "Poupar é o novo flex. E você tá arrasando. ✨",
  "Um passo a mais rumo à independência. Bora manter o ritmo!",
  "Seu 'eu' do futuro tá mandando um obrigado. 🙌",
  "Isso aí! O cofrinho tá sorrindo com você.",
  "Money, money, money — must be sunny, in a saver's world. 🎵",
  "Você virou o herói da própria história financeira. 🦸",
];

const KEY_LAST_SAVED = "closefinance:lastSavedTotal";
const KEY_LAST_SAVED_MONTH = "closefinance:lastSavedMonth";
const KEY_REMINDER_SHOWN = "closefinance:reminderShownMonth";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function SavingsMonitor() {
  const [{ banks }, , user] = useStore();
  const [congrats, setCongrats] = useState<{ amount: number; phrase: string } | null>(null);
  const [reminder, setReminder] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const totalSaved = banks.reduce((s, b) => s + b.savedAmount, 0);

  // Initialize baseline on first render for this user (no false congrats on login)
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(KEY_LAST_SAVED);
    if (stored === null) {
      localStorage.setItem(KEY_LAST_SAVED, String(totalSaved));
    }
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Detect increase → congratulate
  useEffect(() => {
    if (!initialized || !user) return;
    const prev = Number(localStorage.getItem(KEY_LAST_SAVED) ?? "0");
    if (totalSaved > prev + 0.001) {
      const diff = totalSaved - prev;
      const phrase = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];
      setCongrats({ amount: diff, phrase });
      localStorage.setItem(KEY_LAST_SAVED, String(totalSaved));
      localStorage.setItem(KEY_LAST_SAVED_MONTH, currentMonth());
    } else if (totalSaved < prev) {
      // Keep baseline in sync when the user removes/adjusts savings.
      localStorage.setItem(KEY_LAST_SAVED, String(totalSaved));
    }
  }, [totalSaved, initialized, user]);

  // Monthly reminder if no savings happened this month
  useEffect(() => {
    if (!initialized || !user) return;
    const month = currentMonth();
    const lastSavedMonth = localStorage.getItem(KEY_LAST_SAVED_MONTH);
    const alreadyShown = localStorage.getItem(KEY_REMINDER_SHOWN);
    // Show reminder once per month after day 20, if user did not save this month
    const day = new Date().getDate();
    if (day >= 20 && lastSavedMonth !== month && alreadyShown !== month) {
      const t = setTimeout(() => setReminder(true), 1200);
      return () => clearTimeout(t);
    }
  }, [initialized, user]);

  function closeReminder() {
    localStorage.setItem(KEY_REMINDER_SHOWN, currentMonth());
    setReminder(false);
  }

  if (!user) return null;

  return (
    <>
      {congrats && (
        <Modal onClose={() => setCongrats(null)}>
          <div className="text-center px-2">
            <div
              className="mx-auto mb-5 grid size-20 place-items-center rounded-full glow-violet animate-in zoom-in duration-500"
              style={{ background: "var(--gradient-primary)" }}
            >
              <PiggyBank className="size-10 text-primary-foreground" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-center gap-1.5">
              <Sparkles className="size-3.5" /> Você guardou dinheiro!
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-gradient mb-3">
              +{formatBRL(congrats.amount)}
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-foreground/90 mb-6 max-w-md mx-auto">
              {congrats.phrase}
            </p>
            <button
              onClick={() => setCongrats(null)}
              className="w-full rounded-2xl py-3.5 font-semibold text-sm text-primary-foreground transition active:scale-[0.98]"
              style={{ background: "var(--gradient-primary)" }}
            >
              Bora continuar guardando 🚀
            </button>
          </div>
        </Modal>
      )}

      {reminder && (
        <Modal onClose={closeReminder}>
          <div className="text-center px-2">
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-muted border border-border">
              <Bell className="size-8 text-primary" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
              Lembrete mensal
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Que tal guardar um pouquinho este mês?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
              Ainda não vimos nenhum valor guardado neste mês para sua meta financeira.
              Um pequeno depósito hoje já faz diferença lá na frente. 💪
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={closeReminder}
                className="rounded-2xl py-3 text-sm border border-border hover:bg-muted transition"
              >
                Depois
              </button>
              <a
                href="/bancos"
                onClick={closeReminder}
                className="rounded-2xl py-3 text-sm font-semibold text-[#001012] transition active:scale-[0.98] grid place-items-center"
                style={{ background: "linear-gradient(135deg,#e2e043,#f59e0f)" }}
              >
                Guardar agora
              </a>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md glass-strong rounded-3xl p-8 md:p-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-xl p-2 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
