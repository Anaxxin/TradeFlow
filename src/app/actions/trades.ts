'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

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

export async function getDashboardData(accountId?: string) {
    try {
        const where = accountId ? { account_id: accountId } : {};

        const trades = await prisma.trade.findMany({
            where,
            orderBy: { exit_time: 'desc' }
        });

        // Calculate KPIs
        const totalTrades = trades.length;
        const totalPnL = trades.reduce((sum: number, t: any) => sum + t.pnl, 0);

        // Exclude BE trades from win rate calculation
        const tradesForWinRate = trades.filter((t: any) => !t.is_be);

        const wins = tradesForWinRate.filter((t: any) => t.pnl > 0);
        const losses = tradesForWinRate.filter((t: any) => t.pnl <= 0);
        const winRate = tradesForWinRate.length > 0 ? wins.length / tradesForWinRate.length : 0;

        const grossWin = wins.reduce((sum: number, t: any) => sum + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((sum: number, t: any) => sum + t.pnl, 0));

        const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
        const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

        // Better Avg RR calculation: average of individual trade RRs (exclude BE trades)
        const tradesWithRisk = trades.filter((t: any) => {
            const risk = Math.abs(t.entry_price - (t.stop_loss || t.entry_price));
            return risk > 0 && !t.is_be;
        });

        const avgRR = tradesWithRisk.length > 0
            ? tradesWithRisk.reduce((sum: number, t: any) => {
                const risk = Math.abs(t.entry_price - (t.stop_loss || t.entry_price));
                const reward = t.direction === 'LONG' ? (t.exit_price - t.entry_price) : (t.entry_price - t.exit_price);
                return sum + (reward / risk);
            }, 0) / tradesWithRisk.length
            : 0;

        // Period Stats (Monthly/Yearly)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyTrades = trades.filter((t: any) => {
            const d = new Date(t.exit_time);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const monthlyPnL = monthlyTrades.reduce((sum: number, t: any) => sum + t.pnl, 0);
        const monthlyTradesCount = monthlyTrades.length;

        const yearlyTrades = trades.filter((t: any) => {
            const d = new Date(t.exit_time);
            return d.getFullYear() === currentYear;
        });
        const yearlyPnL = yearlyTrades.reduce((sum: number, t: any) => sum + t.pnl, 0);
        const yearlyTradesCount = yearlyTrades.length;

        // Daily Stats (Today)
        const currentDate = now.getDate();
        const dailyTrades = trades.filter((t: any) => {
            const d = new Date(t.exit_time);
            return d.getDate() === currentDate && 
                   d.getMonth() === currentMonth && 
                   d.getFullYear() === currentYear;
        });
        const dailyPnL = dailyTrades.reduce((sum: number, t: any) => sum + t.pnl, 0);
        const dailyTradesCount = dailyTrades.length;

        // Peak and Valley PnL (for Max/Min Balance)
        let runningPnl = 0;
        let maxPnL = 0;
        let minPnL = 0;

        // Iterate chronologically (oldest to newest)
        [...trades].reverse().forEach((t: any) => {
            runningPnl += t.pnl;
            if (runningPnl > maxPnL) maxPnL = runningPnl;
            if (runningPnl < minPnL) minPnL = runningPnl;
        });

        // Chart Data (Cumulative PnL)
        const pnlByDate: Record<string, number> = {};
        // Reverse for chart (oldest to newest)
        [...trades].reverse().forEach((t: any) => {
            // Use local date to avoid timezone shift issues
            const d = new Date(t.exit_time);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            pnlByDate[dateStr] = (pnlByDate[dateStr] || 0) + t.pnl;
        });

        // Calendar Data
        const calendarData = Object.keys(pnlByDate).map(date => {
            const [y, m, day] = date.split('-');
            const tradeCount = trades.filter((t: any) => {
                const d = new Date(t.exit_time);
                return d.getFullYear() === parseInt(y) &&
                    (d.getMonth() + 1) === parseInt(m) &&
                    d.getDate() === parseInt(day);
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
                trades: trades.slice(0, 50), // Send only 50 to frontend list
                kpis: {
                    totalPnL,
                    winRate,
                    avgRR,
                    avgWin,
                    avgLoss,
                    totalTrades,
                    dailyPnL,
                    dailyTradesCount,
                    monthlyPnL,
                    monthlyTradesCount,
                    yearlyPnL,
                    yearlyTradesCount,
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
