import { Loader2, Save, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/Combobox";

/**
 * Onda 3 v2 Fase 3 (refactor) — componente apresentacional do Cabeçalho da Bio.
 *
 * Extraído de Admin.tsx (linhas 917-1050) preservando visual e UX idênticos.
 * Recebe props (controlled component): quem usa controla state e ações.
 *
 * Usado por:
 *   - Admin.tsx (state local existente)
 *   - BioHeaderEditorStandalone (state próprio via hook) → Painel novo
 */

export type BioHeaderConfig = {
  display_name: string;
  headline: string;
  sub_headline: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  footer_text: string | null;
};

export type BioHeaderEditorProps = {
  cfg: BioHeaderConfig;
  currentTenant: { slug?: string | null; display_name?: string | null } | null;
  saving: boolean;
  uploadingAvatar: boolean;
  uploadingCover: boolean;
  onUpdate: (patch: Partial<BioHeaderConfig>) => void;
  onSave: () => void | Promise<void>;
  onPickAvatarFile: (file: File) => void;
  onPickCoverFile: (file: File) => void;
  onRemoveCover: () => void | Promise<void>;
};

export const BioHeaderEditor = ({
  cfg,
  currentTenant,
  saving,
  uploadingAvatar,
  uploadingCover,
  onUpdate,
  onSave,
  onPickAvatarFile,
  onPickCoverFile,
  onRemoveCover,
}: BioHeaderEditorProps) => {
  return (
    <section id="admin-header-section" className="rounded-sm border-gold-gradient p-6">
      <h2 className="font-display text-2xl">
        Cabeçalho da <span className="text-gold italic">bio</span>
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Nome de exibição">
          <p className="mb-2 text-[10px] text-gold/60 italic font-light">
            O nome principal que todos verão no topo da sua bio.
          </p>
          <Input
            value={cfg.display_name}
            onChange={(e) => onUpdate({ display_name: e.target.value })}
            className="h-11 rounded-sm border-gold bg-input"
          />
        </Field>

        <Field label="Foto de perfil">
          <div className="flex gap-4">
            {cfg.avatar_url ? (
              <img
                src={cfg.avatar_url}
                alt="avatar"
                className="h-16 w-16 shrink-0 rounded-full border border-gold object-cover"
              />
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-full border border-dashed border-gold/50" />
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
              <div>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[10px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {uploadingAvatar ? "Enviando..." : "Enviar foto"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingAvatar}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onPickAvatarFile(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <Input
                value={cfg.avatar_url ?? ""}
                onChange={(e) => onUpdate({ avatar_url: e.target.value })}
                placeholder="ou cole uma URL https://..."
                className="h-9 rounded-sm border-gold/50 bg-input text-xs"
              />
            </div>
          </div>
        </Field>

        <Field label="Headline (frase principal)" full>
          <p className="mb-2 text-[10px] text-gold/60 italic font-light">
            Sua promessa ou descrição curta de alto impacto (Bio do Instagram).
          </p>
          <Textarea
            value={cfg.headline}
            onChange={(e) => onUpdate({ headline: e.target.value })}
            rows={3}
            className="rounded-sm border-gold bg-input"
          />
        </Field>

        <Field label="Sub-headline (linha pequena)">
          <p className="mb-2 text-[10px] text-gold/60 italic font-light">
            Um texto de apoio para dar mais contexto à sua oferta.
          </p>
          <Input
            value={cfg.sub_headline ?? ""}
            onChange={(e) => onUpdate({ sub_headline: e.target.value || null })}
            className="h-11 rounded-sm border-gold bg-input"
          />
        </Field>

        <Field label="Footer">
          <Combobox
            value={cfg.footer_text ?? ""}
            onChange={(v) => onUpdate({ footer_text: v })}
            presets={(() => {
              const name = (cfg.display_name || currentTenant?.display_name || "").trim();
              const slug = currentTenant?.slug ?? "";
              const year = new Date().getFullYear();
              return [
                slug ? `axtor.space/${slug}` : "",
                name ? `© ${year} ${name}` : "",
                "Feito com presença",
                "Todos os direitos reservados",
              ].filter(Boolean);
            })()}
            placeholder="Texto do rodapé (opcional)"
            customLabel="Usar texto personalizado"
          />
          {cfg.footer_text && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              prévia: <span className="text-primary">{cfg.footer_text}</span>
            </p>
          )}
        </Field>

        <Field label="Capa de fundo (opcional)" full>
          <p className="mb-3 text-[10px] text-gold/60 italic font-light">
            Cria um fundo cinematográfico com efeito de profundidade (Blur + Parallax).
          </p>
          <div className="flex flex-col gap-3">
            {cfg.cover_url ? (
              <div className="relative h-32 w-full overflow-hidden rounded-sm border border-gold">
                <img src={cfg.cover_url} alt="capa" className="h-full w-full object-cover" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, transparent 0%, transparent 30%, hsl(var(--background) / 0.65) 70%, hsl(var(--background) / 0.92) 100%)",
                  }}
                />
                <div className="absolute bottom-2 right-2 rounded-sm border border-gold bg-background/80 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-primary backdrop-blur">
                  prévia com vinheta
                </div>
              </div>
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-sm border border-dashed border-gold/40 bg-card/30">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  sem capa — fundo do tema
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploadingCover ? "Enviando..." : cfg.cover_url ? "Trocar capa" : "Enviar capa"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickCoverFile(f);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              {cfg.cover_url && (
                <Button
                  type="button"
                  onClick={() => onRemoveCover()}
                  variant="ghost"
                  className="h-10 rounded-sm border border-border px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </Button>
              )}
            </div>
          </div>
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          onClick={() => onSave()}
          disabled={saving}
          className="btn-luxe h-11 rounded-sm px-6 text-xs uppercase tracking-[0.2em]"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar cabeçalho
            </>
          )}
        </Button>
      </div>
    </section>
  );
};

const Field = ({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) => (
  <div className={full ? "md:col-span-2" : ""}>
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </label>
    {children}
  </div>
);
