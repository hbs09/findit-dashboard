"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Scissors,
  Plus,
  Pencil,
  Trash2,
  X,
  Euro,
  Clock,
  Search,
  Tag,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  nome: string;
  preco: number;
  duracao_minutos: number;
  category_id: string | null;
};

type Category = { id: string; nome: string };

export function ServicosView({
  salonId,
  services,
  categories,
}: {
  salonId: string;
  services: Service[];
  categories: Category[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.nome])),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (filterCat !== "all" && s.category_id !== filterCat) return false;
      if (q && !s.nome.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [services, search, filterCat]);

  // Agrupar por categoria
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of filtered) {
      const key = s.category_id ?? "_none";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [filtered]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Catálogo"
        title="Serviços"
        description={`${services.length} serviços disponíveis aos clientes`}
        action={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo serviço
          </button>
        }
      />

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar serviço..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Sem serviços ainda"
          description="Cria o primeiro serviço para os teus clientes poderem marcar."
          action={
            <button
              onClick={() => setEditing("new")}
              className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Criar serviço
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nada encontrado"
          description="Tenta ajustar a procura ou o filtro."
        />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([catId, items]) => (
            <section key={catId}>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                {catId === "_none"
                  ? "Sem categoria"
                  : categoryMap.get(catId) ?? "Categoria"}
                <span className="text-slate-400 font-normal">
                  ({items.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    categoryName={
                      s.category_id ? categoryMap.get(s.category_id) ?? null : null
                    }
                    onEdit={() => setEditing(s)}
                    onDeleted={() => router.refresh()}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <ServiceDialog
          salonId={salonId}
          service={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            router.refresh();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ServiceCard({
  service,
  categoryName,
  onEdit,
  onDeleted,
}: {
  service: Service;
  categoryName: string | null;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Eliminar serviço "${service.nome}"?`)) return;
    setBusy(true);
    const supabase = getSupabase();
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", service.id);
    setBusy(false);
    if (error) {
      toast.error("Erro ao eliminar");
      return;
    }
    toast.success("Serviço eliminado");
    onDeleted();
  }

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900 truncate flex-1 min-w-0 pr-2">
          {service.nome}
        </h3>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-600" />
          </button>
          <button
            disabled={busy}
            onClick={remove}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {categoryName && (
        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2">
          {categoryName}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-emerald-700 font-semibold">
          {Number(service.preco).toFixed(2).replace(".", ",")}
          <Euro className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Clock className="h-3 w-3" />
          {service.duracao_minutos} min
        </div>
      </div>
    </div>
  );
}

function ServiceDialog({
  salonId,
  service,
  categories,
  onClose,
  onSaved,
}: {
  salonId: string;
  service: Service | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !service;
  const [nome, setNome] = useState(service?.nome ?? "");
  const [preco, setPreco] = useState(String(service?.preco ?? ""));
  const [duracao, setDuracao] = useState(String(service?.duracao_minutos ?? "30"));
  const [categoryId, setCategoryId] = useState<string>(
    service?.category_id ?? ""
  );
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !preco || !duracao) return;
    setBusy(true);
    const supabase = getSupabase();

    const payload = {
      salon_id: salonId,
      nome: nome.trim(),
      preco: parseFloat(preco.replace(",", ".")),
      duracao_minutos: parseInt(duracao, 10),
      category_id: categoryId || null,
    };

    const { error } = isNew
      ? await supabase.from("services").insert(payload)
      : await supabase.from("services").update(payload).eq("id", service!.id);

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isNew ? "Serviço criado" : "Alterações guardadas");
    onSaved();
  }

  return (
    <Modal title={isNew ? "Novo serviço" : "Editar serviço"} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Nome">
          <input
            type="text"
            required
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Corte de cabelo"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço (€)">
            <input
              type="number"
              required
              min="0"
              step="0.5"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="15"
              className="input"
            />
          </Field>
          <Field label="Duração (min)">
            <input
              type="number"
              required
              min="5"
              step="5"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Categoria">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>

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
            {busy ? "A guardar..." : isNew ? "Criar serviço" : "Guardar"}
          </button>
        </div>
      </form>

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
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
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
