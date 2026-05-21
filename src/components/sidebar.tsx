"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Image as ImageIcon,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/marcacoes", label: "Marcações", icon: Calendar },
  { href: "/dashboard/equipa", label: "Equipa", icon: Users },
  { href: "/dashboard/servicos", label: "Serviços", icon: Scissors },
  { href: "/dashboard/galeria", label: "Galeria", icon: ImageIcon },
  { href: "/dashboard/definicoes", label: "Definições", icon: Settings },
];

export function Sidebar({
  salonName,
  userEmail,
}: {
  salonName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="bg-black p-1.5 rounded-lg">
            <Scissors className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">FindIt</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              Gestor
            </div>
          </div>
        </div>
      </div>

      {/* Salon */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
          Salão
        </div>
        <div className="font-medium text-sm truncate">{salonName}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-black text-white"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-200">
        <div className="px-3 py-2 mb-1">
          <div className="text-xs text-slate-500 truncate">{userEmail}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
