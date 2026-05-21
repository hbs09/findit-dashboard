import { createClient } from "@/lib/supabase/server";
import type { Salon } from "@/lib/types";

/**
 * Devolve o salão associado ao user logado.
 * Prioriza salão de que é dono; se não tiver, devolve um salão onde
 * é staff ativo.
 */
export async function getCurrentSalon(): Promise<{
  salon: Salon | null;
  userId: string | null;
  role: "dono" | "staff" | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { salon: null, userId: null, role: null };

  // 1. Tentar como dono
  const { data: ownedSalons } = await supabase
    .from("salons")
    .select("*")
    .eq("dono_id", user.id)
    .limit(1);

  if (ownedSalons && ownedSalons.length > 0) {
    return { salon: ownedSalons[0] as Salon, userId: user.id, role: "dono" };
  }

  // 2. Tentar como staff ativo
  const { data: staffRows } = await supabase
    .from("salon_staff")
    .select("salon_id")
    .eq("user_id", user.id)
    .eq("status", "ativo")
    .limit(1);

  if (staffRows && staffRows.length > 0) {
    const { data: salonRows } = await supabase
      .from("salons")
      .select("*")
      .eq("id", staffRows[0].salon_id)
      .limit(1);

    if (salonRows && salonRows.length > 0) {
      return { salon: salonRows[0] as Salon, userId: user.id, role: "staff" };
    }
  }

  return { salon: null, userId: user.id, role: null };
}
