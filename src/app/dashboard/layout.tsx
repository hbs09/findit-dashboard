import { redirect } from "next/navigation";
import { getCurrentSalon } from "@/lib/salon-context";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { salon, userId } = await getCurrentSalon();

  if (!userId) {
    redirect("/login");
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl border border-slate-200">
          <h1 className="text-xl font-semibold mb-2">
            Sem salão associado
          </h1>
          <p className="text-slate-600 text-sm">
            A tua conta não está ligada a nenhum salão. Contacta o suporte
            para configurar acesso.
          </p>
        </div>
      </div>
    );
  }

  // Buscar email do user para mostrar na sidebar
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        salonName={salon.nome_salao}
        userEmail={user?.email ?? ""}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
