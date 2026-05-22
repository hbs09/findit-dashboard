import { getCurrentSalon } from "@/lib/salon-context";
import { createClient } from "@/lib/supabase/server";
import { GaleriaView } from "./galeria-view";

export default async function GaleriaPage() {
  const { salon } = await getCurrentSalon();
  if (!salon) return null;

  const supabase = await createClient();

  const { data: images } = await supabase
    .from("salon_portfolio_images")
    .select("id, image_url, description, position")
    .eq("salon_id", salon.id)
    .order("position", { ascending: true });

  return <GaleriaView salonId={salon.id} initialImages={images ?? []} />;
}
