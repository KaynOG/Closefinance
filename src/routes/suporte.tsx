import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MessageCircle, Mail, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/suporte")({
  head: () => ({ meta: [{ title: "Suporte | CloseFinance" }, { name: "description", content: "Fale com o time do CloseFinance pelo WhatsApp ou e-mail." }] }),
  component: SuportePage,
});

function SuportePage() {
  const wpp = "5531993579103";
  const email = "filipewesley007@gmail.com";
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center">
            <LifeBuoy className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">Central de Suporte</h1>
            <p className="text-sm text-muted-foreground">Estamos aqui para ajudar você.</p>
          </div>
        </header>

        <div className="glass rounded-3xl p-6 space-y-3">
          <p className="text-base leading-relaxed">
            Olá! 👋 Que bom ter você por aqui. Se você tem dúvidas, sugestões ou
            precisa de ajuda para usar o <strong>CloseFinance</strong>, nossa
            equipe terá o maior prazer em te atender. Escolha o canal que
            preferir abaixo e responderemos o mais rápido possível.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href={`https://wa.me/${wpp}`}
            target="_blank" rel="noopener noreferrer"
            className="glass rounded-3xl p-5 flex flex-col gap-3 hover:bg-white/5 transition active:scale-[0.98] group"
          >
            <div className="size-11 rounded-2xl bg-emerald-500/20 text-emerald-400 grid place-items-center">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <p className="font-semibold">WhatsApp</p>
              <p className="text-sm text-muted-foreground font-mono">(31) 99357-9103</p>
            </div>
            <span className="mt-auto text-xs text-primary group-hover:underline">Abrir conversa →</span>
          </a>

          <a
            href={`mailto:${email}`}
            className="glass rounded-3xl p-5 flex flex-col gap-3 hover:bg-white/5 transition active:scale-[0.98] group"
          >
            <div className="size-11 rounded-2xl bg-primary/20 text-primary grid place-items-center">
              <Mail className="size-5" />
            </div>
            <div>
              <p className="font-semibold">E-mail</p>
              <p className="text-sm text-muted-foreground font-mono break-all">{email}</p>
            </div>
            <span className="mt-auto text-xs text-primary group-hover:underline">Enviar mensagem →</span>
          </a>
        </div>
      </div>
    </AppShell>
  );
}
