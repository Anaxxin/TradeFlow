'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PAYMENT_METHODS = [
    { id: 'vodafone', name: 'Vodafone Cash', details: '010XXXXXXXX' },
    { id: 'telda', name: 'Telda', details: '@username' },
    { id: 'instapay', name: 'Instapay', details: 'username@instapay' },
    { id: 'crypto', name: 'Crypto (USDT)', details: 'TRC20: TXXXXXXXXXXXXXXXXXXXXXXXXX' },
];

export default function RenewPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [formData, setFormData] = useState({
        paymentMethod: PAYMENT_METHODS[0].id,
        transactionId: '',
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/renew');
        } else if (status === 'authenticated') {
            // Fetch profile to prefill
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.user) {
                        setFormData({
                            paymentMethod: data.user.lastPaymentMethod || PAYMENT_METHODS[0].id,
                            transactionId: data.user.lastPaymentTransactionId || '',
                        });
                    }
                })
                .catch(err => console.error('Failed to prefill', err));
        }
    }, [status, router]);

    const selectedMethod = PAYMENT_METHODS.find((m) => m.id === formData.paymentMethod);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/payment-renew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: session?.user?.email,
                    name: session?.user?.name,
                    ...formData
                }),
            });

            if (!res.ok) throw new Error('Failed to submit');

            setSubmitted(true);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') return <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center text-white">Loading...</div>;

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] text-white p-4">
                <div className="w-full max-w-md p-8 bg-[#16171c] rounded-lg border border-green-500/30 shadow-xl text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Renewal Requested!</h2>
                    <p className="text-gray-400 mb-6">
                        We've received your renewal payment details. Your account will be updated once we verify your transaction.
                    </p>
                    <Link href="/dashboard" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-all text-white font-bold">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
                        Renew Subscription
                    </h1>
                    <p className="text-xl text-gray-400">Complete your manual payment to restore full access.</p>
                </div>

                <div className="bg-[#16171c] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                    <div className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-base font-semibold text-gray-400 mb-2">User</label>
                                    <div className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg text-gray-300">
                                        {session?.user?.name || 'Loading...'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-400 mb-2">Email</label>
                                    <div className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg text-gray-300">
                                        {session?.user?.email || 'Loading...'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-base font-semibold text-gray-400 mb-4">Select Payment Method</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {PAYMENT_METHODS.map((method) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                                            className={`p-4 rounded-lg border text-base font-medium text-left transition-all ${formData.paymentMethod === method.id
                                                ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                                : 'border-gray-700 bg-[#0d0e12] text-gray-400 hover:border-gray-600'
                                                }`}
                                        >
                                            {method.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-xl">
                                <p className="text-base text-blue-400 font-bold mb-2 uppercase tracking-wide">Payment Instructions</p>
                                <p className="text-gray-300 text-lg">
                                    Please send <strong>$XX.XX</strong> to:
                                </p>
                                <p className="text-2xl font-mono text-white mt-2 select-all break-all">{selectedMethod?.details}</p>
                            </div>

                            <div>
                                <label className="block text-base font-semibold text-gray-400 mb-2">Transaction Ref / ID</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.transactionId}
                                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                                    className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="Paste your transaction ID here"
                                />
                            </div>

                            {error && <p className="text-red-400 text-base text-center font-medium">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Confirm Renewal Payment'}
                            </button>

                            <div className="text-center mt-4">
                                <Link href="/dashboard" className="text-gray-500 hover:text-gray-400 text-sm">
                                    Cancel and return
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
