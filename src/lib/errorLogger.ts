import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "axtor:error-buffer-v1";
const MAX_LOCAL = 50;

export type LoggedError = {
  ts: string;
  severity: "error" | "warning" | "boundary" | "promise";
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  userAgent?: string;
  extra?: Record<string, unknown>;
};

const safeRead = (): LoggedError[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as LoggedError[]) : [];
  } catch {
    return [];
  }
};

const safeWrite = (list: LoggedError[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(-MAX_LOCAL)));
  } catch {
    /* ignora quota */
  }
};

export const readLocalErrors = (): LoggedError[] => safeRead();

export const clearLocalErrors = () => {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* noop */
  }
};

const truncate = (s: string | undefined, max: number) =>
  s == null ? null : s.length > max ? s.slice(0, max) : s;

export const logError = async (input: Omit<LoggedError, "ts" | "userAgent" | "route"> & {
  route?: string;
}) => {
  const entry: LoggedError = {
    ts: new Date().toISOString(),
    severity: input.severity,
    message: input.message?.slice(0, 4000) ?? "(sem mensagem)",
    stack: truncate(input.stack, 16000) ?? undefined,
    componentStack: truncate(input.componentStack, 16000) ?? undefined,
    route: input.route ?? (typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    extra: input.extra,
  };

  const buf = safeRead();
  buf.push(entry);
  safeWrite(buf);

  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("client_error_log").insert({
      severity: entry.severity,
      message: entry.message,
      stack: entry.stack ?? null,
      component_stack: entry.componentStack ?? null,
      route: entry.route ?? null,
      user_agent: entry.userAgent ?? null,
      user_id: userData?.user?.id ?? null,
      user_email: userData?.user?.email ?? null,
      app_version: (import.meta as any).env?.VITE_APP_VERSION ?? null,
      extra: (entry.extra as any) ?? null,
    });
  } catch (err) {
    // Falha de rede/RLS não pode causar segundo crash. Buffer local fica.
    console.warn("[errorLogger] insert falhou", err);
  }
};

let installed = false;
export const installGlobalErrorHandlers = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (ev) => {
    void logError({
      severity: "error",
      message: ev.message ?? String(ev.error ?? "erro desconhecido"),
      stack: ev.error?.stack,
      extra: { filename: ev.filename, lineno: ev.lineno, colno: ev.colno },
    });
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const reason = ev.reason;
    void logError({
      severity: "promise",
      message: typeof reason === "string" ? reason : reason?.message ?? "promise rejeitada",
      stack: reason?.stack,
    });
  });
};