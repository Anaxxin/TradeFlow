import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/db';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                subscriptionStatus: true,
                subscriptionExpiresAt: true,
                lastPaymentMethod: true,
                lastPaymentTransactionId: true,
            }
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, lastPaymentMethod, lastPaymentTransactionId } = body;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                lastPaymentMethod,
                lastPaymentTransactionId,
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}
