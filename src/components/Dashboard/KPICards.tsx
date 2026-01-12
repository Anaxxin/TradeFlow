"use client";

import React, { useState, useEffect } from 'react';
import styles from './KPICards.module.css';

interface KPIProps {
    netPnL: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    totalTrades: number;
    dailyPnL: number;
    dailyTradesCount: number;
    monthlyPnL: number;
    monthlyTradesCount: number;
    yearlyPnL: number;
    yearlyTradesCount: number;
    avgRR: number;
}

const PNL_VIEW_STORAGE_KEY = 'tradezella_pnl_view_preference';

const KPICards: React.FC<KPIProps> = ({
    netPnL, winRate, avgRR, avgWin, avgLoss, totalTrades,
    dailyPnL, dailyTradesCount, monthlyPnL, monthlyTradesCount, yearlyPnL, yearlyTradesCount
}) => {
    // Start with default to avoid hydration mismatch
    const [pnlView, setPnlView] = useState<'net' | 'daily' | 'monthly' | 'yearly'>('daily');
    const [isMounted, setIsMounted] = useState(false);

    // Load preference from localStorage after mount (client-side only)
    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(PNL_VIEW_STORAGE_KEY);
            if (saved && ['net', 'daily', 'monthly', 'yearly'].includes(saved)) {
                setPnlView(saved as 'net' | 'daily' | 'monthly' | 'yearly');
            }
        }
    }, []);

    // Save preference to localStorage whenever it changes
    useEffect(() => {
        if (isMounted && typeof window !== 'undefined') {
            localStorage.setItem(PNL_VIEW_STORAGE_KEY, pnlView);
        }
    }, [pnlView, isMounted]);

    const getCurrentPnL = () => {
        switch (pnlView) {
            case 'daily': return dailyPnL;
            case 'monthly': return monthlyPnL;
            case 'yearly': return yearlyPnL;
            default: return netPnL;
        }
    };

    const getCurrentTradeCount = () => {
        switch (pnlView) {
            case 'daily': return dailyTradesCount;
            case 'monthly': return monthlyTradesCount;
            case 'yearly': return yearlyTradesCount;
            default: return totalTrades;
        }
    };

    const currentPnL = getCurrentPnL();
    const currentTrades = getCurrentTradeCount();
    return (
        <div className={styles.grid}>
            {/* Net P&L Card with Dropdown */}
            <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className={styles.label}>
                        {pnlView === 'net' ? 'Net P&L' : pnlView === 'daily' ? 'Daily P&L' : pnlView === 'monthly' ? 'Monthly P&L' : 'Yearly P&L'}
                    </div>
                    <select
                        className={styles.pnlSelect}
                        value={pnlView}
                        onChange={(e) => {
                            const newValue = e.target.value as 'net' | 'daily' | 'monthly' | 'yearly';
                            setPnlView(newValue);
                        }}
                        style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="net">All Time</option>
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <div className={`${styles.value} ${currentPnL >= 0 ? styles.positive : styles.negative}`}>
                    ${currentPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={styles.subtext}>{currentTrades} Trades</div>
            </div>

            {/* Win Rate Card */}
            <div className={styles.card}>
                <div className={styles.label}>Win Rate</div>
                <div className={styles.value}>
                    {(winRate * 100).toFixed(1)}%
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${winRate * 100}%` }}></div>
                </div>
            </div>

            {/* Avg RR Card */}
            <div className={styles.card}>
                <div className={styles.label}>Avg RR</div>
                <div className={styles.value}>{avgRR.toFixed(2)}</div>
                <div className={styles.subtext}>
                    Risk : Reward
                </div>
            </div>

            {/* Avg Win / Loss */}
            <div className={styles.card}>
                <div className={styles.label}>Avg Win / Loss</div>
                <div className={styles.valueRow}>
                    <span className={styles.positive}>${avgWin.toFixed(0)}</span>
                    <span className={styles.divider}>/</span>
                    <span className={styles.negative}>${Math.abs(avgLoss).toFixed(0)}</span>
                </div>
            </div>
        </div>
    );
};

export default KPICards;
