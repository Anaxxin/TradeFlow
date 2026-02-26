'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

// Type definitions to fix lint errors
// Interface for local calculations if needed
interface TradeWithPnL {
    id: string;
    pnl: number;
    exit_time: Date;
    [key: string]: any;
}

export async function logTrade(data: {
    accountId: string;
    symbol: string;
    direction: string;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    entryTime: Date;
    exitTime: Date;
    commission: number;
    fees: number;
    stopLoss: number;
    isBE?: boolean;
}) {
    try {
        // Calculate P&L
        // Futures P&L Logic
        // Futures P&L Logic - Check specific symbols first
        const symbolUpper = data.symbol.toUpperCase();
        let multiplier = 1;
        if (symbolUpper.includes('MNQ')) multiplier = 2;
        else if (symbolUpper.includes('MES')) multiplier = 5;
        else if (symbolUpper.includes('NQ')) multiplier = 20;
        else if (symbolUpper.includes('ES')) multiplier = 50;
        else if (symbolUpper.includes('CL')) multiplier = 1000;
        else if (symbolUpper.includes('GC')) multiplier = 100;

        const diff = data.direction === 'LONG'
            ? (data.exitPrice - data.entryPrice)
            : (data.entryPrice - data.exitPrice);

        const grossPnl = diff * data.quantity * multiplier;
        const netPnl = grossPnl - data.commission - data.fees;

        const trade = await prisma.trade.create({
            data: {
                account_id: data.accountId,
                symbol: data.symbol.toUpperCase(),
                direction: data.direction,
                entry_price: data.entryPrice,
                exit_price: data.exitPrice,
                quantity: data.quantity,
                entry_time: data.entryTime,
                exit_time: data.exitTime,
                commission: data.commission,
                fees: data.fees,
                stop_loss: data.stopLoss,
                is_be: data.isBE || false,
                pnl: netPnl,
            } as any,
        });

        revalidatePath('/');
        return { success: true, data: trade };
    } catch (error) {
        console.error('Failed to log trade:', error);
        return { success: false, error: 'Failed to log trade' };
    }
}

export async function updateTrade(id: string, data: {
    symbol: string;
    direction: string;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    entryTime: Date;
    exitTime: Date;
    commission: number;
    fees: number;
    stopLoss: number;
    isBE?: boolean;
}) {
    try {
        // Recalculate P&L
        // Recalculate P&L - Check specific symbols first
        const symbolUpper = data.symbol.toUpperCase();
        let multiplier = 1;
        if (symbolUpper.includes('MNQ')) multiplier = 2;
        else if (symbolUpper.includes('MES')) multiplier = 5;
        else if (symbolUpper.includes('NQ')) multiplier = 20;
        else if (symbolUpper.includes('ES')) multiplier = 50;
        else if (symbolUpper.includes('CL')) multiplier = 1000;
        else if (symbolUpper.includes('GC')) multiplier = 100;

        const diff = data.direction === 'LONG'
            ? (data.exitPrice - data.entryPrice)
            : (data.entryPrice - data.exitPrice);

        const grossPnl = diff * data.quantity * multiplier;
        const netPnl = grossPnl - data.commission - data.fees;

        const trade = await prisma.trade.update({
            where: { id },
            data: {
                symbol: data.symbol.toUpperCase(),
                direction: data.direction,
                entry_price: data.entryPrice,
                exit_price: data.exitPrice,
                quantity: data.quantity,
                entry_time: data.entryTime,
                exit_time: data.exitTime,
                commission: data.commission,
                fees: data.fees,
                stop_loss: data.stopLoss,
                is_be: data.isBE || false,
                pnl: netPnl,
            } as any,
        });

        revalidatePath('/');
        return { success: true, data: trade };
    } catch (error) {
        console.error('Failed to update trade:', error);
        return { success: false, error: 'Failed to update trade' };
    }
}

