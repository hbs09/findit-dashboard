"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Clock,
  User,
  Check,
  X,
  Euro,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  data_hora: string;
  status: "pendente" | "confirmado" | "cancelado";
  cliente_nome: string | null;
  notas: string | null;
  service_name: string;
  service_price: number;
  service_duration: number;
  staff_name: string | null;
};

type Filter = "todos" | "pendente" | "confirmado" | "cancelado";

export function AppointmentsView({
  salonId,
  initialDate,
  items: initialItems,
}: {
  salonId: string;
  initialDate: string;
  items: Item[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("todos");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Sync com props quando o servidor refetcha
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Realtime updates
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`appointments:${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, router]);

  const selectedDate = useMemo(() => new Date(initialDate), [initialDate]);

  function navigateDay(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    const url = new URL(window.location.href);
    url.searchParams.set("date", d.toISOString().split("T")[0]);
    startTransition(() => {
      router.push(url.pathname + url.search);
    });
  }

  function goToday() {
    const url = new URL(window.location.href);
    url.searchParams.delete("date");
    startTransition(() => {
      router.push(url.pathname + url.search);
    });
  }

  async function updateStatus(
    id: string,
    next: "confirmado" | "cancelado"
  ) {
    setBusyId(id);
    const supabase = getSupabase();
    const prev = items;
    setItems((cur) =>
      cur.map((it) => (it.id === id ? { ...it, status: next } : it))
    );
    const { error } = await supabase
      .from("appointments")
      .update({ status: next })
      .eq("id", id);
    if (error) {
      setItems(prev);
      alert("Não foi possível atualizar: " + error.message);
    }
    setBusyId(null);
  }

  const filtered = items.filter((it) =>
    filter === "todos" ? true : it.status === filter
  );

  const counts = {
    todos: items.length,
    pendente: items.filter((i) => i.status === "pendente").length,
    confirmado: items.filter((i) => i.status === "confirmado").length,
    cancelado: items.filter((i) => i.status === "cancelado").length,
  };

  const isToday =
    selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
        <button
          onClick={() => navigateDay(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <CalIcon className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <div className="font-semibold capitalize">
              {selectedDate.toLocaleDateString("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="text-xs text-slate-500">
              {pending ? "A carregar..." : `${items.length} marcações`}
            </div>
          </div>
        </div>

        {!isToday && (
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hoje
          </button>
        )}

        <button
          onClick={() => navigateDay(1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["todos", "pendente", "confirmado", "cancelado"] as Filter[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                filter === f
                  ? "bg-black text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <span className="capitalize">{f}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  filter === f
                    ? "bg-white/20"
                    : "bg-slate-100"
                )}
              >
                {counts[f]}
              </span>
            </button>
          )
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="inline-flex p-3 bg-slate-100 rounded-full mb-3">
            <CalIcon className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="font-semibold mb-1">Sem marcações</h3>
          <p className="text-sm text-slate-500">
            Não há marcações para este filtro.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
          {filtered.map((it) => (
            <Row
              key={it.id}
              item={it}
              busy={busyId === it.id}
              onConfirm={() => updateStatus(it.id, "confirmado")}
              onCancel={() => updateStatus(it.id, "cancelado")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  item,
  busy,
  onConfirm,
  onCancel,
}: {
  item: Item;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const time = new Date(item.data_hora).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(
    new Date(item.data_hora).getTime() + item.service_duration * 60_000
  ).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-4 flex items-center gap-4">
      <div className="w-20 text-center flex-shrink-0">
        <div className="text-lg font-bold tracking-tight">{time}</div>
        <div className="text-[11px] text-slate-400 flex items-center justify-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {endTime}
        </div>
      </div>

      <div className="w-px h-12 bg-slate-200 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="font-medium text-sm truncate">
            {item.cliente_nome || "Cliente"}
          </span>
        </div>
        <div className="text-sm text-slate-600 truncate flex items-center gap-2">
          <span>{item.service_name}</span>
          {item.staff_name && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                {item.staff_name}
              </span>
            </>
          )}
        </div>
        {item.notas && (
          <div className="text-xs text-slate-400 truncate mt-0.5">
            {item.notas}
          </div>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-sm font-semibold flex items-center justify-end gap-0.5">
          {item.service_price.toFixed(2).replace(".", ",")}
          <Euro className="h-3 w-3" />
        </div>
        <StatusPill status={item.status} />
      </div>

      {item.status === "pendente" && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            disabled={busy}
            onClick={onConfirm}
            className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 transition-colors"
            title="Confirmar"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            disabled={busy}
            onClick={onCancel}
            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Item["status"] }) {
  const map = {
    confirmado: { label: "Confirmado", cls: "bg-emerald-50 text-emerald-700" },
    pendente: { label: "Pendente", cls: "bg-amber-50 text-amber-700" },
    cancelado: { label: "Cancelado", cls: "bg-slate-100 text-slate-500" },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
        s.cls
      )}
    >
      {s.label}
    </span>
  );
}
