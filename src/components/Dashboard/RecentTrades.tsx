"use client";

import React, { useState, useMemo, useEffect } from 'react';
import styles from './RecentTrades.module.css';
import EditTradeModal from './EditTradeModal';
import DeleteTradeModal from './DeleteTradeModal';
import { deleteTrade } from '@/app/actions/trades';

interface Trade {
    id: string;
    symbol: string;
    direction: string;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    pnl: number;
    date: string;
    commission: number;
    fees: number;
    stopLoss: number;
    is_be?: boolean;
}

const calcRR = (trade: Trade) => {
    if (!trade.stopLoss || trade.stopLoss === trade.entryPrice) return 0;
    const risk = Math.abs(trade.entryPrice - trade.stopLoss);
    const reward = trade.pnl; // Note: pnl is already net. 
    // Simplified RR calculation based on price points (since pnl uses multiplier)
    const priceDiff = trade.direction === 'LONG'
        ? (trade.exitPrice - trade.entryPrice)
        : (trade.entryPrice - trade.exitPrice);

    return priceDiff / risk;
};

interface RecentTradesProps {
    trades: Trade[];
}

const RECENT_TRADES_FILTER_STORAGE_KEY = 'tradezella_recent_trades_filter_preference';

const RecentTrades: React.FC<RecentTradesProps> = ({ trades }) => {
    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
    const [deletingTrade, setDeletingTrade] = useState<{ id: string, symbol: string } | null>(null);
    
    // Start with default to avoid hydration mismatch
    const [filterPeriod, setFilterPeriod] = useState<'this-week' | 'last-week' | 'this-month' | 'this-year' | 'all'>('this-week');
    const [isMounted, setIsMounted] = useState(false);

    // Load preference from localStorage after mount (client-side only)
    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(RECENT_TRADES_FILTER_STORAGE_KEY);
            if (saved && ['this-week', 'last-week', 'this-month', 'this-year', 'all'].includes(saved)) {
                setFilterPeriod(saved as 'this-week' | 'last-week' | 'this-month' | 'this-year' | 'all');
            }
        }
    }, []);

    // Save preference to localStorage whenever it changes
    useEffect(() => {
        if (isMounted && typeof window !== 'undefined') {
            localStorage.setItem(RECENT_TRADES_FILTER_STORAGE_KEY, filterPeriod);
        }
    }, [filterPeriod, isMounted]);

    const handleEditSuccess = () => {
        setEditingTrade(null);
        window.location.reload();
    };

    const handleDeleteSuccess = () => {
        setDeletingTrade(null);
        window.location.reload();
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const filteredTrades = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return trades.filter(trade => {
            const tradeDate = new Date(trade.date);

            if (filterPeriod === 'all') return true;

            if (filterPeriod === 'this-week') {
                const day = now.getDay(); // 0 is Sunday, 1 is Monday...
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
                const monday = new Date(now.setDate(diff));
                monday.setHours(0, 0, 0, 0);
                return tradeDate >= monday;
            }

            if (filterPeriod === 'last-week') {
                const day = now.getDay();
                const diff = now.getDate() - day - 6; // Previous Monday
                const lastMonday = new Date(now.setDate(diff));
                lastMonday.setHours(0, 0, 0, 0);
                const nextMonday = new Date(lastMonday);
                nextMonday.setDate(nextMonday.getDate() + 7);
                return tradeDate >= lastMonday && tradeDate < nextMonday;
            }

            if (filterPeriod === 'this-month') {
                return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
            }

            if (filterPeriod === 'this-year') {
                return tradeDate.getFullYear() === now.getFullYear();
            }

            return true;
        });
    }, [trades, filterPeriod]);

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className={styles.title} style={{ margin: 0 }}>Recent Trades</h3>
                <select
                    className={styles.periodSelect}
                    value={filterPeriod}
                    onChange={(e) => {
                        const newValue = e.target.value as 'this-week' | 'last-week' | 'this-month' | 'this-year' | 'all';
                        setFilterPeriod(newValue);
                    }}
                    style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        outline: 'none'
                    }}
                >
                    <option value="this-week">This Week</option>
                    <option value="last-week">Last Week</option>
                    <option value="this-month">This Month</option>
                    <option value="this-year">This Year</option>
                    <option value="all">All Trades</option>
                </select>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Side</th>
                            <th>Date</th>
                            <th>Qty</th>
                            <th>Entry</th>
                            <th>Exit</th>
                            <th style={{ textAlign: 'center' }}>P&L</th>
                            <th className={styles.textRight}>RR</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrades.map((trade) => {
                            let pnlClass = '';
                            if (trade.is_be) {
                                pnlClass = styles.beTrade;
                            } else if (trade.pnl > 0) {
                                pnlClass = styles.winTrade;
                            } else if (trade.pnl < 0) {
                                pnlClass = styles.lossTrade;
                            }
                            return (
                            <tr key={trade.id}>
                                <td className={styles.symbol}>{trade.symbol}</td>
                                <td>
                                    <span className={trade.direction === 'LONG' ? styles.badgeLong : styles.badgeShort}>
                                        {trade.direction}
                                    </span>
                                </td>
                                <td className={styles.date}>{formatDate(trade.date)}</td>
                                <td>{trade.quantity}</td>
                                <td>{trade.entryPrice.toFixed(2)}</td>
                                <td>{trade.exitPrice.toFixed(2)}</td>
                                <td className={`${styles.pnl} ${trade.pnl >= 0 ? styles.positive : styles.negative}`} style={{ textAlign: 'center' }}>
                                    <span className={pnlClass}>
                                        ${trade.pnl.toFixed(2)}
                                    </span>
                                </td>
                                <td className={styles.textRight} style={{ color: calcRR(trade) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                    {calcRR(trade).toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <button
                                        onClick={() => setEditingTrade(trade)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem', marginRight: '0.5rem' }}
                                        title="Edit Trade"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        onClick={() => setDeletingTrade({ id: trade.id, symbol: trade.symbol })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem' }}
                                        title="Delete Trade"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                            );
                        })}
                        {filteredTrades.length === 0 && (
                            <tr>
                                <td colSpan={9} className={styles.emptyState}>No trades found for this period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingTrade && (
                <EditTradeModal
                    trade={editingTrade}
                    onClose={() => setEditingTrade(null)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {deletingTrade && (
                <DeleteTradeModal
                    tradeId={deletingTrade.id}
                    symbol={deletingTrade.symbol}
                    onClose={() => setDeletingTrade(null)}
                    onSuccess={handleDeleteSuccess}
                />
            )}
        </div>
    );
};

export default RecentTrades;
