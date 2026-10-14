import { Landmark, Sparkles } from "lucide-react";
import type { IconOption } from "@/components/IconPicker";
import nubank from "@/assets/brands/nubank.svg.asset.json";
import itau from "@/assets/brands/itau.svg.asset.json";
import santander from "@/assets/brands/santander.svg.asset.json";
import bb from "@/assets/brands/bb.svg.asset.json";
import mercadopago from "@/assets/brands/mercadopago.svg.asset.json";
import picpay from "@/assets/brands/picpay.svg.asset.json";
import infinitepay from "@/assets/brands/infinitepay.svg.asset.json";
import bradesco from "@/assets/brands/bradesco.svg.asset.json";
import caixa from "@/assets/brands/caixa.svg.asset.json";
import neon from "@/assets/brands/neon.svg.asset.json";
import inter from "@/assets/brands/inter.svg.asset.json";
import btg from "@/assets/brands/btg.svg.asset.json";
import sicredi from "@/assets/brands/sicredi.svg.asset.json";
import sicoob from "@/assets/brands/sicoob.svg.asset.json";
import xp from "@/assets/brands/xp.svg.asset.json";
import safra from "@/assets/brands/safra.svg.asset.json";
import xbox from "@/assets/brands/xbox.svg.asset.json";
import youtube from "@/assets/brands/youtube.svg.asset.json";
import amazon from "@/assets/brands/amazon.svg.asset.json";
import spotify from "@/assets/brands/spotify.svg.asset.json";
import netflix from "@/assets/brands/netflix.svg.asset.json";
import hbo from "@/assets/brands/hbo.svg.asset.json";
import ifood from "@/assets/brands/ifood.svg.asset.json";
import lovable from "@/assets/brands/lovable.svg.asset.json";
import chatgpt from "@/assets/brands/chatgpt.svg.asset.json";
import claude from "@/assets/brands/claude.svg.asset.json";
import disney from "@/assets/brands/disney.svg.asset.json";
export const BANK_LOGOS: IconOption[] = [
  { id: "nubank", label: "Nubank", icon: Landmark, image: nubank.url },
  { id: "itau", label: "Itaú", icon: Landmark, image: itau.url },
  { id: "santander", label: "Santander", icon: Landmark, image: santander.url },
  { id: "bb", label: "Banco do Brasil", icon: Landmark, image: bb.url },
  { id: "mercadopago", label: "Mercado Livre / Mercado Pago", icon: Landmark, image: mercadopago.url },
  { id: "picpay", label: "PicPay", icon: Landmark, image: picpay.url },
  { id: "infinitepay", label: "InfinitePay", icon: Landmark, image: infinitepay.url },
  { id: "bradesco", label: "Bradesco", icon: Landmark, image: bradesco.url },
  { id: "caixa", label: "Caixa", icon: Landmark, image: caixa.url },
  { id: "neon", label: "Neon", icon: Landmark, image: neon.url },
  { id: "inter", label: "Banco Inter", icon: Landmark, image: inter.url },
  { id: "btg", label: "BTG Pactual", icon: Landmark, image: btg.url },
  { id: "sicredi", label: "Sicredi", icon: Landmark, image: sicredi.url },
  { id: "sicoob", label: "Sicoob", icon: Landmark, image: sicoob.url },
  { id: "xp", label: "Banco XP", icon: Landmark, image: xp.url },
  { id: "safra", label: "Banco Safra", icon: Landmark, image: safra.url },
];
export const SERVICE_LOGOS: IconOption[] = [
  { id: "xbox", label: "Xbox Game Pass", icon: Sparkles, image: xbox.url },
  { id: "youtube", label: "YouTube Premium", icon: Sparkles, image: youtube.url },
  { id: "amazon", label: "Amazon Prime", icon: Sparkles, image: amazon.url },
  { id: "spotify", label: "Spotify", icon: Sparkles, image: spotify.url },
  { id: "netflix", label: "Netflix", icon: Sparkles, image: netflix.url },
  { id: "hbo", label: "HBO Max", icon: Sparkles, image: hbo.url },
  { id: "ifood", label: "iFood", icon: Sparkles, image: ifood.url },
  { id: "lovable", label: "Lovable", icon: Sparkles, image: lovable.url },
  { id: "chatgpt", label: "ChatGPT / GPT", icon: Sparkles, image: chatgpt.url },
  { id: "claude", label: "Claude", icon: Sparkles, image: claude.url },
  { id: "disney", label: "Disney+", icon: Sparkles, image: disney.url },
];
const normalize = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function bankLogoId(name: string) {
  const value = normalize(name);
  const aliases: Array<[string, string[]]> = [
    ["nubank", ["nubank", "nu bank"]], ["itau", ["itau"]], ["santander", ["santander", "santader"]],
    ["bb", ["banco do brasil"]], ["mercadopago", ["mercado pago", "mercado livre"]],
    ["picpay", ["picpay", "pic pay"]], ["infinitepay", ["infinitepay", "infinity pay", "infinite pay"]],
    ["bradesco", ["bradesco"]], ["caixa", ["caixa"]], ["neon", ["neon"]], ["inter", ["inter"]],
    ["btg", ["btg"]], ["sicredi", ["sicredi"]], ["sicoob", ["sicoob"]], ["xp", ["banco xp", "xp investimentos", "xp"]], ["safra", ["safra"]],
  ];
  return aliases.find(([, names]) => names.some(alias => value === alias || value.includes(alias)))?.[0];
}
