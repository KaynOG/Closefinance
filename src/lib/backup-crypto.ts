// AES-256-GCM com chave derivada por PBKDF2-SHA256 (Web Crypto, roda só no navegador).
const ITER = 310_000;
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;

async function deriveKey(pass: string, salt: Uint8Array<ArrayBuffer>, iter: number) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

function chunkedB64(u: Uint8Array) {
  let out = "";
  for (let i = 0; i < u.length; i += 0x8000) out += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(out);
}

export async function encryptBackup(plain: string, pass: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt, ITER);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
  return JSON.stringify({ app: "CloseFinance", encrypted: true, v: 1, alg: "AES-256-GCM", kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), data: chunkedB64(ct) });
}

export function isEncryptedBackup(raw: string) {
  try { const p = JSON.parse(raw); return p?.app === "CloseFinance" && p?.encrypted === true; } catch { return false; }
}

export async function decryptBackup(raw: string, pass: string) {
  const p = JSON.parse(raw);
  const key = await deriveKey(pass, unb64(p.salt), p.iter ?? ITER);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv) }, key, unb64(p.data));
  return new TextDecoder().decode(pt);
}
