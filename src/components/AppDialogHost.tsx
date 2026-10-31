import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertCircle, CircleHelp, PartyPopper, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { finishDialog, getDialogSnapshot, subscribeDialogs } from "@/lib/app-dialog";

export function AppDialogHost() {
  const request = useSyncExternalStore(subscribeDialogs, getDialogSnapshot, () => null);
  const [value, setValue] = useState("");
  useEffect(() => { setValue(request?.defaultValue ?? ""); }, [request]);
  const celebration = request?.message.includes("Parabéns");
  const destructive = request?.destructive ?? /^(Apagar|Excluir|Remover|Substituir)|exclusão definitiva|apagar TODOS/i.test(request?.message ?? "");
  const Icon = celebration ? PartyPopper : destructive ? AlertCircle : request?.kind === "prompt" ? CircleHelp : ShieldCheck;
  const finish = (result: boolean | string | null) => finishDialog(result, request?.id);
  return <Dialog key={request?.id ?? "closed"} open={Boolean(request)} onOpenChange={open => { if (!open) finish(request?.kind === "prompt" ? null : false); }}>
    <DialogContent className="w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto rounded-lg border-border bg-background text-foreground shadow-xl motion-reduce:animate-none">
      <DialogHeader>
        <div className={`mb-2 grid size-11 place-items-center rounded-lg ${destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}><Icon className="size-6" /></div>
        <DialogTitle>{request?.title ?? (celebration ? "Parabéns pela conquista!" : destructive ? "Confirmar exclusão" : request?.kind === "alert" ? "Aviso" : request?.kind === "prompt" ? "Definir acesso" : "Confirmar ação")}</DialogTitle>
        <DialogDescription className="whitespace-pre-line break-words leading-relaxed">{request?.message}</DialogDescription>
      </DialogHeader>
      <form onSubmit={event => { event.preventDefault(); finish(request?.kind === "prompt" ? value : true); }} className="space-y-4">
        {request?.kind === "prompt" && <input autoFocus type={request.secret ? "password" : "text"} aria-label={request.message} value={value} onChange={event => setValue(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />}
        <DialogFooter className="gap-2">
          {request?.kind !== "alert" && <Button type="button" variant="outline" onClick={() => finish(request?.kind === "prompt" ? null : false)}>{request?.cancelLabel ?? (celebration ? "Agora não" : "Cancelar")}</Button>}
          <Button type="submit" variant={destructive ? "destructive" : "default"}>{request?.confirmLabel ?? (request?.kind === "alert" ? "Entendi" : celebration ? "Sim, mover" : destructive ? "Confirmar exclusão" : "Confirmar")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}