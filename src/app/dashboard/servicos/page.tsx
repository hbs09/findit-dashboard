import { getCurrentSalon } from "@/lib/salon-context";
import { createClient } from "@/lib/supabase/server";
import { ServicosView } from "./servicos-view";

export default async function ServicosPage() {
  const { salon } = await getCurrentSalon();
  if (!salon) return null;

  const supabase = await createClient();

  const [{ data: services }, { data: categories }] = await Promise.all([
    supabase
      .from("services")
      .select("id, nome, preco, duracao_minutos, category_id")
      .eq("salon_id", salon.id)
      .order("nome", { ascending: true }),
    supabase.from("service_categories").select("id, nome").order("nome"),
  ]);

  return (
    <ServicosView
      salonId={salon.id}
      services={services ?? []}
      categories={categories ?? []}
    />
  );
}
