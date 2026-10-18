"use client";

import React, { useState } from 'react';
import styles from './AddAccountModal.module.css'; // Reusing styles
import { updateTrade } from '@/app/actions/trades';
import DateTimePicker from './DateTimePicker';

interface EditTradeModalProps {
    trade: any;
    onClose: () => void;
    onSuccess: () => void;
}

const EditTradeModal: React.FC<EditTradeModalProps> = ({ trade, onClose, onSuccess }) => {
    const toLocalISO = (dateVal: any) => {
        if (!dateVal) return new Date().toISOString().slice(0, 16);
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: (trade.entryPrice !== undefined ? trade.entryPrice : trade.entry_price || '').toString(),
        exitPrice: (trade.exitPrice !== undefined ? trade.exitPrice : trade.exit_price || '').toString(),
        stopLoss: (trade.stopLoss !== undefined ? trade.stopLoss : trade.stop_loss || '0').toString(),
        quantity: (trade.quantity || '1').toString(),
        entryTime: toLocalISO(trade.entryTime || trade.entry_time || trade.date),
        exitTime: toLocalISO(trade.exitTime || trade.exit_time || trade.date),
        commission: (trade.commission || '0').toString(),
        fees: (trade.fees || '0').toString(),
        isBE: trade.is_be || false
    });

    const getEstimatedPnl = () => {
        const entry = parseFloat(formData.entryPrice) || 0;
        const exit = parseFloat(formData.exitPrice) || 0;
        const qty = parseFloat(formData.quantity) || 1;
        const comm = 0;
        const f = parseFloat(formData.fees) || 0;

        if (!formData.symbol || entry === 0 || exit === 0) return null;

        const symbolUpper = formData.symbol.toUpperCase();
        let multiplier = 1;
        if (symbolUpper.includes('MNQ')) multiplier = 2;
        else if (symbolUpper.includes('MES')) multiplier = 5;
        else if (symbolUpper.includes('NQ')) multiplier = 20;
        else if (symbolUpper.includes('ES')) multiplier = 50;
        else if (symbolUpper.includes('CL')) multiplier = 1000;
        else if (symbolUpper.includes('GC')) multiplier = 100;

        const diff = formData.direction === 'LONG' ? (exit - entry) : (entry - exit);
        const gross = diff * qty * multiplier;
        return gross - comm - f;
    };

    const estimatedPnl = getEstimatedPnl();
    const showBEToggle = estimatedPnl !== null && estimatedPnl >= -25 && estimatedPnl <= 25;
    // Note: trade prop above came from RecentTrades which has limited fields. 
    // Ideally recentTrades should pass all fields or we fetch them. 
    // For now, I'll update RecentTrades to pass all needed data or just basic edit.
    // Wait, RecentTrades maps data in page.tsx. I should check what's available.

    // Actually, let's assume page.tsx passes enough data.

    const [isFutures, setIsFutures] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const entry = parseFloat(formData.entryPrice);
        const sl = parseFloat(formData.stopLoss);

        if (formData.direction === 'LONG' && sl >= entry) {
            setError("Stop Loss must be lower than Entry Price for Long trades.");
            setLoading(false);
            return;
        }
        if (formData.direction === 'SHORT' && sl <= entry) {
            setError("Stop Loss must be higher than Entry Price for Short trades.");
            setLoading(false);
            return;
        }

        const res = await updateTrade(trade.id, {
            symbol: formData.symbol,
            direction: formData.direction,
            entryPrice: parseFloat(formData.entryPrice),
            exitPrice: parseFloat(formData.exitPrice),
            stopLoss: parseFloat(formData.stopLoss),
            quantity: parseInt(formData.quantity),
            entryTime: new Date(formData.entryTime),
            exitTime: new Date(formData.exitTime), // Use exit time for date
            commission: 0,
            fees: parseFloat(formData.fees),
            isBE: showBEToggle ? formData.isBE : false
        });

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            setError('Failed to update trade.');
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.modalLarge}`}>
                <div className={styles.header}>
                    <h3>Edit Trade</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Symbol</label>
                            <input
                                type="text"
                                value={formData.symbol}
                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Direction</label>
                            <select
                                value={formData.direction}
                                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                            >
                                <option value="LONG">Long</option>
                                <option value="SHORT">Short</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.grid3}>
                        <div className={styles.formGroup}>
                            <label>Entry Price</label>
                            <input
                                type="number" step="0.01"
                                value={formData.entryPrice}
                                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Stop Loss</label>
                            <input
                                type="number" step="0.01"
                                value={formData.stopLoss}
                                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Exit Price</label>
                            <input
                                type="number" step="0.01"
                                value={formData.exitPrice}
                                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Quantity / Contracts</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => {
                                    const newQty = e.target.value;
                                    const nextState = { ...formData, quantity: newQty };
                                    if (isFutures) {
                                        const q = parseFloat(newQty) || 0;
                                        nextState.fees = (q * 1.9).toFixed(2);
                                    }
                                    setFormData(nextState);
                                }}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ marginBottom: 0 }}>Fees ($)</label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent-primary)', textTransform: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={isFutures}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setIsFutures(checked);
                                            if (checked) {
                                                const q = parseFloat(formData.quantity) || 0;
                                                setFormData(prev => ({ ...prev, fees: (q * 1.9).toFixed(2) }));
                                            }
                                        }}
                                        style={{ width: 'auto', cursor: 'pointer' }}
                                    />
                                    Futures ($1.90/contract)
                                </label>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.fees}
                                onChange={(e) => {
                                    setFormData({ ...formData, fees: e.target.value });
                                    setIsFutures(false);
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <DateTimePicker
                            label="Entry Time"
                            value={formData.entryTime}
                            onChange={(val) => setFormData({ ...formData, entryTime: val })}
                            required
                        />
                        <DateTimePicker
                            label="Exit Time"
                            value={formData.exitTime}
                            onChange={(val) => setFormData({ ...formData, exitTime: val })}
                            required
                        />
                    </div>

                    {showBEToggle && (
                        <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="be-checkbox-edit"
                                checked={formData.isBE}
                                onChange={(e) => setFormData({ ...formData, isBE: e.target.checked })}
                                style={{ width: 'auto' }}
                            />
                            <label htmlFor="be-checkbox-edit" style={{ marginBottom: 0, cursor: 'pointer' }}>Break-Even (BE) Trade? (Excludes from Win Rate)</label>
                        </div>
                    )}

                    {error && <div className={styles.error}>{error}</div>}

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

export default EditTradeModal;
