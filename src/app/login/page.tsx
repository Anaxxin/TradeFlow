'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError('Invalid email or password');
                setLoading(false);
            } else {
                router.push('/dashboard'); // Redirect to dashboard after login
                router.refresh();
            }
        } catch (err) {
            setError('Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] text-white p-6">
            <div className="w-full max-w-xl p-12 bg-[#16171c] rounded-2xl border border-gray-800 shadow-2xl">
                <h2 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Welcome Back
                </h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-base text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                    <div className="flex flex-col gap-2">
                        <label className="block text-base font-semibold text-gray-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="block text-base font-semibold text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-[#0d0e12] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center text-base text-gray-500">
                    Don't have an account?{' '}
                    <Link href="/join" className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-4 hover:underline">
                        Join Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
