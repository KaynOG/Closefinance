// 30+ saudações rotativas exibidas no Dashboard a cada login.
// Use {name} como placeholder do primeiro nome do usuário.
const GREETINGS: string[] = [
  "Olá, {name}, esse mês tá tranquilo?",
  "E aí, {name}? Tá favorável o financeiro?",
  "Bom te ver, {name}. Pronto pra fechar o mês no azul?",
  "Oi, {name}! Bora dar uma olhada nos números?",
  "Hey, {name}, como tá o bolso hoje?",
  "Salve, {name}! Tudo certo com os gastos?",
  "Olá, {name}, o cofrinho tá feliz?",
  "E aí, {name}, mês tranquilo ou agitado?",
  "Bem-vindo de volta, {name}. Vamos planejar?",
  "Oi, {name}! Já registrou os gastos de hoje?",
  "Olá, {name}, o que vamos economizar hoje?",
  "Tudo bem, {name}? Suas finanças agradecem a visita.",
  "Olá, {name}, esse mês tá saudável?",
  "E aí, {name}, pronto pra bater a meta?",
  "Salve, {name}! Bora fechar bem o mês?",
  "Oi, {name}, como anda a saúde financeira?",
  "Hey, {name}! Hoje é dia de poupar?",
  "Olá, {name}, manda ver no controle de hoje.",
  "Bom dia financeiro, {name}!",
  "E aí, {name}? Quem manda no seu dinheiro hoje é você.",
  "Olá, {name}, tá no caminho da meta anual.",
  "Oi, {name}! Cada real conta — bora registrar?",
  "Salve, {name}, o azul tá perto, sente?",
  "Olá, {name}, vamos olhar onde o dinheiro foi parar?",
  "E aí, {name}? Pequenas economias, grandes vitórias.",
  "Oi, {name}, hoje é um bom dia pra revisar o cartão.",
  "Olá, {name}, tá com tudo sob controle?",
  "Hey, {name}! Bora caçar gastos invisíveis?",
  "Salve, {name}, o futuro agradece o que você faz hoje.",
  "Olá, {name}, vamos turbinar a reserva?",
  "E aí, {name}? Disciplina hoje, liberdade amanhã.",
  "Oi, {name}, tá pronto pra mais uma vitória financeira?",
  "Olá, {name}, suas missões esperam por você.",
  "Bem-vindo, {name}. Bolso fechado, financeiro guardado.",
];

/**
 * Sorteia uma saudação por sessão. Persiste em sessionStorage para
 * que a frase só mude quando o usuário fizer um novo login.
 */
export function pickGreeting(fullName: string | undefined | null): string {
  const name = (fullName ?? "").trim().split(" ")[0] || "amigo";
  const key = "closefinance:greeting";
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(key);
    if (cached) return cached.replace("{name}", name);
    const tpl = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    sessionStorage.setItem(key, tpl);
    return tpl.replace("{name}", name);
  }
  return GREETINGS[0].replace("{name}", name);
}

export function clearGreeting() {
  if (typeof window !== "undefined") sessionStorage.removeItem("closefinance:greeting");
}
