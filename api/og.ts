// Vercel Edge Function — devolve o HTML da bio com meta OpenGraph POR TENANT.
//
// A bio é uma SPA (React); crawlers de link (WhatsApp, Google, etc.) não rodam JS,
// então leem só as meta fixas do index.html (genéricas). O vercel.json roteia
// requisições de CRAWLER em /:slug pra cá (por user-agent); aqui buscamos
// nome/foto/headline do tenant e reescrevemos as meta antes de devolver.
// Usuário normal continua na SPA (não passa por aqui). Usa anon key (RLS público).

export const config = { runtime: "edge" };

const RESERVED = new Set([
  "",
  "planos",
  "vendas",
  "diagnostico",
  "signup",
  "login",
  "signin",
  "admin",
  "painel",
  "loja",
  "bem-vindo",
  "obrigado",
  "privacidade",
  "privacy",
  "termos",
  "terms",
  "unsubscribe",
  "reset",
  "forgot-password",
  "reset-password",
  "d",
  "r",
  "bio",
  "api",
  "auth",
]);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase();

  // HTML base (estático) — sempre devolvemos algo.
  const baseRes = await fetch(new URL("/index.html", url.origin));
  let html = await baseRes.text();

  if (slug && !RESERVED.has(slug) && SUPABASE_URL && ANON) {
    try {
      // 1) Resolve o tenant pelo slug via RPC pública.
      const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_tenant_by_slug`, {
        method: "POST",
        headers: {
          apikey: ANON,
          authorization: `Bearer ${ANON}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ _slug: slug }),
      });
      if (rpc.ok) {
        const trows = (await rpc.json()) as any[];
        const t = Array.isArray(trows) ? trows[0] : null;
        if (t?.id) {
          let name = String(t.display_name || "");
          let headline = "";
          let avatar = "";

          // 2) bio_config do tenant (anon lê direto) → nome, headline, avatar.
          const cfgRes = await fetch(
            `${SUPABASE_URL}/rest/v1/bio_config?tenant_id=eq.${t.id}&select=display_name,headline,avatar_url`,
            { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } },
          );
          if (cfgRes.ok) {
            const crows = (await cfgRes.json()) as any[];
            const cfg = Array.isArray(crows) ? crows[0] : null;
            if (cfg) {
              if (cfg.display_name) name = String(cfg.display_name);
              headline = String(cfg.headline || "");
              avatar = String(cfg.avatar_url || "");
            }
          }

          if (name) {
            const title = `${name} — Axtor Space`;
            const desc = headline || `Conheça ${name} no Axtor Space.`;
            const img = avatar || "https://axtor.space/og-image.png";
            const sub = (re: RegExp, val: string) => {
              html = html.replace(re, val);
            };
            sub(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
            sub(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
            sub(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
            sub(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
            sub(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
            sub(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
            sub(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(img)}$2`);
            sub(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(img)}$2`);
          }
        }
      }
    } catch {
      // qualquer falha → devolve o HTML genérico (já em `html`)
    }
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
