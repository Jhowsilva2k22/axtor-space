// Validações de lead — client-side, zero custo

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
  "throwawaymail.com", "fakeinbox.com", "trashmail.com", "yopmail.com",
  "getnada.com", "mintemail.com", "sharklasers.com", "maildrop.cc",
  "dispostable.com", "tempinbox.com", "spamgourmet.com", "mohmal.com",
]);

const COMMON_DOMAINS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.br",
  "icloud.com", "live.com", "uol.com.br", "bol.com.br", "terra.com.br",
  "globo.com", "me.com", "msn.com",
];

// Levenshtein simples
function lev(a: string, b: string) {
  if (a === b) return 0;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function suggestEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain || COMMON_DOMAINS.includes(domain)) return null;
  let best: { d: string; dist: number } | null = null;
  for (const d of COMMON_DOMAINS) {
    const dist = lev(domain, d);
    if (dist > 0 && dist <= 2 && (!best || dist < best.dist)) best = { d, dist };
  }
  return best ? email.slice(0, at + 1) + best.d : null;
}

export function validateEmail(raw: string): { ok: boolean; error?: string; suggestion?: string } {
  const email = raw.trim().toLowerCase();
  if (!email) return { ok: false, error: "Email obrigatório" };
  // Regex pragmática
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!re.test(email)) return { ok: false, error: "Email inválido" };
  const domain = email.split("@")[1];
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, error: "Use um email pessoal real (não temporário)" };
  }
  const suggestion = suggestEmailDomain(email);
  if (suggestion) return { ok: true, suggestion };
  return { ok: true };
}

// Nome: 2+ palavras, cada uma com 2+ letras, só letras/acentos/hífen/apóstrofo
export function validateName(raw: string): { ok: boolean; error?: string } {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Nome obrigatório" };
  if (name.length < 5) return { ok: false, error: "Digite seu nome completo" };
  const parts = name.split(" ");
  if (parts.length < 2) return { ok: false, error: "Digite nome e sobrenome" };
  const partRe = /^[a-záàâãäéèêëíìîïóòôõöúùûüç'-]{2,}$/i;
  for (const p of parts) {
    if (!partRe.test(p)) return { ok: false, error: "Nome inválido (use só letras)" };
  }
  return { ok: true };
}

// DDDs válidos no Brasil
const VALID_DDD = new Set([
  11,12,13,14,15,16,17,18,19,
  21,22,24,27,28,
  31,32,33,34,35,37,38,
  41,42,43,44,45,46,47,48,49,
  51,53,54,55,
  61,62,63,64,65,66,67,68,69,
  71,73,74,75,77,79,
  81,82,83,84,85,86,87,88,89,
  91,92,93,94,95,96,97,98,99,
]);

export function maskPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return d;
}

export function validatePhoneBR(raw: string, optional = true): { ok: boolean; error?: string } {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return optional ? { ok: true } : { ok: false, error: "Telefone obrigatório" };
  if (d.length !== 11) return { ok: false, error: "Telefone deve ter 11 dígitos com DDD" };
  const ddd = parseInt(d.slice(0, 2), 10);
  if (!VALID_DDD.has(ddd)) return { ok: false, error: "DDD inválido" };
  if (d[2] !== "9") return { ok: false, error: "Celular precisa começar com 9" };

  // Bloqueia números fake
  // 1) todos dígitos iguais (00000000000, 11111111111...)
  if (/^(\d)\1+$/.test(d)) return { ok: false, error: "Número inválido" };
  // 2) sequência crescente/decrescente do número inteiro
  if ("01234567890".includes(d) || "09876543210".includes(d)) {
    return { ok: false, error: "Número inválido" };
  }
  // 3) 8 dígitos do celular (após DDD+9) com baixíssima entropia: ≤2 dígitos únicos
  const cell = d.slice(3);
  const unique = new Set(cell).size;
  if (unique <= 2) return { ok: false, error: "Número inválido" };
  // 4) 8 dígitos do celular sendo sequência
  if ("01234567890".includes(cell) || "09876543210".includes(cell)) {
    return { ok: false, error: "Número inválido" };
  }

  return { ok: true };
}
