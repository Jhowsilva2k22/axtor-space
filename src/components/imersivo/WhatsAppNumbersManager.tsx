import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Phone, Star } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type WppNumber = {
  id: string;
  label: string;
  phone: string;
  is_default: boolean;
};

type FormState = { label: string; phone: string };

export const WhatsAppNumbersManager = ({ tenantId }: { tenantId: string }) => {
  const [numbers, setNumbers] = useState<WppNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ label: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tenant_whatsapp_numbers")
      .select("id, label, phone, is_default")
      .eq("tenant_id", tenantId)
      .order("is_default", { ascending: false })
      .order("created_at");
    setNumbers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [tenantId]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ label: "", phone: "" });
    setAddOpen(true);
  };

  const openEdit = (n: WppNumber) => {
    setAddOpen(false);
    setEditingId(n.id);
    setForm({ label: n.label, phone: n.phone });
  };

  const cancelForm = () => { setAddOpen(false); setEditingId(null); };

  const handleSave = async () => {
    const phone = form.phone.replace(/\D/g, "");
    if (!phone || phone.length < 10) {
      toast.error("Número inválido. Use formato internacional, ex: 5511999999999");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("tenant_whatsapp_numbers")
          .update({ label: form.label || "Sem nome", phone })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const isFirst = numbers.length === 0;
        const { error } = await supabase
          .from("tenant_whatsapp_numbers")
          .insert({ tenant_id: tenantId, label: form.label || "Principal", phone, is_default: isFirst });
        if (error) throw error;
      }
      toast.success(editingId ? "Número atualizado." : "Número adicionado.");
      cancelForm();
      await load();
    } catch (e) {
      toast.error(`Erro: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este número? Funis que o usam voltarão para o número padrão do tenant.")) return;
    const { error } = await supabase.from("tenant_whatsapp_numbers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Número removido.");
    await load();
  };

  const handleSetDefault = async (id: string) => {
    setSaving(true);
    try {
      await supabase
        .from("tenant_whatsapp_numbers")
        .update({ is_default: false })
        .eq("tenant_id", tenantId);
      await supabase
        .from("tenant_whatsapp_numbers")
        .update({ is_default: true })
        .eq("id", id);
      toast.success("Número padrão atualizado.");
      await load();
    } catch (e) {
      toast.error(`Erro: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-gold/20 p-5 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl">Números de WhatsApp</h2>
          <p className="mt-1 text-xs leading-snug text-muted-foreground/70">
            Cadastre os números que aparecem como botão de contato nos funis. O número marcado como
            padrão é usado quando o funil não tem um número específico configurado.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-xl border-gold/40 text-primary max-sm:w-full"
          onClick={openAdd}
          disabled={addOpen || !!editingId}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {numbers.length === 0 && !addOpen && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum número cadastrado. Adicione um para habilitar o botão WhatsApp nos funis.
            </p>
          )}

          {numbers.map((n) => (
            <div key={n.id} className="rounded-2xl border border-gold/20 bg-muted/20 p-4">
              {editingId === n.id ? (
                <InlineForm
                  form={form}
                  onChange={setForm}
                  onSave={handleSave}
                  onCancel={cancelForm}
                  saving={saving}
                />
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.phone}</p>
                    </div>
                    {n.is_default && (
                      <Badge variant="outline" className="shrink-0 rounded-xl border-gold/30 text-[10px]">
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 shrink-0 max-sm:justify-end">
                    {!n.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-xl px-2 text-xs"
                        onClick={() => handleSetDefault(n.id)}
                        disabled={saving}
                      >
                        <Star className="h-3 w-3 mr-1" /> Padrão
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 rounded-xl px-2" onClick={() => openEdit(n)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-xl px-2 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(n.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addOpen && (
            <div className="rounded-2xl border border-gold/20 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Novo número</p>
              <InlineForm
                form={form}
                onChange={setForm}
                onSave={handleSave}
                onCancel={cancelForm}
                saving={saving}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

type InlineFormProps = {
  form: FormState;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
};

const InlineForm = ({ form, onChange, onSave, onCancel, saving }: InlineFormProps) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-xs">Nome / etiqueta</Label>
        <Input
          placeholder="Ex: Atendimento, Vendas..."
          value={form.label}
          onChange={(e) => onChange({ ...form, label: e.target.value })}
          maxLength={60}
          className="rounded-2xl"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Número (formato internacional)</Label>
        <Input
          placeholder="Ex: 5511999999999"
          value={form.phone}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
          maxLength={20}
          className="rounded-2xl"
        />
      </div>
    </div>
    <p className="text-[10px] leading-snug text-muted-foreground/70">
      Somente dígitos, incluindo código do país. Ex: 5511999999999 (BR + DDD + número).
    </p>
    <div className="flex gap-2 justify-end">
      <Button size="sm" variant="ghost" className="rounded-2xl" onClick={onCancel} disabled={saving}>Cancelar</Button>
      <Button size="sm" className="rounded-2xl" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
      </Button>
    </div>
  </div>
);
