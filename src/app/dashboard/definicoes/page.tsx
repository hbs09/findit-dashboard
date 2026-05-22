import { getCurrentSalon } from "@/lib/salon-context";
import { createClient } from "@/lib/supabase/server";
import { DefinicoesView } from "./definicoes-view";

export default async function DefinicoesPage() {
  const { salon } = await getCurrentSalon();
  if (!salon) return null;

  const supabase = await createClient();

  const { data: closures } = await supabase
    .from("salon_closures")
    .select("id, start_date, end_date, motivo")
    .eq("salon_id", salon.id)
    .order("start_date", { ascending: true });

  return <DefinicoesView salon={salon} initialClosures={closures ?? []} />;
}
