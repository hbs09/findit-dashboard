import { getCurrentSalon } from "@/lib/salon-context";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";
import { TodayAppointments } from "@/components/today-appointments";
import { WeeklyChart } from "@/components/weekly-chart";
import { TopServices } from "@/components/top-services";
import { PageHeader } from "@/components/page-header";
import { CalendarCheck, Euro, Clock, TrendingUp } from "lucide-react";

export default async function DashboardOverviewPage() {
  const { salon } = await getCurrentSalon();
  if (!salon) return null;

  const supabase = await createClient();

  // Range de hoje
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // Range últimos 7 dias (para chart)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(start);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(end);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const [
    { data: todayApps },
    { data: tomorrowApps },
    { data: weekApps },
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
      .select("id, data_hora, status, service_id")
      .eq("salon_id", salon.id)
      .gte("data_hora", sevenDaysAgo.toISOString())
      .lte("data_hora", end.toISOString()),
    supabase
      .from("services")
      .select("id, nome, preco, duracao_minutos")
      .eq("salon_id", salon.id),
  ]);

  const servicesMap = new Map((services ?? []).map((s) => [s.id, s]));

  // Stats hoje
  const confirmed = (todayApps ?? []).filter((a) => a.status === "confirmado");
  const pending = (todayApps ?? []).filter((a) => a.status === "pendente");
  let revenue = 0;
  for (const a of confirmed) {
    const s = servicesMap.get(a.service_id);
    if (s?.preco) revenue += Number(s.preco);
  }

  // Receita 7 dias
  let weekRevenue = 0;
  for (const a of weekApps ?? []) {
    if (a.status !== "confirmado") continue;
    const s = servicesMap.get(a.service_id);
    if (s?.preco) weekRevenue += Number(s.preco);
  }

  // Chart data — agrupar por dia
  const chartData = buildWeekChart(weekApps ?? [], servicesMap);

  // Top serviços (últimos 7 dias)
  const serviceCounts = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();
  for (const a of weekApps ?? []) {
    if (a.status === "cancelado") continue;
    const s = servicesMap.get(a.service_id);
    if (!s) continue;
    const entry = serviceCounts.get(s.id) ?? {
      name: s.nome,
      count: 0,
      revenue: 0,
    };
    entry.count += 1;
    entry.revenue += Number(s.preco) || 0;
    serviceCounts.set(s.id, entry);
  }
  const topServices = Array.from(serviceCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const enriched = (todayApps ?? []).map((a) => ({
    ...a,
    service_name: servicesMap.get(a.service_id)?.nome ?? "Serviço",
  }));

  const tomorrowConfirmed = (tomorrowApps ?? []).filter(
    (a) => a.status !== "cancelado"
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Hoje"
        title={greeting()}
        description={`${formatToday()} · ${salon.nome_salao}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Marcações hoje"
          value={(todayApps ?? []).length.toString()}
          icon={CalendarCheck}
          sub={`${confirmed.length} confirmadas · ${pending.length} pendentes`}
          tone="default"
        />
        <StatCard
          label="Receita estimada"
          value={`${revenue.toFixed(0)} €`}
          icon={Euro}
          sub="Apenas confirmadas hoje"
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
          label="Últimos 7 dias"
          value={`${weekRevenue.toFixed(0)} €`}
          icon={TrendingUp}
          sub={`${tomorrowConfirmed} marcadas para amanhã`}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <WeeklyChart data={chartData} />
        </div>
        <div>
          <TopServices items={topServices} />
        </div>
      </div>

      <TodayAppointments items={enriched} />
    </div>
  );
}

type WeekApp = { id: string; data_hora: string; status: string; service_id: string };

function buildWeekChart(
  apps: WeekApp[],
  services: Map<string, { id: string; nome: string; preco: number; duracao_minutos: number }>
) {
  const result: { label: string; date: string; marcacoes: number; receita: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const dayApps = apps.filter((a) => {
      const t = new Date(a.data_hora).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    const conf = dayApps.filter((a) => a.status === "confirmado");
    let rev = 0;
    for (const a of conf) {
      const s = services.get(a.service_id);
      if (s?.preco) rev += Number(s.preco);
    }

    result.push({
      label: d.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", ""),
      date: d.toISOString().split("T")[0],
      marcacoes: dayApps.filter((a) => a.status !== "cancelado").length,
      receita: rev,
    });
  }
  return result;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia 👋";
  if (h < 19) return "Boa tarde 👋";
  return "Boa noite 👋";
}

function formatToday() {
  return new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
