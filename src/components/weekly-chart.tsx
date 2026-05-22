"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Point = {
  label: string;
  date: string;
  marcacoes: number;
  receita: number;
};

export function WeeklyChart({ data }: { data: Point[] }) {
  const total = data.reduce((s, d) => s + d.marcacoes, 0);
  const totalReceita = data.reduce((s, d) => s + d.receita, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-900">Últimos 7 dias</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Marcações ativas por dia
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-tight">{total}</div>
          <div className="text-xs text-slate-500">
            {totalReceita.toFixed(0)} € em receita
          </div>
        </div>
      </div>

      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMarcacoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
                    <div className="font-semibold text-slate-900 mb-1 capitalize">
                      {p.label}
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-slate-500">Marcações</div>
                        <div className="font-bold text-slate-900">
                          {p.marcacoes}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Receita</div>
                        <div className="font-bold text-emerald-600">
                          {p.receita.toFixed(0)} €
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="marcacoes"
              stroke="#0f172a"
              strokeWidth={2}
              fill="url(#colorMarcacoes)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
