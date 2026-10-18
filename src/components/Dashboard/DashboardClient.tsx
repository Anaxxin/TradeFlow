"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from '../../app/page.module.css';
import modalStyles from './AddAccountModal.module.css';
import AddAccountModal from './AddAccountModal';
import AddTradeModal from './AddTradeModal';
import EditAccountModal from './EditAccountModal';
import DeleteAccountModal from './DeleteAccountModal';
import KPICards from './KPICards';
import ProfitChart from './ProfitChart';
import TradeCalendar from './TradeCalendar';
import RecentTrades from './RecentTrades';
import { getDashboardData } from '@/app/actions/trades';
import Link from 'next/link';

interface Account {
    id: string;
    name: string;
    type: string;
    initial_balance: number;
    max_daily_loss?: number | null;
    max_drawdown?: number | null;
    is_trailing_drawdown?: boolean;
}

export interface DashboardDataPayload {
    trades: any[];
    stats: {
        daily: { totalPnL: number; winRate: number; avgRR: number; avgWin: number; avgLoss: number; totalTrades: number };
        weekly: { totalPnL: number; winRate: number; avgRR: number; avgWin: number; avgLoss: number; totalTrades: number };
        monthly: { totalPnL: number; winRate: number; avgRR: number; avgWin: number; avgLoss: number; totalTrades: number };
        yearly: { totalPnL: number; winRate: number; avgRR: number; avgWin: number; avgLoss: number; totalTrades: number };
        allTime: { totalPnL: number; winRate: number; avgRR: number; avgWin: number; avgLoss: number; totalTrades: number };
        maxPnL: number;
        minPnL: number;
    };
    chartData: { date: string; pnl: number }[];
    calendarData: { date: string; pnl: number; tradeCount: number }[];
}

const STORAGE_KEY = 'tradeflow_last_account_id';

