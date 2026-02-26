import React from 'react';
import styles from '../page.module.css';
import KPICards from '../../components/Dashboard/KPICards';
import ProfitChart from '../../components/Dashboard/ProfitChart';
import RecentTrades from '../../components/Dashboard/RecentTrades';
import TradeCalendar from '../../components/Dashboard/TradeCalendar';
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

  const data = dashboardRes.success && dashboardRes.data ? dashboardRes.data : {
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

  return (
    <main className={styles.main}>
      <DashboardClient
        initialAccounts={accounts || []}
        totalPnL={data.stats.allTime.totalPnL}
        dailyPnL={data.stats.daily.totalPnL || 0}
        maxPnL={data.stats.maxPnL || 0}
        minPnL={data.stats.minPnL || 0}
      >
        <div className={styles.content}>
          <KPICards stats={data.stats} />

          <div className={styles.midSection}>
            <div className={styles.chartArea}>
              <ProfitChart data={data.chartData} />
            </div>
            <div className={styles.calendarArea}>
              <TradeCalendar data={data.calendarData} accountId={effectiveAccountId} />
            </div>
          </div>

          <RecentTrades trades={data.trades.map((t: any) => ({
            id: t.id,
            symbol: t.symbol,
            direction: t.direction,
            entryPrice: t.entry_price,
            exitPrice: t.exit_price,
            quantity: t.quantity,
            pnl: t.pnl,
            date: t.exit_time.toISOString(),
            entryTime: t.entry_time.toISOString(),
            exitTime: t.exit_time.toISOString(),
            commission: t.commission,
            fees: t.fees,
            stopLoss: t.stop_loss,
            is_be: t.is_be,
            images: t.images,
            notes: t.notes
          }))} />

        </div>
      </DashboardClient>
    </main>
  );
}
