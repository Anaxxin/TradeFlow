import React from 'react';
import styles from '../page.module.css';
import DashboardClient from '../../components/Dashboard/DashboardClient';
import { getAccounts } from '../actions/accounts';
import { getDashboardData } from '../actions/trades';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import InactiveScreen from '../../components/InactiveScreen';

export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ accountId?: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Check Subscription Status
  const user = session.user as any;
  if (user.subscriptionStatus === 'INACTIVE') {
    return (
      <main className={styles.main}>
        <InactiveScreen />
      </main>
    );
  }

  const { accountId } = await searchParams;
  const accountsRes = await getAccounts();
  const accounts = (accountsRes.success && accountsRes.data) ? accountsRes.data : [];

  // Priority: URL Param > First Account
  const effectiveAccountId = accountId || (accounts.length > 0 ? accounts[0].id : undefined);

  const dashboardRes = await getDashboardData(effectiveAccountId);

  const rawData = dashboardRes.success && dashboardRes.data ? dashboardRes.data : {
    trades: [],
    stats: {
      daily: { totalPnL: 0, winRate: 0, avgRR: 0, avgWin: 0, avgLoss: 0, totalTrades: 0 },
      weekly: { totalPnL: 0, winRate: 0, avgRR: 0, avgWin: 0, avgLoss: 0, totalTrades: 0 },
      monthly: { totalPnL: 0, winRate: 0, avgRR: 0, avgWin: 0, avgLoss: 0, totalTrades: 0 },
      yearly: { totalPnL: 0, winRate: 0, avgRR: 0, avgWin: 0, avgLoss: 0, totalTrades: 0 },
      allTime: { totalPnL: 0, winRate: 0, avgRR: 0, avgWin: 0, avgLoss: 0, totalTrades: 0 },
      maxPnL: 0,
      minPnL: 0
    },
    chartData: [],
    calendarData: []
  };

  const initialData = {
    trades: rawData.trades.map((t: any) => ({
      id: t.id,
      symbol: t.symbol,
      direction: t.direction,
      entryPrice: t.entry_price,
      exitPrice: t.exit_price,
      quantity: t.quantity,
      pnl: t.pnl,
      date: typeof t.exit_time === 'string' ? t.exit_time : (t.exit_time instanceof Date ? t.exit_time.toISOString() : new Date(t.exit_time).toISOString()),
      entryTime: typeof t.entry_time === 'string' ? t.entry_time : (t.entry_time instanceof Date ? t.entry_time.toISOString() : new Date(t.entry_time).toISOString()),
      exitTime: typeof t.exit_time === 'string' ? t.exit_time : (t.exit_time instanceof Date ? t.exit_time.toISOString() : new Date(t.exit_time).toISOString()),
      commission: t.commission,
      fees: t.fees,
      stopLoss: t.stop_loss,
      is_be: t.is_be,
      images: t.images,
      notes: t.notes
    })),
    stats: rawData.stats,
    chartData: rawData.chartData,
    calendarData: rawData.calendarData
  };

  return (
    <main className={styles.main}>
      <DashboardClient
        initialAccounts={accounts || []}
        initialData={initialData}
        initialAccountId={effectiveAccountId}
      />
    </main>
  );
}
