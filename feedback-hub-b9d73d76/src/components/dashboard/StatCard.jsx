import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatCard({ title, value, icon: Icon, color, bgColor, isLoading }) {

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
                {isLoading ? (
                    <Skeleton className="h-10 w-10 rounded-lg" />
                ) : (
                    <div className={`p-2 rounded-lg ${bgColor}`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                )}
                
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
                    {isLoading ? (
                        <Skeleton className="h-6 w-16 mt-1" />
                    ) : (
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                            {value}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}