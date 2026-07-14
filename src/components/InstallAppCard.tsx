import { useEffect, useState } from "react";
import { Smartphone, ChevronDown, ChevronUp, Share, Plus, Check, Copy } from "lucide-react";
import { GlassCard } from "@/components/ui-kit";
import { TutorialBox } from "@/components/TutorialBox";
import iconApp from "@/assets/icone-app.png.asset.json";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function InstallAppCard() {
  const [open, setOpen] = useState(true);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [copied, setCopied] = useState(false);

  useEffect(() => { setPlatform(detectPlatform()); }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "CloseFinance",
          text: "Instale o CloseFinance na tela de início do seu iPhone",
          url: window.location.origin,
        });
      } catch { /* cancelado */ }
    } else {
      copyUrl();
    }
  }

  return (
    <GlassCard hideKey="perfil-install" hideLabel="Instalar app na tela de início">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary shrink-0">
            <Smartphone className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate">Instalar na tela de início</h2>
            <p className="text-[11px] font-mono text-muted-foreground truncate">
              atalho do CloseFinance no seu iPhone/Android
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} aria-label={open ? "Recolher" : "Expandir"}
          className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95 shrink-0">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white/5 p-4">
            <img
              src={iconApp.url}
              alt="Ícone do CloseFinance"
              className="size-16 rounded-2xl shadow-lg shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm">CloseFinance</p>
              <p className="text-[11px] font-mono text-muted-foreground break-words">
                Após instalar, o ícone aparece igual a um app nativo.
              </p>
            </div>
          </div>

          <TutorialBox
            storageKey="install-ios"
            title={platform === "android" ? "Como instalar no Android" : "Como instalar no iPhone (iOS)"}
            steps={
              platform === "android"
                ? [
                    "Abra este site no Google Chrome do seu Android.",
                    "Toque no menu ⋮ (canto superior direito).",
                    "Toque em 'Adicionar à tela inicial' ou 'Instalar app'.",
                    "Confirme o nome CloseFinance e toque em Adicionar.",
                  ]
                : [
                    "Abra este site no Safari (não funciona no Chrome do iPhone).",
                    "Toque no botão Compartilhar (quadrado com seta para cima) na barra inferior.",
                    "Role para baixo e toque em 'Adicionar à Tela de Início'.",
                    "Confirme o nome CloseFinance e toque em Adicionar no canto superior direito.",
                  ]
            }
            tip={platform === "ios"
              ? "No iPhone só funciona pelo Safari. Se estiver em outro navegador, copie o link abaixo e cole no Safari."
              : "Se não aparecer a opção, atualize seu navegador para a versão mais recente."}
          />

          <div className="grid sm:grid-cols-2 gap-2">
            <button
              onClick={shareLink}
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2.5 text-sm flex items-center justify-center gap-2 glow-violet active:scale-[0.98] transition"
            >
              <Share className="size-4" />
              {platform === "ios" ? "Abrir compartilhamento" : "Compartilhar link"}
            </button>
            <button
              onClick={copyUrl}
              className="rounded-xl border border-border px-4 py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-white/5 active:scale-[0.98] transition font-mono"
            >
              {copied ? <Check className="size-4 text-[#7DF2C5]" /> : <Copy className="size-4" />}
              {copied ? "Link copiado" : "Copiar link do app"}
            </button>
          </div>

          <div className="rounded-xl border border-border bg-white/5 p-3 flex items-start gap-2.5 text-[11px] font-mono text-muted-foreground">
            <Plus className="size-3.5 mt-0.5 shrink-0 text-primary" />
            <p>
              Ative os tutoriais em <span className="text-foreground">Preferências → Tutoriais</span>{" "}
              para ver as instruções passo a passo aparecerem automaticamente.
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
