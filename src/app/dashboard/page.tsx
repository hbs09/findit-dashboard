import { getCurrentSalon } from "@/lib/salon-context";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";
import { TodayAppointments } from "@/components/today-appointments";
import {
  CalendarCheck,
  Euro,
  Users as UsersIcon,
  Clock,
} from "lucide-react";

export default async function DashboardOverviewPage() {
  const { salon } = await getCurrentSalon();
  if (!salon) return null;

  const supabase = await createClient();

  // Range de hoje (00:00 → 23:59 local)
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // Range "amanhã" para preview
  const tomorrowStart = new Date(start);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(end);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  // Buscar marcações de hoje + amanhã em paralelo
  const [
    { data: todayApps },
    { data: tomorrowApps },
    { count: totalClientsCount },
    { data: services },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, data_hora, status, cliente_nome, cliente_id, service_id, salon_staff_id, notas"
      )
      .eq("salon_id", salon.id)
      .gte("data_hora", start.toISOString())
      .lte("data_hora", end.toISOString())
      .order("data_hora", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, status")
      .eq("salon_id", salon.id)
      .gte("data_hora", tomorrowStart.toISOString())
      .lte("data_hora", tomorrowEnd.toISOString()),
    supabase
      .from("appointments")
      .select("cliente_id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .neq("status", "cancelado"),
    supabase
      .from("services")
      .select("id, nome, preco, duracao_minutos")
      .eq("salon_id", salon.id),
  ]);

  const servicesMap = new Map(
    (services ?? []).map((s) => [s.id, s])
  );

  // Receita estimada (apenas confirmados)
  let revenue = 0;
  const confirmed = (todayApps ?? []).filter((a) => a.status === "confirmado");
  for (const a of confirmed) {
    const s = servicesMap.get(a.service_id);
    if (s?.preco) revenue += Number(s.preco);
  }

  const pending = (todayApps ?? []).filter((a) => a.status === "pendente");

  // Enriquecer marcações com nome do serviço
  const enriched = (todayApps ?? []).map((a) => ({
    ...a,
    service_name: servicesMap.get(a.service_id)?.nome ?? "Serviço",
  }));

  const tomorrowConfirmed = (tomorrowApps ?? []).filter(
    (a) => a.status !== "cancelado"
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-1">
          Resumo das tuas marcações de hoje, {formatToday()}.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Marcações hoje"
          value={(todayApps ?? []).length.toString()}
          icon={CalendarCheck}
          sub={`${confirmed.length} confirmadas · ${pending.length} pendentes`}
          tone="default"
        />
        <StatCard
          label="Receita estimada"
          value={`${revenue.toFixed(2).replace(".", ",")} €`}
          icon={Euro}
          sub="Apenas confirmadas"
          tone="green"
        />
        <StatCard
          label="Pendentes"
          value={pending.length.toString()}
          icon={Clock}
          sub={pending.length > 0 ? "A aguardar confirmação" : "Tudo em dia"}
          tone={pending.length > 0 ? "amber" : "default"}
        />
        <StatCard
          label="Amanhã"
          value={tomorrowConfirmed.toString()}
          icon={UsersIcon}
          sub="Marcações ativas"
          tone="default"
        />
      </div>

      <TodayAppointments items={enriched} />
    </div>
  );
}

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
