
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = {
    'não atende': '#ef4444',         // red-500
    'atende abaixo': '#f97316',      // orange-500
    'atende': '#facc15',             // yellow-400
    'supera parcialmente': '#3b82f6',// blue-500
    'supera': '#10b981',             // green-500
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent === 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function ClassificationDistributionChart({ data, isLoading }) {
    const chartData = data ? Object.entries(data)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value) : [];

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl h-full">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-gray-400" />
                    Distribuição por Classificação
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-full w-full" />
                    </div>
                ) : total > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} className="focus:outline-none" />
                                ))}
                            </Pie>
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.75rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Legend iconSize={8} wrapperStyle={{fontSize: '12px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <PieIcon className="w-10 h-10 mb-2" />
                        <p className="font-medium">Sem dados de classificação</p>
                        <p className="text-xs">Nenhuma avaliação enviada no período selecionado.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
