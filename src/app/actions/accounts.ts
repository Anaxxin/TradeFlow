'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function createAccount(
    name: string,
    type: string,
    initialBalance: number,
    maxDailyLoss?: number | null,
    maxDrawdown?: number | null,
    isTrailingDrawdown?: boolean
) {
    try {
        const session = await auth();
        console.log("CreateAccount Session:", JSON.stringify(session, null, 2));

        if (!session?.user?.id) {
            console.error("CreateAccount: Unauthorized - No User ID");
            return { success: false, error: 'Unauthorized' };
        }

        const account = await prisma.account.create({
            data: {
                userId: session.user.id,
                name,
                type,
                initial_balance: initialBalance,
                max_daily_loss: maxDailyLoss,
                max_drawdown: maxDrawdown,
                is_trailing_drawdown: isTrailingDrawdown ?? false,
            },
        });

        console.log("CreateAccount: Success", account.id);
        revalidatePath('/'); // Refresh dashboard data
        return { success: true, data: account };
    } catch (error) {
        console.error('Failed to create account:', error);
        return { success: false, error: 'Failed to create account' };
    }
}

export async function getAccounts() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const accounts = await prisma.account.findMany({
            where: { userId: session.user.id },
            orderBy: { created_at: 'desc' },
        });
        return { success: true, data: accounts };
    } catch (error) {
        console.error('Failed to fetch accounts:', error);
        return { success: false, error: 'Failed to fetch accounts' };
    }
}

export async function updateAccount(
    id: string,
    name: string,
    type?: string,
    maxDailyLoss?: number | null,
    maxDrawdown?: number | null,
    isTrailingDrawdown?: boolean
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify ownership
        const existingAccount = await prisma.account.findUnique({
            where: { id },
        });

        if (!existingAccount || existingAccount.userId !== session.user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const updateData: any = {
            name,
            max_daily_loss: maxDailyLoss,
            max_drawdown: maxDrawdown,
            is_trailing_drawdown: isTrailingDrawdown ?? false,
        };

        if (type) {
            updateData.type = type;
        }

        const account = await prisma.account.update({
            where: { id },
            data: updateData,
        });

        revalidatePath('/');
        return { success: true, data: account };
    } catch (error) {
        console.error('Failed to update account:', error);
        return { success: false, error: 'Failed to update account' };
    }
}

export async function deleteAccount(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify ownership (Prisma deleteMany with where matches both ID and userId is safer/easier)
        const result = await prisma.account.deleteMany({
            where: {
                id,
                userId: session.user.id
            },
        });

        if (result.count === 0) {
            return { success: false, error: 'Account not found or unauthorized' };
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete account:', error);
        return { success: false, error: 'Failed to delete account' };
    }
}
