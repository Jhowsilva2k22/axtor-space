import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

export type Tenant = {
  id: string;
  slug: string;
  display_name: string;
  plan: string;
  status: string;
};

type TenantCtx = {
  tenant: Tenant | null;
  loading: boolean;
  error: "not_found" | "suspended" | "network" | null;
};

const Ctx = createContext<TenantCtx>({ tenant: null, loading: true, error: null });

// Tenant default (joanderson) — usado quando não há subdomínio nem ?tenant=
const DEFAULT_TENANT_SLUG = "joanderson";

const ROOT_DOMAINS = ["axtor.space", "www.axtor.space", "lovable.app", "lovable.dev"];
const PREVIEW_HOST_PATTERNS = [/^id-preview--/, /\.lovable\.app$/, /\.lovableproject\.com$/];

// Rotas reservadas — primeiro segmento da URL que NÃO é slug de tenant
const RESERVED_PATHS = new Set([
  "admin",
  "bio",
  "d",
  "r",
  "api",
  "auth",
  "login",
  "signup",
  "signin",
  "signout",
  "logout",
  "assets",
  "static",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

const resolveSlugFromLocation = (): string => {
  if (typeof window === "undefined") return DEFAULT_TENANT_SLUG;
  const url = new URL(window.location.href);

  // 1) Override explícito por query string (útil em dev/preview)
  const qs = url.searchParams.get("tenant");
  if (qs) return qs;

  const host = url.hostname;
  const firstSegment = url.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  const pathSlug =
    firstSegment && !RESERVED_PATHS.has(firstSegment) && SLUG_RE.test(firstSegment)
      ? firstSegment
      : null;

  // 2) localhost / IPs / preview da Lovable → path-slug se houver, senão default
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return pathSlug ?? DEFAULT_TENANT_SLUG;
  if (PREVIEW_HOST_PATTERNS.some((re) => re.test(host))) return pathSlug ?? DEFAULT_TENANT_SLUG;

  // 3) Domínio raiz da axtor.space → path-based (axtor.space/joanderson) ou default
  if (ROOT_DOMAINS.includes(host)) return pathSlug ?? DEFAULT_TENANT_SLUG;

  // 4) Subdomínio (legado/premium): pega a primeira parte (joanderson de joanderson.axtor.space)
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0];

  return DEFAULT_TENANT_SLUG;
};

const CACHE_PREFIX = "tenant-cache-v1:";

const readCache = (slug: string): Tenant | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + slug);
    return raw ? (JSON.parse(raw) as Tenant) : null;
  } catch {
    return null;
  }
};

const writeCache = (slug: string, t: Tenant) => {
  try {
    sessionStorage.setItem(CACHE_PREFIX + slug, JSON.stringify(t));
  } catch {
    // ignore
  }
};

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<TenantCtx["error"]>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const slug = resolveSlugFromLocation();

    // Hidrata instantâneo do cache pra evitar flash
    const cached = readCache(slug);
    if (cached) {
      setTenant(cached);
      setLoading(false);
    }

    (async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc("resolve_tenant_by_slug", { _slug: slug });
        if (cancelled) return;
        if (rpcError) {
          setError("network");
          setLoading(false);
          return;
        }
        const row = (data as Tenant[] | null)?.[0] ?? null;
        if (!row) {
          setTenant(null);
          setError("not_found");
          setLoading(false);
          return;
        }
        if (row.status !== "active") {
          setTenant(row);
          setError("suspended");
          setLoading(false);
          return;
        }
        setTenant(row);
        setError(null);
        setLoading(false);
        writeCache(slug, row);
      } catch {
        if (!cancelled) {
          setError("network");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  return <Ctx.Provider value={{ tenant, loading, error }}>{children}</Ctx.Provider>;
};

export const useTenant = () => useContext(Ctx);
