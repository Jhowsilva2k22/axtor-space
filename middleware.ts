// Vercel Edge Middleware — injeta meta tags OpenGraph POR TENANT na bio (/:slug).
//
// Por quê: a bio é uma SPA (React). Crawlers de link (WhatsApp, Google, etc.) NÃO
// executam JavaScript, então leem só as meta fixas do index.html (genéricas/Axtor).
// Aqui, no edge, reescrevemos o HTML com nome + foto + headline do tenant antes
// de servir — assim o preview do link mostra o perfil certo. Funciona pro crawler
// e pro usuário, sem flash. Usa a anon key (leitura pública, protegida por RLS).

export const config = {
  // Roda em qualquer rota SEM ponto (exclui assets .js/.css/.png/etc) e fora de api/assets.
  // O filtro fino (paths reservados, /:slug de 1 nível) é feito no código.
  matcher: ["/((?!api/|assets/|.*\\.).*)"],
};

// Caminhos que NÃO são slug de tenant (devem manter o preview genérico).
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
const ANON = process.env.VITE_SUPABASE_ANON_KEY;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const seg = url.pathname.split("/").filter(Boolean);

  // Só intercepta /:slug de um único nível (a bio pública do tenant).
  if (seg.length !== 1) return;
  const slug = seg[0].toLowerCase();
  if (RESERVED.has(slug)) return;
  if (!SUPABASE_URL || !ANON) return;

  // Busca os dados PÚBLICOS do tenant (nome, headline, avatar).
  let name = "";
  let headline = "";
  let avatar = "";
  try {
    // 1) Resolve o tenant pelo slug via RPC pública (anon NÃO lê a tabela direto).
    const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_tenant_by_slug`, {
      method: "POST",
      headers: {
        apikey: ANON,
        authorization: `Bearer ${ANON}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ _slug: slug }),
    });
    if (!rpc.ok) return;
    const trows = (await rpc.json()) as any[];
    const t = Array.isArray(trows) ? trows[0] : null;
    if (!t?.id) return; // slug não é um tenant → mantém genérico
    name = String(t.display_name || "");

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
  } catch {
    return; // qualquer falha → deixa o preview genérico
  }

  if (!name) return;

  // Pega o HTML estático (sem ponto no path → não re-dispara a middleware).
  const res = await fetch(new URL("/index.html", url.origin));
  if (!res.ok) return;
  let html = await res.text();

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

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // cache no edge por 5min, revalida em background por 1 dia
      "cache-control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
