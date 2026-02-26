'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'ADMIN') {
                router.push('/'); // Redirect non-admins
            } else {
                fetchUsers();
            }
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, email: newEmail, password: newPassword })
            });

            const data = await res.json();
            if (data.success) {
                alert('User created successfully!');
                setNewName('');
                setNewEmail('');
                setNewPassword('');
                fetchUsers(); // Refresh list
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            alert('Failed to create user');
        } finally {
            setIsCreating(false);
        }
    };

    const toggleStatus = async (userId: string, currentStatus: string, duration?: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        if (newStatus === 'ACTIVE' && !duration) {
            setSelectedUserId(userId);
            setIsDurationModalOpen(true);
            return;
        }

        if (newStatus === 'INACTIVE' && !confirm(`Are you sure you want to set this user to INACTIVE?`)) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status: newStatus, duration })
            });
            if (res.ok) {
                fetchUsers();
                setIsDurationModalOpen(false);
                setSelectedUserId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);

    if (isLoading) return <div className="p-8 text-white">Loading Admin Panel...</div>;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Manual / Never';
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-12">
            <div className="w-full max-w-6xl">
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h1>
                </div>

                {/* Create User Section */}
                <div className="bg-[#16171c] p-8 rounded-2xl mb-12 border border-gray-800 shadow-xl">
                    <h2 className="text-2xl font-bold mb-6">Manual User Creation</h2>
                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-400">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-[#0d0e12] border border-gray-700 rounded-lg p-3 text-base text-white focus:border-blue-500 outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-400">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full bg-[#0d0e12] border border-gray-700 rounded-lg p-3 text-base text-white focus:border-blue-500 outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-400">Initial Password</label>
                                <input
                                    type="text"
                                    placeholder="Initial Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-[#0d0e12] border border-gray-700 rounded-lg p-3 text-base text-white focus:border-blue-500 outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-base font-bold transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
                        >
                            {isCreating ? 'Creating...' : 'Create Active User'}
                        </button>
                    </form>
                </div>

                {/* Users List Section */}
                <div className="bg-[#16171c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0d0e12] border-b border-gray-800">
                                <th className="p-6 text-gray-400 text-sm font-bold uppercase tracking-wider">User</th>
                                <th className="p-6 text-gray-400 text-sm font-bold uppercase tracking-wider">Email</th>
                                <th className="p-6 text-gray-400 text-sm font-bold uppercase tracking-wider">Role</th>
                                <th className="p-6 text-gray-400 text-sm font-bold uppercase tracking-wider">Status</th>
                                <th className="p-6 text-gray-400 text-sm font-bold uppercase tracking-wider">Expires At</th>
                                <th className="p-6 text-gray-400 text-sm font-bold uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6 text-base font-medium">{user.name}</td>
                                    <td className="p-6 text-base text-gray-300">{user.email}</td>
                                    <td className="p-6 text-base">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-6 text-base">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.subscriptionStatus === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {user.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="p-6 text-base text-gray-300">
                                        {user.subscriptionStatus === 'ACTIVE' ? formatDate(user.subscriptionExpiresAt) : '-'}
                                    </td>
                                    <td className="p-6 text-base">
                                        {user.role !== 'ADMIN' && (
                                            <button
                                                onClick={() => toggleStatus(user.id, user.subscriptionStatus)}
                                                className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-all"
                                            >
                                                {user.subscriptionStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && <div className="p-12 text-center text-gray-500 text-lg">No users found.</div>}
                </div>
            </div>

            {/* Duration Modal */}
            {isDurationModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#16171c] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6">Select Activation Duration</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: '2_days', label: '2 Days' },
                                { id: '1_week', label: '1 Week' },
                                { id: '1_month', label: '1 Month' },
                                { id: '2_months', label: '2 Months' },
                                { id: '3_months', label: '3 Months' },
                                { id: '4_months', label: '4 Months' },
                                { id: 'permanent', label: 'Until manual deactivation' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => selectedUserId && toggleStatus(selectedUserId, 'INACTIVE', opt.id)}
                                    className="w-full text-left p-4 bg-[#0d0e12] border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all font-medium"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setIsDurationModalOpen(false);
                                setSelectedUserId(null);
                            }}
                            className="mt-6 w-full py-3 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
