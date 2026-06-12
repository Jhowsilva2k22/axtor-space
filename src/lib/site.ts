// Domínio público canônico do app — fonte ÚNICA pra montar links compartilháveis
// (bio, link de captação, convites, QR, diagnóstico). Use SEMPRE isto, nunca
// `window.location.origin` — senão o link sai com o domínio que o admin está
// navegando no momento (ex.: axtor-space.vercel.app) em vez do oficial.
//
// Sobrescrevível por env (VITE_PUBLIC_SITE_URL) caso o domínio mude um dia.
export const PUBLIC_BASE_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://axtor.space";

// Monta uma URL pública a partir de um path (com ou sem "/" inicial).
export const publicUrl = (path = ""): string => {
  if (!path) return PUBLIC_BASE_URL;
  return `${PUBLIC_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
