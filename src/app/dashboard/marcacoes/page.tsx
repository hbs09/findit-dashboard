import { getCurrentSalon } from "@/lib/salon-context";
import { createClient } from "@/lib/supabase/server";
import { AppointmentsView } from "./appointments-view";

type SearchParams = Promise<{ date?: string }>;

export default async function MarcacoesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { salon } = await getCurrentSalon();
  if (!salon) return null;

  const { date } = await searchParams;
  const selected = date ? new Date(date) : new Date();
  selected.setHours(0, 0, 0, 0);

  const start = new Date(selected);
  const end = new Date(selected);
  end.setHours(23, 59, 59, 999);

  const supabase = await createClient();

  const [{ data: apps }, { data: services }, { data: staff }] =
    await Promise.all([
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
        .from("services")
        .select("id, nome, preco, duracao_minutos")
        .eq("salon_id", salon.id),
      supabase
        .from("salon_staff")
        .select("id, temp_name, user_id")
        .eq("salon_id", salon.id)
        .eq("status", "ativo"),
    ]);

  const servicesMap = new Map((services ?? []).map((s) => [s.id, s]));
  const staffMap = new Map(
    (staff ?? []).map((s) => [s.id, s.temp_name ?? "Funcionário"])
  );

  const enriched = (apps ?? []).map((a) => ({
    id: a.id,
    data_hora: a.data_hora,
    status: a.status as "pendente" | "confirmado" | "cancelado",
    cliente_nome: a.cliente_nome,
    notas: a.notas,
    service_name: servicesMap.get(a.service_id)?.nome ?? "Serviço",
    service_price: Number(servicesMap.get(a.service_id)?.preco ?? 0),
    service_duration:
      servicesMap.get(a.service_id)?.duracao_minutos ?? 30,
    staff_name: a.salon_staff_id ? staffMap.get(a.salon_staff_id) ?? null : null,
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Marcações</h1>
        <p className="text-slate-500 mt-1">
          Gere a agenda do teu salão dia a dia.
        </p>
      </header>

      <AppointmentsView
        salonId={salon.id}
        initialDate={selected.toISOString()}
        items={enriched}
      />
    </div>
  );
}
