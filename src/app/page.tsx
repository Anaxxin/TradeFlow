import Link from 'next/link';
import { auth } from '@/auth';

export default async function LandingPage() {
    const session = await auth();
    const isLoggedIn = !!session?.user;

    return (
        <div className="min-h-screen bg-[#0d0e12] text-white">
            {/* Navigation */}
            <nav className="flex justify-between items-center w-full" style={{ padding: '2rem 5vw' }}>
                <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
                    TradeFlow
                </div>
                <div>
                    {isLoggedIn ? (
                        <Link
                            href="/dashboard"
                            className="inline-block text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all font-semibold shadow-lg shadow-purple-500/20"
                            style={{ padding: '0.6rem 1.75rem' }}
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <div className="flex gap-4">
                            <Link
                                href="/login"
                                className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/join"
                                className="inline-block text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all font-semibold shadow-lg shadow-purple-500/20"
                                style={{ padding: '0.6rem 1.75rem' }}
                            >
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="text-center pt-32 pb-8 px-4 flex flex-col items-center justify-center">
                <h1 className="text-6xl md:text-8xl font-extrabold mb-8 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent leading-tight tracking-tighter">
                    Master Your Trading <br /> With Precision
                </h1>
                <p className="text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                    The advanced trading journal designed for serious traders. Track, analyze, and improve your performance with institutional-grade tools.
                </p>
                <div className="flex justify-center gap-6" style={{ marginTop: '2rem' }}>
                    <Link
                        href="/join"
                        className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-extrabold text-lg rounded-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-purple-500/30"
                        style={{ padding: '0.875rem 2.5rem' }}
                    >
                        Start Journaling
                    </Link>
                </div>
            </section>

            {/* Features Showcase Section */}
            <section className="w-full flex flex-col items-center py-8 px-4 space-y-24 mt-0 md:mt-4">
                {/* Feature 1: Dashboard */}
                <div className="text-center w-full max-w-5xl flex flex-col items-center">
                    <h2 className="text-5xl font-extrabold tracking-tight text-center" style={{ marginTop: '1.5rem', marginBottom: '2.5rem' }}>Your Command Center</h2>
                    <div className="w-full h-[600px] bg-[#16171c] border border-gray-800 rounded-3xl flex items-center justify-center relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0e12]/80 z-10"></div>
                        <p className="text-gray-500 text-2xl font-mono z-20 text-center w-full">[Main Dashboard Screenshot Placeholder]</p>
                        {/* Ambient Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full"></div>
                    </div>
                </div>

                {/* Feature 2: Calendar & Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center w-full max-w-5xl">
                    <div className="space-y-6">
                        <h3 className="text-5xl font-extrabold tracking-tight">Daily Performance <br />Calendar</h3>
                        <p className="text-gray-400 text-xl leading-relaxed">
                            Visualize your consistency. Click on any day to dive deep into your trades, attach screenshots, and write detailed notes about your psychology and execution.
                        </p>
                    </div>
                    <div className="w-full h-[450px] bg-[#16171c] border border-gray-800 rounded-3xl flex items-center justify-center relative shadow-xl">
                        <p className="text-gray-500 text-xl font-mono">[Calendar & Notes Modal Placeholder]</p>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full"></div>
                    </div>
                </div>

                {/* Feature 3: Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center w-full max-w-5xl">
                    <div className="order-2 lg:order-1 w-full h-[450px] bg-[#16171c] border border-gray-800 rounded-3xl flex items-center justify-center relative shadow-xl">
                        <p className="text-gray-500 text-xl font-mono">[PnL Analytics Chart Placeholder]</p>
                        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full"></div>
                    </div>
                    <div className="order-1 lg:order-2 space-y-6">
                        <h3 className="text-5xl font-extrabold tracking-tight">Detailed <br />Analytics</h3>
                        <p className="text-gray-400 text-xl leading-relaxed">
                            Know your numbers. Track your Win Rate, Average Risk/Reward, and Profit Factor automatically. Stop guessing and start trading with data.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-20 text-center text-gray-500 text-base">
                <p>&copy; {new Date().getFullYear()} TradeFlow. All rights reserved.</p>
            </footer>
        </div>
    );
}
