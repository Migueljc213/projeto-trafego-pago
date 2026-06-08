import { prisma } from "@/lib/prisma";
import { Users, Globe, Link2, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getWaitlistEntries() {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
  });
  return entries;
}

function sourceLabel(entry: Awaited<ReturnType<typeof getWaitlistEntries>>[number]) {
  if (entry.utmSource) return entry.utmSource;
  if (entry.referrer) {
    try {
      return new URL(entry.referrer).hostname.replace(/^www\./, "");
    } catch {
      return entry.referrer.slice(0, 30);
    }
  }
  return "direto";
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    facebook:  "bg-blue-500/10 border-blue-500/30 text-blue-400",
    instagram: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    google:    "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    linkedin:  "bg-sky-500/10 border-sky-500/30 text-sky-400",
    youtube:   "bg-red-500/10 border-red-500/30 text-red-400",
    direto:    "bg-gray-700/30 border-gray-600/30 text-gray-400",
  };
  const key = Object.keys(colors).find((k) => source.toLowerCase().includes(k)) ?? "";
  const cls = colors[key] ?? "bg-purple-500/10 border-purple-500/30 text-purple-400";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      {source}
    </span>
  );
}

export default async function WaitlistAdminPage() {
  const entries = await getWaitlistEntries();

  // Contagem por fonte
  const bySource = entries.reduce<Record<string, number>>((acc, e) => {
    const key = sourceLabel(e);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topSources = Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Contagem por medium
  const byMedium = entries.reduce<Record<string, number>>((acc, e) => {
    const key = e.utmMedium ?? "orgânico/direto";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-cyan" />
          Waitlist — Origens de Tráfego
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {entries.length} inscrito{entries.length !== 1 ? "s" : ""} · dados em tempo real
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-1">Total de Inscritos</p>
          <p className="text-2xl font-bold font-mono text-white">{entries.length}</p>
        </div>
        <div className="glass-card rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-1">Fontes Únicas</p>
          <p className="text-2xl font-bold font-mono text-neon-cyan">{Object.keys(bySource).length}</p>
        </div>
        <div className="glass-card rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-1">Com UTM</p>
          <p className="text-2xl font-bold font-mono text-green-400">
            {entries.filter((e) => e.utmSource).length}
          </p>
        </div>
        <div className="glass-card rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-1">Orgânico / Direto</p>
          <p className="text-2xl font-bold font-mono text-gray-400">
            {entries.filter((e) => !e.utmSource && !e.referrer).length}
          </p>
        </div>
      </div>

      {/* Top fontes + mediums */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl border border-gray-800 p-5">
          <p className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-neon-cyan" />
            Top Fontes (utm_source / referrer)
          </p>
          <div className="space-y-2">
            {topSources.map(([source, count]) => {
              const pct = Math.round((count / entries.length) * 100);
              return (
                <div key={source}>
                  <div className="flex items-center justify-between mb-0.5">
                    <SourceBadge source={source} />
                    <span className="text-xs text-gray-400 font-mono">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full bg-neon-cyan/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {topSources.length === 0 && (
              <p className="text-xs text-gray-600">Nenhum dado ainda.</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl border border-gray-800 p-5">
          <p className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-neon-purple" />
            Mediums (utm_medium)
          </p>
          <div className="space-y-2">
            {Object.entries(byMedium)
              .sort((a, b) => b[1] - a[1])
              .map(([medium, count]) => {
                const pct = Math.round((count / entries.length) * 100);
                return (
                  <div key={medium}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-gray-300">{medium}</span>
                      <span className="text-xs text-gray-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full bg-neon-purple/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Tabela completa */}
      <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Todos os inscritos</p>
          <p className="text-xs text-gray-500">Mais recentes primeiro</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["E-mail", "Site", "Fonte", "Medium", "Campanha", "Referrer", "Data"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-gray-200 text-xs font-mono">{e.email}</td>
                  <td className="px-4 py-3">
                    <a
                      href={e.website.startsWith("http") ? e.website : `https://${e.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-neon-cyan/80 hover:text-neon-cyan flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3" />
                      {e.website}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {e.utmSource ? (
                      <SourceBadge source={e.utmSource} />
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{e.utmMedium ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[140px] truncate">{e.utmCampaign ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate">
                    {e.referrer ? (
                      (() => {
                        try { return new URL(e.referrer).hostname; } catch { return e.referrer; }
                      })()
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {e.createdAt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <div className="py-16 text-center text-gray-600 text-sm">
              Nenhum inscrito ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
