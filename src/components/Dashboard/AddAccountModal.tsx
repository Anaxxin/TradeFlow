"use client";

import React, { useState } from 'react';
import styles from './AddAccountModal.module.css';
import { createAccount } from '@/app/actions/accounts';

interface AddAccountModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Prop Account');
    const [balance, setBalance] = useState('');
    const [maxDailyLoss, setMaxDailyLoss] = useState('');
    const [maxDrawdown, setMaxDrawdown] = useState('');
    const [isTrailing, setIsTrailing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

        const res = await createAccount(
            name,
            type,
            parseFloat(balance),
            maxDailyLoss ? parseFloat(maxDailyLoss) : undefined,
            maxDrawdown ? parseFloat(maxDrawdown) : undefined,
            isTrailing
        );

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            setError('Failed to create account. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Add New Account</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.formGroup}>
                        <label>Account Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Apex 50k - 01"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="Live Account">Live Personal</option>
                            <option value="Prop Account">Prop Firm (Apex, Topstep)</option>
                            <option value="Demo Account">Demo / Paper</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Initial Balance</label>
                        <input
                            type="number"
                            placeholder="50000"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            required
                        />
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
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAccountModal;
