import { createFileRoute } from "@tanstack/react-router";
import html from "@/content/vendas.html?raw";

export const Route = createFileRoute("/vendas")({
  head: () => ({ meta: [
    { title: "CloseFinance — Organize sua vida financeira de verdade" },
    { name: "description", content: "Conheça o CloseFinance: ganhos, gastos, cartões, bancos e dívidas em um só app." },
    { property: "og:title", content: "CloseFinance — Organize sua vida financeira de verdade" },
    { property: "og:description", content: "Organize ganhos, gastos, cartões, bancos e dívidas com o CloseFinance." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        }),
    },
  },
});
