'use client'

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
    PieChart,
    Pie,
    Cell
} from 'recharts'

interface PerformanceChartsProps {
    revenueData: { date: string; amount: number }[]
    performanceData: { name: string; revenue: number; activities: number }[]
}

const COLORS = ['#0f172a', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']

export function PerformanceCharts({ revenueData, performanceData }: PerformanceChartsProps) {
    return (
        <div className="flex flex-col gap-12 break-inside-avoid">
            {/* Row 1: Revenue Flow & Sales Contribution */}
            <div className="grid grid-cols-5 gap-8 h-[300px]">
                <div className="col-span-3 border border-slate-100 p-6 rounded-lg flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-l-4 border-primary pl-3">기간별 매출 흐름</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                fontSize={10}
                                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                stroke="#94a3b8"
                            />
                            <YAxis
                                fontSize={10}
                                tickFormatter={(val) => `₩${(val / 10000).toLocaleString()}만`}
                                stroke="#94a3b8"
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(val: any) => [`₩ ${val?.toLocaleString()}`, '매출']}
                            />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#0f172a"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#0f172a' }}
                                activeDot={{ r: 6, stroke: '#0f172a', strokeWidth: 2, fill: '#fff' }}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="col-span-2 border border-slate-100 p-6 rounded-lg flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-l-4 border-blue-500 pl-3">영업 비중 (매출 기준)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={performanceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="revenue"
                                isAnimationActive={false}
                            >
                                {performanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: any) => `₩ ${val?.toLocaleString()}`} />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Detailed Performance Bar Chart */}
            <div className="border border-slate-100 p-6 rounded-lg h-[350px] flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-l-4 border-purple-500 pl-3">영업사원별 실적 데이터 (매출 & 활동)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={12} stroke="#475569" fontWeight="600" />
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" fontSize={10} tickFormatter={(val) => `${(val / 10000).toLocaleString()}만`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={10} />
                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                        <Legend iconType="rect" />
                        <Bar yAxisId="left" dataKey="revenue" name="수주 금액(₩)" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        <Bar yAxisId="right" dataKey="activities" name="영업 활동수" fill="#8b5cf6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
