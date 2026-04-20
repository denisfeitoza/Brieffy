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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Activity } from "lucide-react";

interface CostChartsProps {
  totalCostUSD: number;
  totalCostBRL: number;
  costByCompany: { companyName: string; costUsd: number; tokens: number }[];
  timelineData: { date: string; costUsd: number; costBrl: number }[];
}

export function CostCharts({ totalCostUSD, totalCostBRL, costByCompany, timelineData }: CostChartsProps) {
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