export async function deleteTrade(id: string) {
    try {
        await prisma.trade.delete({
            where: { id },
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete trade:', error);
        return { success: false, error: 'Failed to delete trade' };
    }
}

export async function addTradeImage(tradeId: string, imageData: string) {
    try {
        const trade = await prisma.trade.findUnique({
            where: { id: tradeId },
            select: { images: true }
        });

        if (!trade) {
            return { success: false, error: 'Trade not found' };
        }

        const currentImages = trade.images || [];
        const updatedImages = [...currentImages, imageData];

        await prisma.trade.update({
            where: { id: tradeId },
            data: {
                images: updatedImages
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to add trade image:', error);
        return { success: false, error: 'Failed to add trade image' };
    }
}

export async function removeTradeImage(tradeId: string, imageIndex: number) {
    try {
        const trade = await prisma.trade.findUnique({
            where: { id: tradeId },
            select: { images: true }
        });

        if (!trade) {
            return { success: false, error: 'Trade not found' };
        }

        const currentImages = trade.images || [];
        const updatedImages = currentImages.filter((_, idx) => idx !== imageIndex);

        await prisma.trade.update({
            where: { id: tradeId },
            data: {
                images: updatedImages
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to remove trade image:', error);
        return { success: false, error: 'Failed to remove trade image' };
    }
}

export async function updateTradeNotes(tradeId: string, notes: string) {
    try {
        await prisma.trade.update({
            where: { id: tradeId },
            data: { notes }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to update trade notes:', error);
        return { success: false, error: 'Failed to update trade notes' };
    }
}




function calculateKPIs(trades: any[]) {
    const totalTrades = trades.length;
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

    const tradesForWinRate = trades.filter((t) => !t.is_be);
    const wins = tradesForWinRate.filter((t) => t.pnl > 0);
    const losses = tradesForWinRate.filter((t) => t.pnl <= 0);
    const winRate = tradesForWinRate.length > 0 ? wins.length / tradesForWinRate.length : 0;

    const grossWin = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

    const tradesWithRisk = trades.filter((t) => {
        const risk = Math.abs(t.entry_price - (t.stop_loss || t.entry_price));
        return risk > 0 && !t.is_be;
    });

    const avgRR = tradesWithRisk.length > 0
        ? tradesWithRisk.reduce((sum, t) => {
            const risk = Math.abs(t.entry_price - (t.stop_loss || t.entry_price));
            const reward = t.direction === 'LONG' ? (t.exit_price - t.entry_price) : (t.entry_price - t.exit_price);
            return sum + (reward / risk);
        }, 0) / tradesWithRisk.length
        : 0;

    return {
        totalPnL,
        winRate,
        avgRR,
        avgWin,
        avgLoss,
        totalTrades
    };
}

export async function getDashboardData(accountId?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        if (!accountId) {
            return {
                success: true,
                data: {
                    trades: [],
                    stats: {
                        daily: calculateKPIs([]),
                        weekly: calculateKPIs([]),
                        monthly: calculateKPIs([]),
                        yearly: calculateKPIs([]),
                        allTime: calculateKPIs([])
                    },
                    chartData: [],
                    calendarData: []
                }
            };
        }

        const account = await prisma.account.findUnique({
            where: { id: accountId },
        });

        if (!account || account.userId !== session.user.id) {
            return { success: false, error: 'Unauthorized Account Access' };
        }

        const trades = await prisma.trade.findMany({
            where: { account_id: accountId },
            orderBy: { exit_time: 'desc' }
        });

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday or Sunday depending on preference, user said Sunday? Usually US is Sunday. Let's use Sunday.
        const startOfSunday = new Date(now.setDate(now.getDate() - day));
        startOfSunday.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const dailyTrades = trades.filter(t => new Date(t.exit_time) >= startOfToday);
        const weeklyTrades = trades.filter(t => new Date(t.exit_time) >= startOfSunday);
        const monthlyTrades = trades.filter(t => new Date(t.exit_time) >= startOfMonth);
        const yearlyTrades = trades.filter(t => new Date(t.exit_time) >= startOfYear);

        // Peak and Valley calculations
        let runningPnl = 0;
        let maxPnL = 0;
        let minPnL = 0;
        [...trades].reverse().forEach((t) => {
            runningPnl += t.pnl;
            if (runningPnl > maxPnL) maxPnL = runningPnl;
            if (runningPnl < minPnL) minPnL = runningPnl;
        });

        // Chart Data
        const pnlByDate: Record<string, number> = {};
        [...trades].reverse().forEach((t) => {
            const d = new Date(t.exit_time);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            pnlByDate[dateStr] = (pnlByDate[dateStr] || 0) + t.pnl;
        });

        const calendarData = Object.keys(pnlByDate).map(date => {
            const [y, m, d] = date.split('-').map(Number);
            const tradeCount = trades.filter(t => {
                const et = new Date(t.exit_time);
                return et.getFullYear() === y && (et.getMonth() + 1) === m && et.getDate() === d;
            }).length;
            return { date, pnl: pnlByDate[date], tradeCount };
        });

        const chartData = Object.keys(pnlByDate).sort().map(date => ({
            date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            pnl: pnlByDate[date]
        }));

        return {
            success: true,
            data: {
                trades: trades.slice(0, 50),
                stats: {
                    daily: calculateKPIs(dailyTrades),
                    weekly: calculateKPIs(weeklyTrades),
                    monthly: calculateKPIs(monthlyTrades),
                    yearly: calculateKPIs(yearlyTrades),
                    allTime: calculateKPIs(trades),
                    maxPnL,
                    minPnL
                },
                chartData,
                calendarData
            }
        };
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        return { success: false, error: 'Failed to fetch data' };
    }
}
