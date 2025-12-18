
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { BarChart3 } from 'lucide-react';

export default function NotesDistributionChart({ data, isLoading }) {
    const chartData = data ? data.map((value, index) => ({
        name: `Nota ${index}`,
        value: value,
    })) : [];
    
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl h-full">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                     <BarChart3 className="w-5 h-5 text-gray-400" />
                    Distribuição por Nota
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-full w-full" />
                    </div>
                ) : total > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                             <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                            <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{fontSize: 12}} axisLine={false} tickLine={false} width={30}/>
                            <Tooltip 
                                 cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}
                                 contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.75rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="value" position="top" formatter={(value) => value > 0 ? value : ''} style={{fontSize: '12px', fill: '#374151'}} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <BarChart3 className="w-10 h-10 mb-2" />
                        <p className="font-medium">Sem dados de notas</p>
                        <p className="text-xs">Nenhuma avaliação enviada no período.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
