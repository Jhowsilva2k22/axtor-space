// Persistência leve do "tenant em construção" enquanto o usuário confirma o email.
// Quando email-confirm está ON, o signUp não retorna sessão e perdemos a chance
// de chamar create_tenant_for_user. Salvamos aqui e o Admin completa depois.

const KEY = "axtor.pendingSignup.v1";

export type PendingSignup = {
  slug: string;
  displayName: string;
  inviteCode: string | null;
  email: string;
  createdAt: number;
};

export const savePendingSignup = (data: Omit<PendingSignup, "createdAt">) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, createdAt: Date.now() }));
  } catch {
    // ignore
  }
};

export const readPendingSignup = (): PendingSignup | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    // expira em 24h pra não ficar lixo
    if (Date.now() - parsed.createdAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearPendingSignup = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};