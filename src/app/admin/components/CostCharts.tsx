"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  const topCompanies = costByCompany.slice(0, 5).map(c => ({
    name: c.companyName.length > 15 ? c.companyName.substring(0, 15) + "..." : c.companyName,
    cost: parseFloat(c.costUsd.toFixed(4))
  }));

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
        <Card className="bg-emerald-950/20 border-emerald-500/20">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-emerald-400/80 font-normal flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Custo Total API (USD)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-3xl font-bold text-emerald-400">${totalCostUSD.toFixed(4)}</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-950/20 border-emerald-500/20">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-emerald-400/80 font-normal flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Custo Total API (BRL)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-3xl font-bold text-emerald-400">R$ {totalCostBRL.toFixed(4)}</p>
            <p className="text-xs text-emerald-400/60 mt-1">Estimativa Conversão R$ 6.00</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="bg-zinc-900/50 border-purple-500/10">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-300">Custo Diário (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedTimeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7', borderRadius: '8px' }}
                  itemStyle={{ color: '#a78bfa' }}
                />
                <Line type="monotone" dataKey="costUSD" name="Custo USD" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Companies Chart */}
      <Card className="bg-zinc-900/50 border-purple-500/10">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-300">Top 5 Custos por Empresa (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCompanies} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7', borderRadius: '8px' }}
                  cursor={{ fill: '#27272a' }}
                />
                <Bar dataKey="cost" name="Custo USD" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Companies List */}
      <Card className="col-span-1 lg:col-span-2 bg-zinc-900/50 border-purple-500/10">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-300">Tabela de Custo por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium text-right">Tokens Consumidos</th>
                  <th className="px-4 py-3 font-medium text-right">Custo USD</th>
                  <th className="px-4 py-3 font-medium text-right">Custo BRL (Estimado)</th>
                </tr>
              </thead>
              <tbody>
                {costByCompany.map((company, index) => (
                  <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-4 py-3 font-medium text-zinc-200">{company.companyName}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{company.tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">${company.costUsd.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">R$ {(company.costUsd * 6.0).toFixed(4)}</td>
                  </tr>
                ))}
                {costByCompany.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Nenhum custo registrado até o momento.</td>
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
