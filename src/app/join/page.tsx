'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PAYMENT_METHODS = [
    { id: 'vodafone', name: 'Vodafone Cash', details: '010XXXXXXXX' },
    { id: 'telda', name: 'Telda', details: '@username' },
    { id: 'instapay', name: 'Instapay', details: 'username@instapay' },
    { id: 'crypto', name: 'Crypto (USDT)', details: 'TRC20: TXXXXXXXXXXXXXXXXXXXXXXXXX' },
];

export default function JoinPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        paymentMethod: PAYMENT_METHODS[0].id,
        transactionId: '',
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const selectedMethod = PAYMENT_METHODS.find((m) => m.id === formData.paymentMethod);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/payment-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to submit');

            setSubmitted(true);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] text-white p-4">
                <div className="w-full max-w-md p-8 bg-[#16171c] rounded-lg border border-green-500/30 shadow-xl text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
                    <p className="text-gray-400 mb-6">
                        We've received your payment details. You will receive a confirmation email shortly once we verify your transaction.
                    </p>
                    <Link href="/login" className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-white">
                        Return to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl flex flex-col gap-8">
                <div className="text-center flex flex-col gap-6">
                    <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Join TradeFlow
                    </h1>
                    <p className="text-xl text-gray-400">Complete your manual payment to get started.</p>
                </div>

                <div className="bg-[#16171c] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                    <div className="p-10">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="block text-base font-semibold text-gray-400">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="block text-base font-semibold text-gray-400">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="block text-base font-semibold text-gray-400">Create Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                    <p className="text-sm text-gray-500 mt-2 italic">Check your email after a few minutes to see if your account is active.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-base font-semibold text-gray-400">Select Payment Method</label>
                                <div className="relative">
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors appearance-none text-white text-base"
                                    >
                                        {PAYMENT_METHODS.map((method) => (
                                            <option key={method.id} value={method.id} className="bg-[#16171c] text-white">
                                                {method.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-xl">
                                <p className="text-base text-blue-400 font-bold mb-2 uppercase tracking-wide">Payment Instructions</p>
                                <p className="text-gray-300 text-lg">
                                    Please send <strong>$XX.XX</strong> to:
                                </p>
                                <p className="text-2xl font-mono text-white mt-2 select-all break-all">{selectedMethod?.details}</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-base font-semibold text-gray-400">Transaction Ref / ID</label>
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
                                className="w-full py-4 mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Confirm Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