export default function DashboardClient({
    initialAccounts,
    initialData,
    initialAccountId
}: {
    initialAccounts: Account[];
    initialData: DashboardDataPayload;
    initialAccountId?: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlAccountId = searchParams.get('accountId');

    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [selectedAccountId, setSelectedAccountId] = useState<string>(
        urlAccountId || initialAccountId || initialAccounts[0]?.id || ''
    );

    // In-memory cache for fast instant account switching: accountId -> DashboardDataPayload
    const [accountDataCache, setAccountDataCache] = useState<Record<string, DashboardDataPayload>>(() => {
        const accId = initialAccountId || initialAccounts[0]?.id || '';
        return accId ? { [accId]: initialData } : {};
    });

    const [currentData, setCurrentData] = useState<DashboardDataPayload>(initialData);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Modals
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
    const [showNoAccountMessage, setShowNoAccountMessage] = useState(false);

    // Initial mount check from localStorage if no account in query param
    useEffect(() => {
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (!urlAccountId && storedId && accounts.some(a => a.id === storedId) && storedId !== selectedAccountId) {
            handleAccountChange(storedId);
        }
    }, []);

    // Instant switch function
    const handleAccountChange = async (targetId: string) => {
        if (!targetId || targetId === selectedAccountId) return;

        // 1. Immediately update UI state & local storage (instant dropdown & badges update)
        setSelectedAccountId(targetId);
        localStorage.setItem(STORAGE_KEY, targetId);

        // Shallowly update browser URL without Next.js full page re-render
        if (typeof window !== 'undefined') {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set('accountId', targetId);
            window.history.replaceState({ ...window.history.state, as: nextUrl.href, url: nextUrl.href }, '', nextUrl.href);
        }

        // 2. Check if account data is already in cache: instant switch
        if (accountDataCache[targetId]) {
            setCurrentData(accountDataCache[targetId]);
            return;
        }

        // 3. Otherwise fetch via Server Action and cache it
        setIsLoadingData(true);
        try {
            const res = await getDashboardData(targetId);
            if (res.success && res.data) {
                                const formattedTrades = (res.data.trades || []).map((t: any) => ({
                    id: t.id,
                    symbol: t.symbol,
                    direction: t.direction,
                    entryPrice: t.entry_price !== undefined ? t.entry_price : t.entryPrice,
                    exitPrice: t.exit_price !== undefined ? t.exit_price : t.exitPrice,
                    quantity: t.quantity,
                    pnl: t.pnl,
                    date: typeof (t.exit_time || t.exitTime || t.date) === 'string' ? (t.exit_time || t.exitTime || t.date) : new Date(t.exit_time || t.exitTime || t.date).toISOString(),
                    entryTime: typeof (t.entry_time || t.entryTime) === 'string' ? (t.entry_time || t.entryTime) : new Date(t.entry_time || t.entryTime || t.date).toISOString(),
                    exitTime: typeof (t.exit_time || t.exitTime) === 'string' ? (t.exit_time || t.exitTime) : new Date(t.exit_time || t.exitTime || t.date).toISOString(),
                    commission: t.commission,
                    fees: t.fees,
                    stopLoss: t.stop_loss !== undefined ? t.stop_loss : t.stopLoss,
                    is_be: t.is_be,
                    images: t.images,
                    notes: t.notes
                }));

                const payload: DashboardDataPayload = {
                    trades: formattedTrades,
                    stats: res.data.stats,
                    chartData: res.data.chartData || [],
                    calendarData: res.data.calendarData || []
                };

                setAccountDataCache(prev => ({ ...prev, [targetId]: payload }));
                setCurrentData(payload);
            }
        } catch (err) {
            console.error('Failed to load account data:', err);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleDataRefresh = async () => {
        if (!selectedAccountId) return;
        setIsLoadingData(true);
        try {
            const res = await getDashboardData(selectedAccountId);
            if (res.success && res.data) {
                                const formattedTrades = (res.data.trades || []).map((t: any) => ({
                    id: t.id,
                    symbol: t.symbol,
                    direction: t.direction,
                    entryPrice: t.entry_price !== undefined ? t.entry_price : t.entryPrice,
                    exitPrice: t.exit_price !== undefined ? t.exit_price : t.exitPrice,
                    quantity: t.quantity,
                    pnl: t.pnl,
                    date: typeof (t.exit_time || t.exitTime || t.date) === 'string' ? (t.exit_time || t.exitTime || t.date) : new Date(t.exit_time || t.exitTime || t.date).toISOString(),
                    entryTime: typeof (t.entry_time || t.entryTime) === 'string' ? (t.entry_time || t.entryTime) : new Date(t.entry_time || t.entryTime || t.date).toISOString(),
                    exitTime: typeof (t.exit_time || t.exitTime) === 'string' ? (t.exit_time || t.exitTime) : new Date(t.exit_time || t.exitTime || t.date).toISOString(),
                    commission: t.commission,
                    fees: t.fees,
                    stopLoss: t.stop_loss !== undefined ? t.stop_loss : t.stopLoss,
                    is_be: t.is_be,
                    images: t.images,
                    notes: t.notes
                }));

                const payload: DashboardDataPayload = {
                    trades: formattedTrades,
                    stats: res.data.stats,
                    chartData: res.data.chartData || [],
                    calendarData: res.data.calendarData || []
                };

                setAccountDataCache(prev => ({ ...prev, [selectedAccountId]: payload }));
                setCurrentData(payload);
            }
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleAccountCreate = (newAccount: any) => {
        const accountData: Account = {
            id: newAccount.id,
            name: newAccount.name,
            type: newAccount.type,
            initial_balance: newAccount.initial_balance,
            max_daily_loss: newAccount.max_daily_loss,
            max_drawdown: newAccount.max_drawdown,
            is_trailing_drawdown: newAccount.is_trailing_drawdown,
        };

        setAccounts(prevAccounts => [accountData, ...prevAccounts]);
        setSelectedAccountId(accountData.id);
        localStorage.setItem(STORAGE_KEY, accountData.id);
        window.location.href = '/dashboard?accountId=' + accountData.id;
    };

    const handleAccountEdit = (updatedAccount: any) => {
        const accountUpdate: Account = {
            id: updatedAccount.id,
            name: updatedAccount.name,
            type: updatedAccount.type,
            initial_balance: updatedAccount.initial_balance,
            max_daily_loss: updatedAccount.max_daily_loss,
            max_drawdown: updatedAccount.max_drawdown,
            is_trailing_drawdown: updatedAccount.is_trailing_drawdown,
        };

        setAccounts(prevAccounts =>
            prevAccounts.map(acc =>
                acc.id === accountUpdate.id ? accountUpdate : acc
            )
        );
        router.refresh();
    };

    const handleAccountDelete = async (deletedAccountId: string) => {
        const updatedAccounts = accounts.filter(acc => acc.id !== deletedAccountId);
        let newAccountId = '';

        if (selectedAccountId === deletedAccountId) {
            newAccountId = updatedAccounts.length > 0 ? updatedAccounts[0].id : '';
            if (newAccountId) {
                localStorage.setItem(STORAGE_KEY, newAccountId);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } else {
            newAccountId = selectedAccountId;
        }

        if (newAccountId) {
            window.location.href = '/dashboard?accountId=' + newAccountId;
        } else {
            window.location.href = '/dashboard';
        }
    };

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    const totalPnL = currentData.stats.allTime.totalPnL || 0;
    const dailyPnL = currentData.stats.daily.totalPnL || 0;
    const maxPnL = currentData.stats.maxPnL || 0;
    const minPnL = currentData.stats.minPnL || 0;

    // Calculate max drawdown dollar value
    const maxDrawdownDollarValue = selectedAccount?.max_drawdown
        ? selectedAccount.is_trailing_drawdown
            ? (selectedAccount.initial_balance + maxPnL) * (selectedAccount.max_drawdown / 100)
            : selectedAccount.max_drawdown
        : null;

    const isMaxDrawdownReached = maxDrawdownDollarValue !== null && totalPnL <= -maxDrawdownDollarValue;
    const isMaxDrawdownWarning = maxDrawdownDollarValue !== null &&
        !isMaxDrawdownReached &&
        totalPnL <= -(maxDrawdownDollarValue - 1000);

    return (
        <>
            <header className={styles.header}>
                <Link href="/dashboard" className={styles.logo} style={{ textDecoration: 'none' }}>
                    TradeFlow <span className={styles.brandSubtitle}>by anxn</span>
                </Link>

                <div className={styles.accountControls}>
                    {/* 1. Balance Controls */}
                    {selectedAccount && (
                        <div className={styles.balanceDisplay} style={{ transition: 'opacity 0.15s ease', opacity: isLoadingData ? 0.7 : 1 }}>
                            {selectedAccount.max_drawdown && (
                                <div className={styles.balanceItem}>
                                    <span className={styles.balanceLabel}>Max Drawdown:</span>
                                    <span className={styles.balance + ' ' + (isMaxDrawdownReached ? styles.dailyLossLimitWarning : isMaxDrawdownWarning ? styles.maxDrawdownWarning : '')}>
                                        {selectedAccount.is_trailing_drawdown
                                            ? '$' + ((selectedAccount.initial_balance + maxPnL) * (selectedAccount.max_drawdown / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' (' + selectedAccount.max_drawdown + '%)'
                                            : '$' + selectedAccount.max_drawdown.toLocaleString()
                                        }
                                    </span>
                                </div>
                            )}
                            {selectedAccount.max_daily_loss && (() => {
                                const isDailyLossLimitReached = dailyPnL <= -selectedAccount.max_daily_loss;
                                const isDailyLossLimitWarning = !isDailyLossLimitReached && dailyPnL <= -(selectedAccount.max_daily_loss - 500);
                                return (
                                    <div className={styles.balanceItem}>
                                        <span className={styles.balanceLabel}>Daily Loss Limit:</span>
                                        <span className={styles.balance + ' ' + (isDailyLossLimitReached ? styles.dailyLossLimitWarning : isDailyLossLimitWarning ? styles.dailyLossLimitYellowWarning : '')}>
                                            {'$' + selectedAccount.max_daily_loss.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })()}
                            <div className={styles.balanceDivider}></div>
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>Min:</span>
                                <span className={styles.balance}>{'$' + (selectedAccount.initial_balance + minPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>Max:</span>
                                <span className={styles.balance}>{'$' + (selectedAccount.initial_balance + maxPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className={styles.balanceDivider}></div>
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>Initial:</span>
                                <span className={styles.balance}>{'$' + selectedAccount.initial_balance.toLocaleString()}</span>
                            </div>
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>Balance:</span>
                                <span className={styles.balance + ' ' + (totalPnL > 0 ? styles.balancePositive : totalPnL < 0 ? styles.balanceNegative : '')}>
                                    {'$' + (selectedAccount.initial_balance + totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 2. Account Selector + Edit Button */}
                    <div className={styles.accountSelectorWrapper} style={{ display: 'flex', alignItems: 'center' }}>
                        <select
                            className={styles.accountSelect}
                            value={selectedAccountId}
                            onChange={(e) => handleAccountChange(e.target.value)}
                        >
                            {accounts.length === 0 && <option value="">No Accounts</option>}
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                        {isLoadingData && (
                            <span
                                style={{
                                    display: 'inline-block',
                                    marginLeft: '8px',
                                    width: '12px',
                                    height: '12px',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    borderTopColor: '#3b82f6',
                                    borderRadius: '50%',
                                    animation: 'spin 0.6s linear infinite'
                                }}
                                title="Loading account data..."
                            />
                        )}
                        {selectedAccount && (
                            <button
                                onClick={() => setIsEditAccountModalOpen(true)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '1.2rem' }}
                                title="Edit Account Name"
                            >
                                ✎
                            </button>
                        )}
                        {selectedAccount && (
                            <button
                                onClick={() => setIsDeleteAccountModalOpen(true)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '1.2rem' }}
                                title="Delete Account"
                            >
                                🗑️
                            </button>
                        )}
                    </div>

                    {/* Account Type Indicator */}
                    {selectedAccount && (
                        <span className={styles.accountTypeIndicator + ' ' + (
                            selectedAccount.type === 'Demo Account' ? styles.green :
                            selectedAccount.type === 'Prop Account' ? styles.yellow :
                            styles.red
                        )} title={
                            selectedAccount.type === 'Demo Account' ? 'Demo Account' :
                            selectedAccount.type === 'Prop Account' ? 'Prop Firm Account' :
                            'Live Account'
                        }></span>
                    )}

                    {/* 3. Log Trade Button */}
                    <button
                        onClick={() => {
                            if (accounts.length === 0) {
                                setShowNoAccountMessage(true);
                            } else if (!selectedAccountId) {
                                setShowNoAccountMessage(true);
                            } else {
                                setIsTradeModalOpen(true);
                            }
                        }}
                        className={styles.addAccountBtn}
                        style={{ backgroundColor: 'var(--accent-primary)', color: 'white', borderColor: 'var(--accent-primary)' }}
                    >
                        + Log Trade
                    </button>

                    {/* 4. Add Account */}
                    <button onClick={() => setIsAccountModalOpen(true)} className={styles.addAccountBtn}>
                        + Trade Account
                    </button>

                    {/* 5. Profile */}
                    <Link
                        href="/dashboard/profile"
                        className={styles.addAccountBtn}
                        style={{ backgroundColor: 'transparent', border: '1px solid #333', marginLeft: '10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                    >
                        Profile
                    </Link>

                    {/* 6. Sign Out */}
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className={styles.addAccountBtn}
                        style={{ backgroundColor: 'transparent', border: '1px solid #333', marginLeft: '10px' }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Dashboard Content with quick opacity transition when fetching fresh uncached account */}
            <div className={styles.content} style={{ transition: 'opacity 0.15s ease', opacity: isLoadingData ? 0.75 : 1 }}>
                <KPICards stats={currentData.stats} />

                <div className={styles.midSection}>
                    <div className={styles.chartArea}>
                        <ProfitChart data={currentData.chartData} />
                    </div>
                    <div className={styles.calendarArea}>
                        <TradeCalendar data={currentData.calendarData} accountId={selectedAccountId} trades={currentData.trades} />
                    </div>
                </div>

                <RecentTrades trades={currentData.trades} onDataRefresh={handleDataRefresh} />
            </div>

            {isAccountModalOpen && (
                <AddAccountModal
                    onClose={() => setIsAccountModalOpen(false)}
                    onSuccess={handleAccountCreate}
                />
            )}

            {isTradeModalOpen && selectedAccountId && (
                <AddTradeModal
                    accountId={selectedAccountId}
                    onClose={() => setIsTradeModalOpen(false)}
                    onSuccess={handleDataRefresh}
                />
            )}

            {isEditAccountModalOpen && selectedAccount && (
                <EditAccountModal
                    account={selectedAccount}
                    onClose={() => setIsEditAccountModalOpen(false)}
                    onSuccess={handleAccountEdit}
                />
            )}

            {isDeleteAccountModalOpen && selectedAccount && (
                <DeleteAccountModal
                    account={selectedAccount}
                    onClose={() => setIsDeleteAccountModalOpen(false)}
                    onSuccess={() => handleAccountDelete(selectedAccount.id)}
                />
            )}

            {showNoAccountMessage && (
                <div className={modalStyles.overlay} onClick={() => setShowNoAccountMessage(false)}>
                    <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={modalStyles.header}>
                            <h3>No Account Available</h3>
                            <button onClick={() => setShowNoAccountMessage(false)} className={modalStyles.closeBtn}>&times;</button>
                        </div>
                        <div className={modalStyles.form}>
                            <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                Please create a trading account to log a trade.
                            </p>
                            <div className={modalStyles.actions}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNoAccountMessage(false);
                                        setIsAccountModalOpen(true);
                                    }}
                                    className={modalStyles.submitBtn}
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
