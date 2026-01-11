"use client";

import React from 'react';
import styles from './AddAccountModal.module.css'; // Reusing modal styles
import { deleteTrade } from '@/app/actions/trades';

interface DeleteTradeModalProps {
    tradeId: string;
    symbol: string;
    onClose: () => void;
    onSuccess: () => void;
}

const DeleteTradeModal: React.FC<DeleteTradeModalProps> = ({ tradeId, symbol, onClose, onSuccess }) => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        const res = await deleteTrade(tradeId);
        if (res.success) {
            onSuccess();
            onClose();
        } else {
            setError('Failed to delete trade. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '400px' }}>
                <div className={styles.header}>
                    <h3>Delete Trade</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.form}>
                    <div style={{ color: 'var(--text-primary)' }}>
                        Are you sure you want to delete the trade for <strong>{symbol}</strong>? This action cannot be undone.
                    </div>

                    {error && <div className={styles.error} style={{ marginBottom: '1rem' }}>{error}</div>}

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className={styles.submitBtn}
                            style={{ backgroundColor: 'var(--accent-danger)' }}
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteTradeModal;
