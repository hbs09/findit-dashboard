"use client";

import { useMemo } from "react";
import { Clock, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  data_hora: string;
  status: "pendente" | "confirmado" | "cancelado";
  cliente_nome: string | null;
  service_name: string;
  notas: string | null;
};

export function TodayAppointments({ items }: { items: Item[] }) {
  const now = useMemo(() => new Date(), []);
  const upcoming = items.filter(
    (i) => new Date(i.data_hora) >= now && i.status !== "cancelado"
  );
  const past = items.filter((i) => new Date(i.data_hora) < now);

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="inline-flex p-3 bg-slate-100 rounded-full mb-3">
          <Clock className="h-6 w-6 text-slate-500" />
        </div>
        <h3 className="font-semibold mb-1">Sem marcações hoje</h3>
        <p className="text-sm text-slate-500">
          Aproveita um dia mais calmo. As novas marcações aparecem aqui em
          tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="A seguir" items={upcoming} highlightNext />
      {past.length > 0 && (
        <Section title="Anteriores" items={past} dimmed />
      )}
    </div>
  );
}

function Section({
  title,
  items,
  highlightNext = false,
  dimmed = false,
}: {
  title: string;
  items: Item[];
  highlightNext?: boolean;
  dimmed?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 mb-3 px-1">
        {title}
      </h2>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
        {items.map((item, i) => (
          <AppointmentRow
            key={item.id}
            item={item}
            isNext={highlightNext && i === 0}
            dimmed={dimmed}
          />
        ))}
      </div>
    </div>
  );
}

function AppointmentRow({
  item,
  isNext,
  dimmed,
}: {
  item: Item;
  isNext: boolean;
  dimmed: boolean;
}) {
  const time = new Date(item.data_hora).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 transition-colors",
        isNext && "bg-blue-50/50",
        dimmed && "opacity-60"
      )}
    >
      <div className="text-center w-16 flex-shrink-0">
        <div className="text-xl font-bold tracking-tight">{time}</div>
      </div>

      <div className="w-px h-10 bg-slate-200 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="font-medium text-sm truncate">
            {item.cliente_nome || "Cliente"}
          </span>
        </div>
        <div className="text-sm text-slate-600 truncate">
          {item.service_name}
        </div>
        {item.notas && (
          <div className="text-xs text-slate-400 truncate mt-0.5">
            {item.notas}
          </div>
        )}
      </div>

      <StatusPill status={item.status} />
    </div>
  );
}

function StatusPill({ status }: { status: Item["status"] }) {
  const map = {
    confirmado: {
      label: "Confirmado",
      cls: "bg-emerald-100 text-emerald-700",
    },
    pendente: {
      label: "Pendente",
      cls: "bg-amber-100 text-amber-700",
      icon: AlertCircle,
    },
    cancelado: {
      label: "Cancelado",
      cls: "bg-slate-100 text-slate-500",
    },
  };
  const s = map[status];
  const Icon = "icon" in s ? s.icon : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
        s.cls
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {s.label}
    </span>
  );
}
