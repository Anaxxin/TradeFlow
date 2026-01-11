"use client";

import React, { useState } from 'react';
import styles from './AddAccountModal.module.css'; // Reusing styles
import { deleteAccount } from '@/app/actions/accounts';

interface DeleteAccountModalProps {
    account: { id: string; name: string };
    onClose: () => void;
    onSuccess: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ account, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');

        const res = await deleteAccount(account.id);

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            setError('Failed to delete account.');
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 style={{ color: 'var(--loss-red)' }}>Delete Account</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.form}>
                    <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                        Are you sure you want to delete <strong>{account.name}</strong>?
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        This action is permanent and will delete all trades associated with this account.
                    </p>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button
                            onClick={handleDelete}
                            className={styles.submitBtn}
                            disabled={loading}
                            style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--loss-red)',
                                borderColor: 'var(--loss-red)'
                            }}
                        >
                            {loading ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
