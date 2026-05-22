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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
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
  const initial = (userEmail.charAt(0) || "U").toUpperCase();

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-2 rounded-xl shadow-sm">
            <Scissors className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">FindIt</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Gestor
            </div>
          </div>
        </div>
      </div>

      {/* Salon */}
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
          Salão atual
        </div>
        <div className="font-semibold text-sm text-slate-900 truncate flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
          {salonName}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-200">
        <div className="px-2 py-2 mb-1 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-700 font-medium truncate">
              {userEmail}
            </div>
            <div className="text-[10px] text-slate-400">Sessão ativa</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
