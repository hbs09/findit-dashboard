import { Scissors, TrendingUp } from "lucide-react";

type Item = { name: string; count: number; revenue: number };

export function TopServices({ items }: { items: Item[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-900">Top serviços</h3>
          <p className="text-xs text-slate-500 mt-0.5">Últimos 7 dias</p>
        </div>
        <div className="p-2 bg-violet-100 rounded-lg">
          <TrendingUp className="h-4 w-4 text-violet-600" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex p-2.5 bg-slate-100 rounded-full mb-2">
            <Scissors className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">Sem dados ainda</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => {
            const pct = Math.max((it.count / max) * 100, 6);
            return (
              <li key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700 truncate flex-1 min-w-0">
                    {it.name}
                  </span>
                  <span className="text-slate-500 font-medium ml-2 flex-shrink-0 tabular-nums">
                    {it.count}×
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {it.revenue.toFixed(0)} € em receita
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
