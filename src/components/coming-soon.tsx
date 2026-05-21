import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </header>
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto">
        <div className="inline-flex p-3 bg-gradient-to-br from-violet-100 to-blue-100 rounded-full mb-4">
          <Sparkles className="h-6 w-6 text-violet-600" />
        </div>
        <h2 className="font-semibold text-lg mb-2">Em construção</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
