"use client";

import React, { useState } from 'react';
import styles from './AddAccountModal.module.css'; // Reusing modal styles
import { logTrade } from '@/app/actions/trades';
import DateTimePicker from './DateTimePicker';

interface AddTradeModalProps {
    accountId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AddTradeModal: React.FC<AddTradeModalProps> = ({ accountId, onClose, onSuccess }) => {
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [symbol, setSymbol] = useState('');
    const [direction, setDirection] = useState('LONG');
    const [entryPrice, setEntryPrice] = useState('');
    const [exitPrice, setExitPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [entryTime, setEntryTime] = useState(getCurrentDateTime());
    const [exitTime, setExitTime] = useState(getCurrentDateTime());
    const [commission, setCommission] = useState('0');
    const [fees, setFees] = useState('0');
    const [isBE, setIsBE] = useState(false);

    // Calculate Estimated P&L locally
    const getEstimatedPnl = () => {
        const entry = parseFloat(entryPrice) || 0;
        const exit = parseFloat(exitPrice) || 0;
        const qty = parseFloat(quantity) || 1;
        const comm = parseFloat(commission) || 0;
        const f = parseFloat(fees) || 0;

        if (!symbol || entry === 0 || exit === 0) return null;

        const symbolUpper = symbol.toUpperCase();
        let multiplier = 1;
        if (symbolUpper.includes('MNQ')) multiplier = 2;
        else if (symbolUpper.includes('MES')) multiplier = 5;
        else if (symbolUpper.includes('NQ')) multiplier = 20;
        else if (symbolUpper.includes('ES')) multiplier = 50;
        else if (symbolUpper.includes('CL')) multiplier = 1000;
        else if (symbolUpper.includes('GC')) multiplier = 100;

        const diff = direction === 'LONG' ? (exit - entry) : (entry - exit);
        const gross = diff * qty * multiplier;
        return gross - comm - f;
    };

    const estimatedPnl = getEstimatedPnl();
    const showBEToggle = estimatedPnl !== null && estimatedPnl >= -25 && estimatedPnl <= 25;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!accountId) {
            setError("No account selected.");
            setLoading(false);
            return;
        }

        // Default dates if empty
        const now = new Date();
        const eTime = entryTime ? new Date(entryTime) : now;
        const xTime = exitTime ? new Date(exitTime) : now;

        const entry = parseFloat(entryPrice) || 0;
        const sl = parseFloat(stopLoss) || 0;

        if (direction === 'LONG' && sl >= entry) {
            setError("Stop Loss must be lower than Entry Price for Long trades.");
            setLoading(false);
            return;
        }
        if (direction === 'SHORT' && sl <= entry) {
            setError("Stop Loss must be higher than Entry Price for Short trades.");
            setLoading(false);
            return;
        }

        const res = await logTrade({
            accountId,
            symbol,
            direction,
            entryPrice: parseFloat(entryPrice) || 0,
            exitPrice: parseFloat(exitPrice) || 0,
            stopLoss: parseFloat(stopLoss) || 0,
            quantity: parseInt(quantity) || 1,
            entryTime: eTime,
            exitTime: xTime,
            commission: parseFloat(commission) || 0,
            fees: parseFloat(fees) || 0,
            isBE: showBEToggle ? isBE : false
        });

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            setError('Failed to log trade. Please check inputs.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.modalLarge}`}>
                <div className={styles.header}>
                    <h3>Log New Trade</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Symbol</label>
                            <input
                                type="text"
                                placeholder="e.g. NQ, ES"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Direction</label>
                            <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                                <option value="LONG">Long</option>
                                <option value="SHORT">Short</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.grid3}>
                        <div className={styles.formGroup}>
                            <label>Entry Price</label>
                            <input type="number" step="0.25" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Stop Loss</label>
                            <input type="number" step="0.25" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Exit Price</label>
                            <input type="number" step="0.25" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} required />
                        </div>
                    </div>

                    <div className={styles.grid3}>
                        <div className={styles.formGroup}>
                            <label>Contracts</label>
                            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Commission ($)</label>
                            <input type="number" step="0.01" value={commission} onChange={(e) => setCommission(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Fees ($)</label>
                            <input type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <DateTimePicker
                            label="Entry Time"
                            value={entryTime}
                            onChange={(val) => setEntryTime(val)}
                            required
                        />
                        <DateTimePicker
                            label="Exit Time"
                            value={exitTime}
                            onChange={(val) => setExitTime(val)}
                            required
                        />
                    </div>

                    {showBEToggle && (
                        <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="be-checkbox"
                                checked={isBE}
                                onChange={(e) => setIsBE(e.target.checked)}
                                style={{ width: 'auto' }}
                            />
                            <label htmlFor="be-checkbox" style={{ marginBottom: 0, cursor: 'pointer' }}>Break-Even (BE) Trade? (Excludes from Win Rate)</label>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Logging...' : 'Log Trade'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTradeModal;
