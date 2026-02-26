'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './Profile.module.css';

const PAYMENT_METHODS = [
    { id: 'vodafone', name: 'Vodafone Cash' },
    { id: 'telda', name: 'Telda' },
    { id: 'instapay', name: 'Instapay' },
    { id: 'crypto', name: 'Crypto (USDT)' },
];

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile State
    const [formData, setFormData] = useState({
        name: '',
        lastPaymentMethod: '',
        lastPaymentTransactionId: '',
    });

    const [subscriptionInfo, setSubscriptionInfo] = useState({
        status: '',
        expiresAt: '',
        email: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                const data = await res.json();
                if (data.success) {
                    setFormData({
                        name: data.user.name || '',
                        lastPaymentMethod: data.user.lastPaymentMethod || '',
                        lastPaymentTransactionId: data.user.lastPaymentTransactionId || '',
                    });
                    setSubscriptionInfo({
                        status: data.user.subscriptionStatus,
                        expiresAt: data.user.subscriptionExpiresAt,
                        email: data.user.email
                    });
                }
            } catch (error) {
                console.error('Failed to fetch profile', error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchProfile();
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Update session
                await update({ name: formData.name });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Something went wrong' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading Profile...</div>;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Account Profile</h1>

            <div className={styles.grid}>
                {/* Basic Info Section */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Basic Information</h2>
                    <div className={styles.field}>
                        <label className={styles.label}>Email Address</label>
                        <div className={styles.readOnlyText}>{subscriptionInfo.email}</div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={styles.input}
                                placeholder="Your Name"
                                required
                            />
                        </div>

                        <div className={styles.sectionDivider}></div>

                        <h2 className={styles.cardTitle}>Upcoming Renewal Info</h2>
                        <p className={styles.hint}>Update your payment details for the next manual subscription cycle.</p>

                        <div className={styles.field}>
                            <label className={styles.label}>Preferred Payment Method</label>
                            <select
                                value={formData.lastPaymentMethod}
                                onChange={(e) => setFormData({ ...formData, lastPaymentMethod: e.target.value })}
                                className={styles.input}
                            >
                                <option value="">Select a method</option>
                                {PAYMENT_METHODS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Transaction ID</label>
                            <input
                                type="text"
                                value={formData.lastPaymentTransactionId}
                                onChange={(e) => setFormData({ ...formData, lastPaymentTransactionId: e.target.value })}
                                className={styles.input}
                                placeholder="enter your transaction ID"
                            />
                        </div>

                        {message.text && (
                            <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
                                {message.text}
                            </div>
                        )}

                        <button type="submit" disabled={saving} className={styles.saveBtn}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Subscription Status Section */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Subscription Details</h2>
                    <div className={styles.statusBox}>
                        <div className={styles.statusRow}>
                            <span className={styles.label}>Status:</span>
                            <span className={`${styles.statusBadge} ${subscriptionInfo.status === 'ACTIVE' ? styles.active : styles.inactive}`}>
                                {subscriptionInfo.status}
                            </span>
                        </div>
                        <div className={styles.statusRow}>
                            <span className={styles.label}>Expires At:</span>
                            <span className={styles.value}>{formatDate(subscriptionInfo.expiresAt)}</span>
                        </div>
                    </div>

                    <div className={styles.infoBox}>
                        <p>Your subscription is handled manually. To renew, please head to the renewal page or contact support.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
