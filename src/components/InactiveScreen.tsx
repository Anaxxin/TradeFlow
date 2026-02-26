'use client';

import { signOut } from 'next-auth/react';

export default function InactiveScreen() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px', background: '#0d0e12', color: 'white' }}>
            <h1 className="text-3xl font-bold">Account Inactive</h1>
            <p className="text-gray-400 text-center max-w-md">
                Your account is currently inactive.<br />
                Please wait for activation or renew your subscription to continue.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors font-medium"
                >
                    Back to Login
                </button>
                <a
                    href="/renew"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all font-bold"
                    style={{ textDecoration: 'none' }}
                >
                    Renew Subscription
                </a>
            </div>
        </div>
    );
}
