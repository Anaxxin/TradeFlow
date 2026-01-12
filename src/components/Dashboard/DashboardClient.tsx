"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../app/page.module.css'; // Importing from app styles for header
import modalStyles from './AddAccountModal.module.css';
import AddAccountModal from './AddAccountModal';
import AddTradeModal from './AddTradeModal';
import EditAccountModal from './EditAccountModal';
import DeleteAccountModal from './DeleteAccountModal';

interface Account {
    id: string;
    name: string;
    type: string;
    initial_balance: number;
    max_daily_loss?: number | null;
    max_drawdown?: number | null;
    is_trailing_drawdown?: boolean;
}

const STORAGE_KEY = 'tradeflow_last_account_id';

export default function DashboardClient({
    initialAccounts,
    totalPnL = 0,
    dailyPnL = 0,
    maxPnL = 0,
    minPnL = 0,
    children
}: {
    initialAccounts: Account[],
    totalPnL?: number,
    dailyPnL?: number,
    maxPnL?: number,
    minPnL?: number,
    children: React.ReactNode
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlAccountId = searchParams.get('accountId');

    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [selectedAccountId, setSelectedAccountId] = useState<string>(urlAccountId || initialAccounts[0]?.id || '');

    // Modals
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
    const [showNoAccountMessage, setShowNoAccountMessage] = useState(false);

    // Sync state with URL or LocalStorage
    useEffect(() => {
        const storedId = localStorage.getItem(STORAGE_KEY);

        // If no ID in URL but we have one in storage, redirect
        if (!urlAccountId && storedId && accounts.some(a => a.id === storedId)) {
            setSelectedAccountId(storedId);
            router.push(`?accountId=${storedId}`);
        } else if (urlAccountId) {
            setSelectedAccountId(urlAccountId);
        }
    }, [urlAccountId, accounts, router]);

    const handleAccountChange = (id: string) => {
        setSelectedAccountId(id);
        localStorage.setItem(STORAGE_KEY, id);
        router.push(`?accountId=${id}`);
    };

    const handleDataRefresh = () => {
        router.refresh();
    };

    const handleAccountCreate = (newAccount: any) => {
        // Map Prisma account fields to our Account interface
        const accountData: Account = {
            id: newAccount.id,
            name: newAccount.name,
            type: newAccount.type,
            initial_balance: newAccount.initial_balance,
            max_daily_loss: newAccount.max_daily_loss,
            max_drawdown: newAccount.max_drawdown,
            is_trailing_drawdown: newAccount.is_trailing_drawdown,
        };

        // Add the new account to local state
        setAccounts(prevAccounts => [accountData, ...prevAccounts]);
        
        // Select the new account
        setSelectedAccountId(accountData.id);
        localStorage.setItem(STORAGE_KEY, accountData.id);
        
        // Navigate to the new account and do a full page reload to get fresh data
        window.location.href = `?accountId=${accountData.id}`;
    };

    const handleAccountEdit = (updatedAccount: any) => {
        // Update the account in the local state immediately
        // Map Prisma account fields to our Account interface
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
        // Also refresh server data
        router.refresh();
    };

    const handleAccountDelete = async (deletedAccountId: string) => {
        // Find the account to switch to before deletion
        const updatedAccounts = accounts.filter(acc => acc.id !== deletedAccountId);
        let newAccountId = '';
        
        // If the deleted account was selected, switch to another account
        if (selectedAccountId === deletedAccountId) {
            newAccountId = updatedAccounts.length > 0 ? updatedAccounts[0].id : '';
            if (newAccountId) {
                localStorage.setItem(STORAGE_KEY, newAccountId);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } else {
            // Keep the current account selected
            newAccountId = selectedAccountId;
        }

        // Use a full page reload to ensure fresh data from server
        // This is necessary because Next.js may cache server component data
        // and router.refresh() alone doesn't always clear the cache properly
        if (newAccountId) {
            window.location.href = `?accountId=${newAccountId}`;
        } else {
            window.location.href = '/';
        }
    };

    // Sync accounts state when initialAccounts prop changes (after server refresh)
    useEffect(() => {
        const accountsChanged = initialAccounts.length !== accounts.length || 
            initialAccounts.some((acc, idx) => acc.id !== accounts[idx]?.id);
        
        if (accountsChanged) {
            setAccounts(initialAccounts);
            // Update selected account if current one no longer exists
            if (selectedAccountId && !initialAccounts.some(acc => acc.id === selectedAccountId)) {
                const newAccountId = initialAccounts.length > 0 ? initialAccounts[0].id : '';
                setSelectedAccountId(newAccountId);
                if (newAccountId) {
                    localStorage.setItem(STORAGE_KEY, newAccountId);
                    router.push(`?accountId=${newAccountId}`);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialAccounts]);

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    // Calculate max drawdown dollar value for comparison
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
                <div className={styles.logo}>
                    TradeFlow <span className={styles.brandSubtitle}>by anxn</span>
                </div>

                <div className={styles.accountControls}>
                    {/* 1. Balance (Far Left of controls) */}
                    {selectedAccount && (
                        <div className={styles.balanceDisplay}>
                            {selectedAccount.max_drawdown && (
                                <div className={styles.balanceItem}>
                                    <span className={styles.balanceLabel}>Max Drawdown:</span>
                                    <span className={`${styles.balance} ${isMaxDrawdownReached ? styles.dailyLossLimitWarning : isMaxDrawdownWarning ? styles.maxDrawdownWarning : ''}`}>
                                        {selectedAccount.is_trailing_drawdown
                                            ? `$${((selectedAccount.initial_balance + maxPnL) * (selectedAccount.max_drawdown / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} (${selectedAccount.max_drawdown}%)`
                                            : `$${selectedAccount.max_drawdown.toLocaleString()}`
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
                                        <span className={`${styles.balance} ${isDailyLossLimitReached ? styles.dailyLossLimitWarning : isDailyLossLimitWarning ? styles.dailyLossLimitYellowWarning : ''}`}>
                                            ${selectedAccount.max_daily_loss.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })()}
                            <div className={styles.balanceDivider}></div>
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>Min:</span>
                                <span className={styles.balance}>${(selectedAccount.initial_balance + minPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>Max:</span>
                                <span className={styles.balance}>${(selectedAccount.initial_balance + maxPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className={styles.balanceDivider}></div>
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>Initial:</span>
                                <span className={styles.balance}>${selectedAccount.initial_balance.toLocaleString()}</span>
                            </div>
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>Balance:</span>
                                <span className={`${styles.balance} ${totalPnL > 0 ? styles.balancePositive : totalPnL < 0 ? styles.balanceNegative : ''}`}>
                                    ${(selectedAccount.initial_balance + totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        <span className={`${styles.accountTypeIndicator} ${
                            selectedAccount.type === 'Demo Account' ? styles.green :
                            selectedAccount.type === 'Prop Account' ? styles.yellow :
                            styles.red
                        }`} title={
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

                    {/* 4. Add Account (Far Right) */}
                    <button onClick={() => setIsAccountModalOpen(true)} className={styles.addAccountBtn}>
                        + Account
                    </button>
                </div>
            </header>

            {children}

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
