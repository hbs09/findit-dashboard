"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Store,
  Clock,
  CalendarX,
  Save,
  MapPin,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { cn } from "@/lib/utils";
import type { Salon } from "@/lib/types";

type Closure = {
  id: string;
  start_date: string;
  end_date: string;
  motivo: string | null;
};

type Tab = "geral" | "horarios" | "ausencias";

const TABS: { id: Tab; label: string; icon: typeof Store }[] = [
  { id: "geral", label: "Geral", icon: Store },
  { id: "horarios", label: "Horários", icon: Clock },
  { id: "ausencias", label: "Ausências", icon: CalendarX },
];

export function DefinicoesView({
  salon,
  initialClosures,
}: {
  salon: Salon;
  initialClosures: Closure[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("geral");

  // Form state — Geral
  const [nomeSalao, setNomeSalao] = useState(salon.nome_salao);
  const [morada, setMorada] = useState(salon.morada ?? "");
  const [cidade, setCidade] = useState(salon.cidade ?? "");
  const [categoria, setCategoria] = useState(salon.categoria ?? "");
  const [publico, setPublico] = useState(salon.publico ?? "unissexo");
  const [imagem, setImagem] = useState(salon.imagem ?? "");

  // Form state — Horários
  const [horaAbertura, setHoraAbertura] = useState(salon.hora_abertura ?? "09:00");
  const [horaFecho, setHoraFecho] = useState(salon.hora_fecho ?? "19:00");
  const [intervalo, setIntervalo] = useState(String(salon.intervalo_minutos ?? 30));
  const [pausaAtiva, setPausaAtiva] = useState(
    !!(salon.almoco_inicio && salon.almoco_fim)
  );
  const [almocoInicio, setAlmocoInicio] = useState(salon.almoco_inicio ?? "12:30");
  const [almocoFim, setAlmocoFim] = useState(salon.almoco_fim ?? "14:00");

  const [busy, setBusy] = useState(false);

  // Snapshot original p/ dirty tracking
  const original = useMemo(
    () => ({
      nome_salao: salon.nome_salao,
      morada: salon.morada ?? "",
      cidade: salon.cidade ?? "",
      categoria: salon.categoria ?? "",
      publico: salon.publico ?? "unissexo",
      imagem: salon.imagem ?? "",
      hora_abertura: salon.hora_abertura ?? "09:00",
      hora_fecho: salon.hora_fecho ?? "19:00",
      intervalo_minutos: String(salon.intervalo_minutos ?? 30),
      pausa_ativa: !!(salon.almoco_inicio && salon.almoco_fim),
      almoco_inicio: salon.almoco_inicio ?? "12:30",
      almoco_fim: salon.almoco_fim ?? "14:00",
    }),
    [salon]
  );

  const isDirty =
    nomeSalao !== original.nome_salao ||
    morada !== original.morada ||
    cidade !== original.cidade ||
    categoria !== original.categoria ||
    publico !== original.publico ||
    imagem !== original.imagem ||
    horaAbertura !== original.hora_abertura ||
    horaFecho !== original.hora_fecho ||
    intervalo !== original.intervalo_minutos ||
    pausaAtiva !== original.pausa_ativa ||
    almocoInicio !== original.almoco_inicio ||
    almocoFim !== original.almoco_fim;

  async function save() {
    setBusy(true);
    const supabase = getSupabase();
    const payload = {
      nome_salao: nomeSalao.trim(),
      morada: morada.trim() || null,
      cidade: cidade.trim() || null,
      categoria: categoria.trim() || null,
      publico,
      imagem: imagem.trim() || null,
      hora_abertura: horaAbertura,
      hora_fecho: horaFecho,
      intervalo_minutos: parseInt(intervalo, 10),
      almoco_inicio: pausaAtiva ? almocoInicio : null,
      almoco_fim: pausaAtiva ? almocoFim : null,
    };
    const { error } = await supabase
      .from("salons")
      .update(payload)
      .eq("id", salon.id);

    setBusy(false);
    if (error) {
      toast.error("Erro ao guardar: " + error.message);
      return;
    }
    toast.success("Definições guardadas");
    router.refresh();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto pb-32">
      <PageHeader
        eyebrow="Salão"
        title="Definições"
        description="Informação pública, horários e gestão de ausências."
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-2xl p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "geral" && (
        <div className="space-y-4">
          <SectionCard title="Informação pública" description="O que os clientes vêem na app">
            <div className="p-6 space-y-4">
              <Field label="Nome do salão">
                <input
                  type="text"
                  required
                  value={nomeSalao}
                  onChange={(e) => setNomeSalao(e.target.value)}
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Cidade">
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Lisboa"
                    className="input"
                  />
                </Field>
                <Field label="Categoria">
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Cabeleireiro, Barbearia..."
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Morada" icon={MapPin}>
                <input
                  type="text"
                  value={morada}
                  onChange={(e) => setMorada(e.target.value)}
                  placeholder="Rua, n.º, andar"
                  className="input"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Público alvo">
            <div className="p-6">
              <div className="grid grid-cols-3 gap-2">
                {(["mulher", "homem", "unissexo"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPublico(p)}
                    className={cn(
                      "px-3 py-3 rounded-xl border text-sm font-medium capitalize transition-colors",
                      publico === p
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Foto de capa" description="URL da imagem que aparece no perfil">
            <div className="p-6">
              <Field label="URL da imagem" icon={ImageIcon}>
                <input
                  type="url"
                  value={imagem}
                  onChange={(e) => setImagem(e.target.value)}
                  placeholder="https://..."
                  className="input"
                />
              </Field>
              {imagem && (
                <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagem}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "horarios" && (
        <div className="space-y-4">
          <SectionCard title="Horário de funcionamento">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Abertura">
                  <input
                    type="time"
                    value={horaAbertura}
                    onChange={(e) => setHoraAbertura(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Fecho">
                  <input
                    type="time"
                    value={horaFecho}
                    onChange={(e) => setHoraFecho(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-2 block">
                  Presets rápidos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Manhã", abert: "08:00", fecho: "13:00" },
                    { label: "Tarde", abert: "14:00", fecho: "19:00" },
                    { label: "Comercial", abert: "09:00", fecho: "19:00" },
                    { label: "Estendido", abert: "08:00", fecho: "21:00" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setHoraAbertura(p.abert);
                        setHoraFecho(p.fecho);
                      }}
                      className="px-2 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Pausa de almoço" description="Os clientes não conseguem marcar neste intervalo">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium">Ativar pausa</span>
                <Toggle checked={pausaAtiva} onChange={setPausaAtiva} />
              </div>

              {pausaAtiva && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Field label="Início">
                    <input
                      type="time"
                      value={almocoInicio}
                      onChange={(e) => setAlmocoInicio(e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label="Fim">
                    <input
                      type="time"
                      value={almocoFim}
                      onChange={(e) => setAlmocoFim(e.target.value)}
                      className="input"
                    />
                  </Field>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Intervalo entre marcações" description="Em minutos">
            <div className="p-6">
              <div className="grid grid-cols-4 gap-2">
                {["15", "30", "45", "60"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setIntervalo(m)}
                    className={cn(
                      "px-3 py-3 rounded-xl border text-sm font-medium transition-colors",
                      intervalo === m
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "ausencias" && (
        <ClosuresTab
          salonId={salon.id}
          initialClosures={initialClosures}
          onChange={() => router.refresh()}
        />
      )}

      {/* Floating save bar */}
      {isDirty && tab !== "ausencias" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl p-2 flex items-center gap-2 pl-4 animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-300" />
            Tens alterações por guardar
          </span>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1.5 bg-white text-slate-900 hover:bg-slate-100 text-sm font-semibold px-4 py-2 rounded-xl ml-2 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {busy ? "A guardar..." : "Guardar alterações"}
          </button>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border: 1px solid rgb(226 232 240);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .input:focus {
          box-shadow: 0 0 0 2px rgb(15 23 42);
          border-color: transparent;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Store;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-slate-400" />}
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        checked ? "bg-slate-900" : "bg-slate-300"
      )}
      type="button"
    >
      <div
        className={cn(
          "absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function ClosuresTab({
  salonId,
  initialClosures,
  onChange,
}: {
  salonId: string;
  initialClosures: Closure[];
  onChange: () => void;
}) {
  const [creating, setCreating] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = initialClosures.filter((c) => new Date(c.end_date) >= today);
  const past = initialClosures.filter((c) => new Date(c.end_date) < today);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Próximas ausências"
        description={`${upcoming.length} ${upcoming.length === 1 ? "ausência marcada" : "ausências marcadas"}`}
        action={
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </button>
        }
      >
        {upcoming.length === 0 ? (
          <div className="p-8 text-center">
            <Sparkles className="h-6 w-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              Sem ausências planeadas. O salão está disponível normalmente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map((c) => (
              <ClosureRow key={c.id} closure={c} onChanged={onChange} />
            ))}
          </div>
        )}
      </SectionCard>

      {past.length > 0 && (
        <SectionCard title="Histórico">
          <div className="divide-y divide-slate-100">
            {past.slice(0, 5).map((c) => (
              <ClosureRow key={c.id} closure={c} onChanged={onChange} isPast />
            ))}
          </div>
        </SectionCard>
      )}

      {creating && (
        <ClosureDialog
          salonId={salonId}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function ClosureRow({
  closure,
  onChanged,
  isPast = false,
}: {
  closure: Closure;
  onChanged: () => void;
  isPast?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Eliminar esta ausência?")) return;
    setBusy(true);
    const supabase = getSupabase();
    const { error } = await supabase
      .from("salon_closures")
      .delete()
      .eq("id", closure.id);
    setBusy(false);
    if (error) {
      toast.error("Erro ao eliminar");
      return;
    }
    toast.success("Ausência removida");
    onChanged();
  }

  const start = new Date(closure.start_date);
  const end = new Date(closure.end_date);
  const sameDay = closure.start_date === closure.end_date;
  const days =
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  return (
    <div className={cn("p-4 flex items-center gap-4", isPast && "opacity-60")}>
      <div className="p-2.5 bg-rose-50 rounded-xl flex-shrink-0">
        <CalendarX className="h-4 w-4 text-rose-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm capitalize">
          {sameDay
            ? start.toLocaleDateString("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : `${start.toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "short",
              })} → ${end.toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "short",
              })}`}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {closure.motivo ?? "Sem motivo"} · {days} {days === 1 ? "dia" : "dias"}
        </div>
      </div>
      <button
        disabled={busy}
        onClick={remove}
        className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ClosureDialog({
  salonId,
  onClose,
  onSaved,
}: {
  salonId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [motivo, setMotivo] = useState<string>("Férias");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (endDate < startDate) {
      toast.error("A data de fim tem de ser posterior ao início");
      return;
    }
    setBusy(true);
    const supabase = getSupabase();
    const { error } = await supabase.from("salon_closures").insert({
      salon_id: salonId,
      start_date: startDate,
      end_date: endDate,
      motivo,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ausência adicionada");
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Nova ausência</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </header>
        <form onSubmit={save} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
              Motivo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Férias", "Feriado", "Manutenção"].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMotivo(m)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                    motivo === m
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Início
              </label>
              <input
                type="date"
                required
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Fim
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
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
              {busy ? "A guardar..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
