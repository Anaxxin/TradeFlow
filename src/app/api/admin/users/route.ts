import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hash } from 'bcryptjs';
import { auth } from '@/auth';

// Create a new user (Admin Only)
export async function POST(req: Request) {
    try {
        const session = await auth();

        // Security Check: Must be authenticated and be an ADMIN
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check availability
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await hash(password, 12);

        // Admin-created users are ACTIVE by default (since you manually adding them implies payment)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'USER',
                subscriptionStatus: 'ACTIVE'
            }
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Admin Create User Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Update User Status (Admin Only) -> e.g. Activate a user
export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId, status, duration } = await req.json(); // status expects 'ACTIVE' or 'INACTIVE', duration is optional

        let subscriptionExpiresAt = null;

        if (status === 'ACTIVE' && duration) {
            const now = new Date();
            switch (duration) {
                case '2_days':
                    subscriptionExpiresAt = new Date(now.setDate(now.getDate() + 2));
                    break;
                case '1_week':
                    subscriptionExpiresAt = new Date(now.setDate(now.getDate() + 7));
                    break;
                case '1_month':
                    subscriptionExpiresAt = new Date(now.setMonth(now.getMonth() + 1));
                    break;
                case '2_months':
                    subscriptionExpiresAt = new Date(now.setMonth(now.getMonth() + 2));
                    break;
                case '3_months':
                    subscriptionExpiresAt = new Date(now.setMonth(now.getMonth() + 3));
                    break;
                case '4_months':
                    subscriptionExpiresAt = new Date(now.setMonth(now.getMonth() + 4));
                    break;
                case 'permanent':
                    subscriptionExpiresAt = null; // No expiry
                    break;
                default:
                    subscriptionExpiresAt = null;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: status,
                subscriptionExpiresAt: subscriptionExpiresAt
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Admin Update User Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Get all users (for the list)
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                subscriptionStatus: true,
                subscriptionExpiresAt: true,
                created_at: true
            }
        });

        return NextResponse.json({ users });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
