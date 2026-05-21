"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabase();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Email ou palavra-passe inválidos.");
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Sessão inválida.");
      setLoading(false);
      return;
    }

    const [{ data: ownedSalons }, { data: staffRows }] = await Promise.all([
      supabase.from("salons").select("id").eq("dono_id", userId).limit(1),
      supabase
        .from("salon_staff")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "ativo")
        .limit(1),
    ]);

    const isManager = (ownedSalons?.length ?? 0) > 0 || (staffRows?.length ?? 0) > 0;

    if (!isManager) {
      await supabase.auth.signOut();
      setError("Esta conta não tem acesso ao dashboard de gestor.");
      setLoading(false);
      return;
    }

    router.replace(redirect);
    router.refresh();
  }

  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <CardTitle className="text-2xl">Bem-vindo</CardTitle>
        <CardDescription>
          Entra na tua conta para gerir o teu salão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A entrar...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-black p-3 rounded-2xl">
            <Scissors className="h-7 w-7 text-white" />
          </div>
          <span className="ml-3 text-2xl font-bold tracking-tight">FindIt</span>
          <span className="ml-2 text-sm text-muted-foreground">Gestor</span>
        </div>

        <Suspense
          fallback={
            <Card className="shadow-xl border-0">
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </CardContent>
            </Card>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-muted-foreground mt-6">
          A mesma conta que usas na app FindIt.
        </p>
      </div>
    </div>
  );
}
