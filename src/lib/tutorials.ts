// Preferência local: tutoriais para novos usuários.
// Desabilitada por padrão; usuário ativa em Perfil.
const KEY_ENABLED = "cf_tutorials_enabled";
const KEY_NOTICE_DISMISSED = "cf_tutorials_notice_dismissed";

export function areTutorialsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY_ENABLED) === "1";
}
export function setTutorialsEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_ENABLED, v ? "1" : "0");
  window.dispatchEvent(new Event("cf:tutorials-changed"));
}
export function onTutorialsChange(cb: () => void) {
  const l = () => cb();
  window.addEventListener("cf:tutorials-changed", l);
  window.addEventListener("storage", l);
  return () => {
    window.removeEventListener("cf:tutorials-changed", l);
    window.removeEventListener("storage", l);
  };
}

export function isTutorialNoticeDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY_NOTICE_DISMISSED) === "1";
}
export function dismissTutorialNotice() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_NOTICE_DISMISSED, "1");
}
