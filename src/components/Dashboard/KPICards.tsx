"use client";

import React, { useState, useEffect } from 'react';
import styles from './KPICards.module.css';

interface StatItem {
    totalPnL: number;
    winRate: number;
    avgRR: number;
    avgWin: number;
    avgLoss: number;
    totalTrades: number;
}

interface KPIProps {
    stats: {
        daily: StatItem;
        weekly: StatItem;
        monthly: StatItem;
        yearly: StatItem;
        allTime: StatItem;
    };
}

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'allTime';

// Persistence keys
const STORAGE_KEYS = {
    pnl: 'tf_pnl_range',
    winRate: 'tf_winrate_range',
    avgRR: 'tf_avgrr_range',
    avgWinLoss: 'tf_avgwinloss_range'
};

const KPICards: React.FC<KPIProps> = ({ stats }) => {
    const [pnlRange, setPnlRange] = useState<TimeRange>('allTime');
    const [winRateRange, setWinRateRange] = useState<TimeRange>('allTime');
    const [avgRRRange, setAvgRRRange] = useState<TimeRange>('allTime');
    const [avgWinLossRange, setAvgWinLossRange] = useState<TimeRange>('allTime');
    const [isMounted, setIsMounted] = useState(false);

    // Load preferences
    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined') {
            const p = localStorage.getItem(STORAGE_KEYS.pnl) as TimeRange;
            const w = localStorage.getItem(STORAGE_KEYS.winRate) as TimeRange;
            const r = localStorage.getItem(STORAGE_KEYS.avgRR) as TimeRange;
            const wl = localStorage.getItem(STORAGE_KEYS.avgWinLoss) as TimeRange;

            const valid = ['daily', 'weekly', 'monthly', 'yearly', 'allTime'];
            if (p && valid.includes(p)) setPnlRange(p);
            if (w && valid.includes(w)) setWinRateRange(w);
            if (r && valid.includes(r)) setAvgRRRange(r);
            if (wl && valid.includes(wl)) setAvgWinLossRange(wl);
        }
    }, []);

    // Save preferences
    useEffect(() => {
        if (isMounted) localStorage.setItem(STORAGE_KEYS.pnl, pnlRange);
    }, [pnlRange, isMounted]);

    useEffect(() => {
        if (isMounted) localStorage.setItem(STORAGE_KEYS.winRate, winRateRange);
    }, [winRateRange, isMounted]);

    useEffect(() => {
        if (isMounted) localStorage.setItem(STORAGE_KEYS.avgRR, avgRRRange);
    }, [avgRRRange, isMounted]);

    useEffect(() => {
        if (isMounted) localStorage.setItem(STORAGE_KEYS.avgWinLoss, avgWinLossRange);
    }, [avgWinLossRange, isMounted]);

    const renderRangeSelect = (value: TimeRange, onChange: (v: TimeRange) => void) => (
        <select
            className={styles.pnlSelect}
            value={value}
            onChange={(e) => onChange(e.target.value as TimeRange)}
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', fontSize: '0.70rem', cursor: 'pointer', outline: 'none' }}
        >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="allTime">All Time</option>
        </select>
    );

    const formatRangeLabel = (range: TimeRange, label: string) => {
        const prefix = range === 'allTime' ? 'Total' : range.charAt(0).toUpperCase() + range.slice(1);
        return `${prefix} ${label}`;
    };

    return (
        <div className={styles.grid}>
            {/* P&L Card */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.label}>{formatRangeLabel(pnlRange, 'P&L')}</div>
                    {renderRangeSelect(pnlRange, setPnlRange)}
                </div>
                <div className={`${styles.value} ${stats[pnlRange].totalPnL >= 0 ? styles.positive : styles.negative}`}>
                    ${stats[pnlRange].totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={styles.subtext}>{stats[pnlRange].totalTrades} Trades</div>
            </div>

            {/* Win Rate Card */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.label}>{formatRangeLabel(winRateRange, 'Win Rate')}</div>
                    {renderRangeSelect(winRateRange, setWinRateRange)}
                </div>
                <div className={styles.value}>
                    {(stats[winRateRange].winRate * 100).toFixed(1)}%
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${stats[winRateRange].winRate * 100}%` }}></div>
                </div>
            </div>

            {/* Avg RR Card */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.label}>{formatRangeLabel(avgRRRange, 'Avg RR')}</div>
                    {renderRangeSelect(avgRRRange, setAvgRRRange)}
                </div>
                <div className={styles.value}>{stats[avgRRRange].avgRR.toFixed(2)}</div>
                <div className={styles.subtext}>Risk : Reward</div>
            </div>

            {/* Avg Win / Loss */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.label}>{formatRangeLabel(avgWinLossRange, 'Avg Win/Loss')}</div>
                    {renderRangeSelect(avgWinLossRange, setAvgWinLossRange)}
                </div>
                <div className={styles.valueRow}>
                    <span className={styles.positive}>${stats[avgWinLossRange].avgWin.toFixed(0)}</span>
                    <span className={styles.divider}>/</span>
                    <span className={styles.negative}>${Math.abs(stats[avgWinLossRange].avgLoss).toFixed(0)}</span>
                </div>
            </div>
        </div>
    );
};

export default KPICards;
