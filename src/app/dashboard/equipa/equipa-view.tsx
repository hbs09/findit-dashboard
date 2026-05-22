"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Mail,
  UserPlus,
  Crown,
  Shield,
  Trash2,
  Sparkles,
  Check,
  X,
  Clock,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  email: string;
  status: "ativo" | "pendente" | "recusado";
  role: "gerente" | "staff";
  display_name: string;
  avatar_url: string | null;
  specialty_ids: string[];
};

type Service = { id: string; nome: string };

export function EquipaView({
  salonId,
  members,
  services,
}: {
  salonId: string;
  members: Member[];
  services: Service[];
}) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [editingSpecs, setEditingSpecs] = useState<Member | null>(null);

  const active = members.filter((m) => m.status === "ativo");
  const pending = members.filter((m) => m.status === "pendente");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Gestão"
        title="Equipa"
        description={`${active.length} membros ativos · ${pending.length} convites pendentes`}
        action={
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Convidar membro
          </button>
        }
      />

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sem membros na equipa"
          description="Começa por convidar colegas para gerir marcações contigo."
        />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Convites pendentes
              </h2>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {pending.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    services={services}
                    onEditSpecs={() => setEditingSpecs(m)}
                    onRefresh={() => router.refresh()}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Membros ativos
            </h2>
            {active.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Sem membros ativos"
                description="Os convites enviados aparecem em pendentes até serem aceites."
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {active.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    services={services}
                    onEditSpecs={() => setEditingSpecs(m)}
                    onRefresh={() => router.refresh()}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {showInvite && (
        <InviteDialog
          salonId={salonId}
          onClose={() => setShowInvite(false)}
          onCreated={() => router.refresh()}
        />
      )}

      {editingSpecs && (
        <SpecialtiesDialog
          member={editingSpecs}
          services={services}
          onClose={() => setEditingSpecs(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

function MemberRow({
  member,
  services,
  onEditSpecs,
  onRefresh,
}: {
  member: Member;
  services: Service[];
  onEditSpecs: () => void;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggleRole() {
    setBusy(true);
    const next = member.role === "gerente" ? "staff" : "gerente";
    const supabase = getSupabase();
    const { error } = await supabase
      .from("salon_staff")
      .update({ role: next })
      .eq("id", member.id);
    setBusy(false);
    if (error) {
      toast.error("Erro ao atualizar role");
      return;
    }
    toast.success(`${member.display_name} agora é ${next}`);
    onRefresh();
  }

  async function remove() {
    if (!confirm(`Remover ${member.display_name} da equipa?`)) return;
    setBusy(true);
    const supabase = getSupabase();
    const { error } = await supabase
      .from("salon_staff")
      .delete()
      .eq("id", member.id);
    setBusy(false);
    if (error) {
      toast.error("Erro ao remover membro");
      return;
    }
    toast.success("Membro removido");
    onRefresh();
  }

  const specNames = services
    .filter((s) => member.specialty_ids.includes(s.id))
    .map((s) => s.nome);

  return (
    <div className="p-4 flex items-center gap-4">
      <Avatar name={member.display_name} url={member.avatar_url} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm truncate">
            {member.display_name}
          </span>
          {member.role === "gerente" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
              <Crown className="h-2.5 w-2.5" />
              Gerente
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
          <Mail className="h-3 w-3 flex-shrink-0" />
          {member.email}
        </div>
        {specNames.length > 0 && (
          <div className="text-xs text-slate-400 truncate mt-1">
            {specNames.slice(0, 3).join(" · ")}
            {specNames.length > 3 && ` +${specNames.length - 3}`}
          </div>
        )}
      </div>

      <StatusPill status={member.status} />

      {member.status === "ativo" && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            disabled={busy}
            onClick={onEditSpecs}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
            title="Especialidades"
          >
            <Sparkles className="h-4 w-4 text-violet-600" />
          </button>
          <button
            disabled={busy}
            onClick={toggleRole}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
            title="Alternar role"
          >
            <Shield className="h-4 w-4 text-slate-600" />
          </button>
          <button
            disabled={busy}
            onClick={remove}
            className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50 transition-colors"
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {member.status === "pendente" && (
        <button
          disabled={busy}
          onClick={remove}
          className="text-xs font-medium text-red-600 hover:underline px-2 disabled:opacity-50"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        className="h-10 w-10 rounded-full object-cover flex-shrink-0 bg-slate-100"
      />
    );
  }
  return (
    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white flex items-center justify-center font-semibold flex-shrink-0">
      {initial}
    </div>
  );
}

function StatusPill({ status }: { status: Member["status"] }) {
  const map = {
    ativo: { label: "Ativo", cls: "bg-emerald-50 text-emerald-700", icon: Check },
    pendente: { label: "Pendente", cls: "bg-amber-50 text-amber-700", icon: Clock },
    recusado: { label: "Recusado", cls: "bg-slate-100 text-slate-500", icon: X },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
        s.cls
      )}
    >
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}

function InviteDialog({
  salonId,
  onClose,
  onCreated,
}: {
  salonId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [tempName, setTempName] = useState("");
  const [role, setRole] = useState<"staff" | "gerente">("staff");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const supabase = getSupabase();

    const { error } = await supabase.from("salon_staff").insert({
      salon_id: salonId,
      email: email.trim().toLowerCase(),
      temp_name: tempName.trim() || null,
      role,
      status: "pendente",
    });

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Convite enviado!");
    onCreated();
    onClose();
  }

  return (
    <Modal onClose={onClose} title="Convidar novo membro">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1.5 block">
            Email
          </label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            placeholder="colega@exemplo.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1.5 block">
            Nome (opcional)
          </label>
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            placeholder="Como queres mostrar antes do aceite"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1.5 block">
            Permissão
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["staff", "gerente"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors capitalize",
                  role === r
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                {r === "gerente" ? "Gerente" : "Staff"}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Gerentes podem editar definições do salão.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl disabled:opacity-50"
          >
            {busy ? "A enviar..." : "Enviar convite"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SpecialtiesDialog({
  member,
  services,
  onClose,
  onSaved,
}: {
  member: Member;
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(member.specialty_ids)
  );
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const isDirty =
    selected.size !== member.specialty_ids.length ||
    member.specialty_ids.some((id) => !selected.has(id));

  async function save() {
    setBusy(true);
    const supabase = getSupabase();

    // Estratégia: apagar todos os existentes, inserir os novos
    await supabase.from("employee_services").delete().eq("staff_id", member.id);

    if (selected.size > 0) {
      const rows = Array.from(selected).map((service_id) => ({
        staff_id: member.id,
        service_id,
      }));
      const { error } = await supabase.from("employee_services").insert(rows);
      if (error) {
        toast.error("Erro ao guardar especialidades");
        setBusy(false);
        return;
      }
    }

    toast.success("Especialidades atualizadas");
    setBusy(false);
    onSaved();
    onClose();
  }

  return (
    <Modal onClose={onClose} title={`Especialidades de ${member.display_name}`}>
      <p className="text-xs text-slate-500 mb-4">
        Escolhe que serviços este membro pode executar.
      </p>

      {services.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          Não existem serviços. Cria primeiro na página Serviços.
        </p>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-1.5 mb-4 -mx-1 px-1">
          {services.map((s) => {
            const checked = selected.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left",
                  checked
                    ? "bg-violet-50 border-violet-200 text-violet-900"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                    checked
                      ? "bg-violet-600 border-violet-600"
                      : "border-slate-300"
                  )}
                >
                  {checked && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="flex-1 truncate">{s.nome}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={busy || !isDirty}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl disabled:opacity-40"
        >
          {busy ? "A guardar..." : isDirty ? "Guardar" : "Sem alterações"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
