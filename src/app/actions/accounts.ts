'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createAccount(
    name: string,
    type: string,
    initialBalance: number,
    maxDailyLoss?: number,
    maxDrawdown?: number,
    isTrailingDrawdown?: boolean
) {
    try {
        const account = await prisma.account.create({
            data: {
                name,
                type,
                initial_balance: initialBalance,
                max_daily_loss: maxDailyLoss,
                max_drawdown: maxDrawdown,
                is_trailing_drawdown: isTrailingDrawdown || false,
            },
        });

        revalidatePath('/'); // Refresh dashboard data
        return { success: true, data: account };
    } catch (error) {
        console.error('Failed to create account:', error);
        return { success: false, error: 'Failed to create account' };
    }
}

export async function getAccounts() {
    try {
        const accounts = await prisma.account.findMany({
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
    maxDailyLoss?: number | null,
    maxDrawdown?: number | null,
    isTrailingDrawdown?: boolean
) {
    try {
        const account = await prisma.account.update({
            where: { id },
            data: {
                name,
                max_daily_loss: maxDailyLoss,
                max_drawdown: maxDrawdown,
                is_trailing_drawdown: isTrailingDrawdown || false,
            },
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
        await prisma.account.delete({
            where: { id },
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete account:', error);
        return { success: false, error: 'Failed to delete account' };
    }
}
