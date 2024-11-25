"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartDataPoint {
    date: string;
    sessions: number;
    clicks: number;
    loggedIn: number;
    anonymous: number;
}

interface AdminTrafficChartProps {
    data: ChartDataPoint[];
    loggedInSessions: number;
    anonymousSessions: number;
}

const DONUT_COLORS = ["hsl(237 43% 50%)", "#94a3b8"];

export function AdminTrafficChart({ data, loggedInSessions, anonymousSessions }: AdminTrafficChartProps) {
    const donutData = [
        { name: "Logados", value: loggedInSessions },
        { name: "Anônimos", value: anonymousSessions },
    ];
    const total = loggedInSessions + anonymousSessions;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Area Chart — 2/3 */}
            <Card className="border-border shadow-sm lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Tráfego do Período</CardTitle>
                    <CardDescription className="text-xs">Acessos logados vs totais por dia.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(237 43% 50%)" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="hsl(237 43% 50%)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                                <YAxis axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid hsl(var(--border))",
                                        backgroundColor: "hsl(var(--background))",
                                        fontSize: "12px",
                                    }}
                                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="clicks" name="Acessos Totais"
                                    stroke="#10b981" fill="url(#gradClicks)" strokeWidth={2} />
                                <Area type="monotone" dataKey="loggedIn" name="Acessos Logados"
                                    stroke="hsl(237 43% 50%)" fill="url(#gradSessions)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Donut Chart — 1/3 */}
            <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Origem dos Acessos</CardTitle>
                    <CardDescription className="text-xs">Acessos logados vs anônimos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {donutData.map((entry, index) => (
                                        <Cell key={entry.name} fill={DONUT_COLORS[index]} />
                                    ))}
                                </Pie>
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`${value.toLocaleString("pt-BR")} acessos`, ""]}
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid hsl(var(--border))",
                                        backgroundColor: "hsl(var(--background))",
                                        fontSize: "12px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {total > 0 && (
                        <div className="mt-2 space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Logados</span>
                                <span className="font-medium">{loggedInSessions.toLocaleString("pt-BR")}
                                    <span className="text-muted-foreground ml-1">
                                        ({Math.round((loggedInSessions / total) * 100)}%)
                                    </span>
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Anônimos</span>
                                <span className="font-medium">{anonymousSessions.toLocaleString("pt-BR")}
                                    <span className="text-muted-foreground ml-1">
                                        ({Math.round((anonymousSessions / total) * 100)}%)
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
