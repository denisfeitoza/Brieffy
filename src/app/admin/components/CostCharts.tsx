"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Activity, Layers } from "lucide-react";

interface CostChartsProps {
  totalCostUSD: number;
  totalCostBRL: number;
  costByCompany: { companyName: string; costUsd: number; tokens: number }[];
  timelineData: { date: string; costUsd: number; costBrl: number }[];
  costByEndpoint?: { endpoint: string; costUsd: number; calls: number; tokens: number }[];
  timelineByEndpoint?: Array<Record<string, string | number>>;
}

// Stable color per endpoint so re-renders don't repaint the chart.
const ENDPOINT_COLOR: Record<string, string> = {
  briefing: "#ff6029", // brand orange — the dominant cost driver historically
  assistant: "#7c3aed", // purple — new free-form chat
  translate: "#10b981", // emerald
  dossier: "#f59e0b", // amber
  unknown: "#6b7280", // gray
};

// Human-readable labels for the legend / table.
const ENDPOINT_LABEL: Record<string, string> = {
  briefing: "Briefing (motor)",
  assistant: "Assistente IA",
  translate: "Tradução",
  dossier: "Dossiê final",
  unknown: "Não atribuído",
};

function endpointColor(name: string): string {
  return ENDPOINT_COLOR[name] || "#94a3b8";
}

function endpointLabel(name: string): string {
  return ENDPOINT_LABEL[name] || name;
}

export function CostCharts({
  totalCostUSD,
  totalCostBRL,
  costByCompany,
  timelineData,
  costByEndpoint = [],
  timelineByEndpoint = [],
}: CostChartsProps) {
  // Take top 5 companies by cost for the bar chart
  // Guard against companyName being null/undefined which would crash on .length.
  const topCompanies = costByCompany.slice(0, 5).map(c => {
    const safeName = (c.companyName ?? '').toString() || 'Sem nome';
    return {
      name: safeName.length > 15 ? safeName.substring(0, 15) + "..." : safeName,
      cost: parseFloat((c.costUsd ?? 0).toFixed(4))
    };
  });

  // Format timeline data
  const formattedTimeline = timelineData.map(t => ({
    date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    costUSD: parseFloat(t.costUsd.toFixed(4)),
    costBRL: parseFloat(t.costBrl.toFixed(4))
  }));

  // Endpoint share of total — for the summary cards above the breakdown.
  const totalByEndpointUsd = costByEndpoint.reduce((s, e) => s + e.costUsd, 0);
  const endpointShare = costByEndpoint.map(e => ({
    ...e,
    share: totalByEndpointUsd > 0 ? (e.costUsd / totalByEndpointUsd) * 100 : 0,
    label: endpointLabel(e.endpoint),
    color: endpointColor(e.endpoint),
  }));

  const endpointKeys = costByEndpoint.map(e => e.endpoint);
  const formattedEndpointTimeline = timelineByEndpoint.map(row => {
    const out: Record<string, string | number> = {
      date: typeof row.date === "string"
        ? new Date(row.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : "",
    };
    for (const ep of endpointKeys) {
      const v = row[ep];
      out[ep] = typeof v === "number" ? parseFloat(v.toFixed(4)) : 0;
    }
    return out;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Global Cost KPI Cards */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[var(--acbg)] border-[var(--acbd)]">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[var(--orange)]" />
              Custo Total API (USD)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--orange)]">${totalCostUSD.toFixed(4)}</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--acbg)] border-[var(--acbd)]">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[var(--orange)]" />
              Custo Total API (BRL)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--orange)]">R$ {totalCostBRL.toFixed(4)}</p>
            <p className="text-xs text-[var(--text3)] mt-1">Estimativa Conversão R$ 6.00</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="bg-[var(--bg2)] border-[var(--bd)]">
        <CardHeader>
          <CardTitle className="text-sm text-[var(--text2)]">Custo Diário (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedTimeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--text)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--orange)' }}
                />
                <Line type="monotone" dataKey="costUSD" name="Custo USD" stroke="var(--orange)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost breakdown by endpoint — stacked summary cards. */}
      <Card className="col-span-1 lg:col-span-2 bg-[var(--bg2)] border-[var(--bd)]">
        <CardHeader>
          <CardTitle className="text-sm text-[var(--text2)] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[var(--orange)]" />
            Custo por funcionalidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {endpointShare.length === 0 ? (
            <p className="text-xs text-[var(--text3)] py-4 text-center">
              Nenhum dado de uso ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {endpointShare.map(e => (
                <div
                  key={e.endpoint}
                  className="rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-3 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: e.color }}
                    />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text3)] truncate">
                      {e.label}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-[var(--text)] tabular-nums">
                    ${e.costUsd.toFixed(4)}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text3)] tabular-nums">
                    <span>{e.share.toFixed(1)}%</span>
                    <span>{e.calls.toLocaleString()} calls</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-endpoint timeline — one line per feature so a sudden spike in
          one (e.g. assistant taking off) is obvious instead of hidden in
          the global aggregate. */}
      {endpointKeys.length > 0 && formattedEndpointTimeline.length > 0 && (
        <Card className="col-span-1 lg:col-span-2 bg-[var(--bg2)] border-[var(--bd)]">
          <CardHeader>
            <CardTitle className="text-sm text-[var(--text2)]">Custo diário por funcionalidade (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[260px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedEndpointTimeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--text)', borderRadius: '8px' }}
                    formatter={(value, name) => [`$${Number(value).toFixed(4)}`, endpointLabel(String(name))]}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, color: 'var(--text3)' }}
                    formatter={(value: string) => endpointLabel(value)}
                  />
                  {endpointKeys.map(ep => (
                    <Line
                      key={ep}
                      type="monotone"
                      dataKey={ep}
                      stroke={endpointColor(ep)}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: 'var(--bg)', strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Companies Chart */}
      <Card className="bg-[var(--bg2)] border-[var(--bd)]">
        <CardHeader>
          <CardTitle className="text-sm text-[var(--text2)]">Top 5 Custos por Empresa (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCompanies} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--text)', borderRadius: '8px' }}
                  cursor={{ fill: 'var(--bg3)' }}
                />
                <Bar dataKey="cost" name="Custo USD" fill="var(--orange)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Companies List */}
      <Card className="col-span-1 lg:col-span-2 bg-[var(--bg2)] border-[var(--bd)]">
        <CardHeader>
          <CardTitle className="text-sm text-[var(--text2)]">Tabela de Custo por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] sm:text-xs text-[var(--text2)] uppercase bg-[var(--bg2)] border-b border-[var(--bd)]">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Empresa</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-right hidden sm:table-cell">Tokens</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-right">USD</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-right hidden md:table-cell">BRL (Est.)</th>
                </tr>
              </thead>
              <tbody>
                {costByCompany.map((company, index) => (
                  <tr key={index} className="border-b border-[var(--bd)] hover:bg-[var(--bg3)]">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-[var(--text)] text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{company.companyName}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[var(--text2)] text-xs hidden sm:table-cell">{company.tokens.toLocaleString()}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[var(--text)] font-semibold text-xs sm:text-sm">${company.costUsd.toFixed(4)}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[var(--text)] font-semibold text-xs hidden md:table-cell">R$ {(company.costUsd * 6.0).toFixed(4)}</td>
                  </tr>
                ))}
                {costByCompany.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--text3)]">Nenhum custo registrado até o momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
