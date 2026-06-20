import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

const KEY = "closefinance:consent:v1";

export function ConsentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {}
  }, []);

  if (!open) return null;

  const accept = () => {
    try { localStorage.setItem(KEY, new Date().toISOString()); } catch {}
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in duration-200">
      <div className="glass-strong w-full max-w-lg rounded-3xl p-6 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center">
            <ShieldCheck className="size-5 text-primary-foreground" />
          </div>
          <h2 className="font-display font-bold text-lg leading-tight">Termo de Consentimento e Privacidade</h2>
        </div>

        <div className="overflow-y-auto pr-2 text-sm text-foreground/85 space-y-3 leading-relaxed flex-1">
          <p>Ao criar uma conta no <strong>Close Finance</strong>, declaro que li e concordo com os Termos de Uso e a Política de Privacidade da plataforma.</p>
          <p>Autorizo o tratamento dos meus dados pessoais para as finalidades necessárias à prestação dos serviços oferecidos pelo Close Finance, incluindo:</p>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Criação e gerenciamento da minha conta;</li>
            <li>Organização e acompanhamento financeiro;</li>
            <li>Personalização da experiência de uso;</li>
            <li>Disponibilização de conteúdos de educação financeira;</li>
            <li>Comunicação relacionada aos serviços da plataforma;</li>
            <li>Cumprimento de obrigações legais e regulatórias;</li>
            <li>Segurança, prevenção à fraude e proteção dos usuários.</li>
          </ul>
          <p>O tratamento dos dados pessoais será realizado em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD).</p>

          <h3 className="font-semibold text-foreground mt-2">Controlador dos Dados</h3>
          <p>O Close Finance atua como Controlador dos dados pessoais coletados por meio da plataforma, sendo responsável pelas decisões referentes ao tratamento dessas informações.</p>

          <h3 className="font-semibold text-foreground mt-2">Direitos do Titular dos Dados</h3>
          <p>Nos termos da LGPD, o usuário poderá, a qualquer momento:</p>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Confirmar a existência de tratamento de seus dados;</li>
            <li>Solicitar acesso aos dados armazenados;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a portabilidade dos dados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Revogar consentimentos anteriormente concedidos;</li>
            <li>Solicitar a exclusão de seus dados pessoais, observadas as obrigações legais de retenção.</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-2">Contato</h3>
          <p>Para dúvidas, solicitações relacionadas aos seus dados pessoais ou exercício de seus direitos previstos na LGPD, entre em contato através do e-mail:</p>
          <p><a href="mailto:filipewesley007@gmail.com" className="text-primary underline">filipewesley007@gmail.com</a></p>
          <p className="text-xs text-muted-foreground">Ao prosseguir com o cadastro e utilizar a plataforma, o usuário declara estar ciente e de acordo com os termos descritos neste documento.</p>
        </div>

        <button onClick={accept} className="mt-5 w-full rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold py-3 shadow-[var(--shadow-glow-violet)] hover:opacity-95 active:scale-[0.98] transition">
          Li e aceito todos os termos de uso
        </button>
      </div>
    </div>
  );
}
