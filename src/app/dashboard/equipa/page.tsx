import { getCurrentSalon } from "@/lib/salon-context";
import { createClient } from "@/lib/supabase/server";
import { EquipaView } from "./equipa-view";

export default async function EquipaPage() {
  const { salon } = await getCurrentSalon();
  if (!salon) return null;

  const supabase = await createClient();

  const [{ data: staff }, { data: services }, { data: empServices }] =
    await Promise.all([
      supabase
        .from("salon_staff")
        .select("id, email, status, role, temp_name, user_id, created_at")
        .eq("salon_id", salon.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("services")
        .select("id, nome")
        .eq("salon_id", salon.id)
        .order("nome", { ascending: true }),
      supabase.from("employee_services").select("staff_id, service_id"),
    ]);

  const userIds = (staff ?? [])
    .map((s) => s.user_id)
    .filter((id): id is string => !!id);

  let profiles: { id: string; nome: string | null; avatar_url: string | null }[] = [];
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome, avatar_url")
      .in("id", userIds);
    profiles = data ?? [];
  }
  const profilesMap = new Map(profiles.map((p) => [p.id, p]));

  const specsMap = new Map<string, Set<string>>();
  for (const es of empServices ?? []) {
    if (!specsMap.has(es.staff_id)) specsMap.set(es.staff_id, new Set());
    specsMap.get(es.staff_id)!.add(es.service_id);
  }

  const enriched = (staff ?? []).map((s) => {
    const profile = s.user_id ? profilesMap.get(s.user_id) : null;
    return {
      id: s.id,
      email: s.email,
      status: s.status as "ativo" | "pendente" | "recusado",
      role: s.role as "gerente" | "staff",
      display_name: profile?.nome || s.temp_name || s.email,
      avatar_url: profile?.avatar_url ?? null,
      specialty_ids: Array.from(specsMap.get(s.id) ?? []),
    };
  });

  return (
    <EquipaView salonId={salon.id} members={enriched} services={services ?? []} />
  );
}
