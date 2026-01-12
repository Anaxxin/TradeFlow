"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './AddAccountModal.module.css'; // Reusing styles
import { updateAccount } from '@/app/actions/accounts';

interface EditAccountModalProps {
    account: {
        id: string;
        name: string;
        type?: string;
        max_daily_loss?: number | null;
        max_drawdown?: number | null;
        is_trailing_drawdown?: boolean;
    };
    onClose: () => void;
    onSuccess: (updatedAccount?: any) => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ account, onClose, onSuccess }) => {
    const [name, setName] = useState(account.name);
    const [type, setType] = useState(account.type || 'Prop Account');
    const [maxDailyLoss, setMaxDailyLoss] = useState(account.max_daily_loss?.toString() || '');
    const [maxDrawdown, setMaxDrawdown] = useState(account.max_drawdown?.toString() || '');
    const [isTrailing, setIsTrailing] = useState(account.is_trailing_drawdown || false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const accountTypes = [
        { value: 'Live Account', label: 'Live Personal', color: 'red' },
        { value: 'Prop Account', label: 'Prop Firm (Apex, Topstep)', color: 'yellow' },
        { value: 'Demo Account', label: 'Demo / Paper', color: 'green' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate trailing drawdown percentage
        if (isTrailing && maxDrawdown && parseFloat(maxDrawdown) > 100) {
            setError('Trailing drawdown percentage cannot exceed 100%');
            setLoading(false);
            return;
        }

        const res = await updateAccount(
            account.id,
            name,
            type,
            maxDailyLoss ? parseFloat(maxDailyLoss) : null,
            maxDrawdown ? parseFloat(maxDrawdown) : null,
            isTrailing
        );

        if (res.success && res.data) {
            // Pass the updated account data to onSuccess
            onSuccess(res.data);
            onClose();
        } else {
            setError('Failed to update account.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Edit Account</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.formGroup}>
                        <label>Account Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Type</label>
                        <div className={styles.selectWrapper} ref={dropdownRef}>
                            <div 
                                className={styles.customSelect}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className={styles.dotIndicator}>
                                    <span className={`${styles.accountTypeDot} ${
                                        type === 'Demo Account' ? styles.green :
                                        type === 'Prop Account' ? styles.yellow :
                                        styles.red
                                    }`}></span>
                                </span>
                                <span>{accountTypes.find(t => t.value === type)?.label}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>▼</span>
                            </div>
                            {isDropdownOpen && (
                                <div className={styles.dropdownMenu}>
                                    {accountTypes.map((accountType) => (
                                        <div
                                            key={accountType.value}
                                            className={`${styles.dropdownOption} ${type === accountType.value ? styles.selected : ''}`}
                                            onClick={() => {
                                                setType(accountType.value);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            <span className={`${styles.accountTypeDot} ${styles[accountType.color]}`}></span>
                                            <span>{accountType.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Max Daily Loss ($) - Optional</label>
                        <input
                            type="number"
                            placeholder="e.g. 2000"
                            value={maxDailyLoss}
                            onChange={(e) => setMaxDailyLoss(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ margin: 0 }}>Max Drawdown {isTrailing ? '(%)' : '($)'} - Optional</label>
                            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 'normal', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={isTrailing}
                                    onChange={(e) => setIsTrailing(e.target.checked)}
                                    style={{ marginRight: '0.3rem' }}
                                />
                                Trailing?
                            </label>
                        </div>
                        <input
                            type="number"
                            placeholder={isTrailing ? "e.g. 10 (for 10%)" : "e.g. 5000"}
                            value={maxDrawdown}
                            onChange={(e) => setMaxDrawdown(e.target.value)}
                        />
                    </div>


                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAccountModal;
