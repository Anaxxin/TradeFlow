"use client";

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import styles from './ProfitChart.module.css';

interface ChartData {
    date: string;
    pnl: number;
}

interface ProfitChartProps {
    data: ChartData[];
}

const ProfitChart: React.FC<ProfitChartProps> = ({ data }) => {
    // Calculate cumulative P&L securely
    const cumulativeData = data.reduce((acc: any[], curr) => {
        const prevPnl = acc.length > 0 ? acc[acc.length - 1].cumulativePnl : 0;
        return [
            ...acc,
            {
                ...curr,
                cumulativePnl: prevPnl + curr.pnl
            }
        ];
    }, []);

    return (
        <div className={styles.chartContainer}>
            <h3 className={styles.title}>Cumulative P&L</h3>
            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData}>
                        <defs>
                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2e3646" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            stroke="#64748b"
                            tickFormatter={(value) => `$${value}`}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#131722',
                                border: '1px solid #2e3646',
                                borderRadius: '8px',
                                color: '#e0e6ed'
                            }}
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Net P&L']}
                        />
                        <Area
                            type="monotone"
                            dataKey="cumulativePnl"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPv)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProfitChart;
