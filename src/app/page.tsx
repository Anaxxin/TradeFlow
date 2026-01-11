import React from 'react';
import styles from './page.module.css';
import KPICards from '../components/Dashboard/KPICards';
import ProfitChart from '../components/Dashboard/ProfitChart';
import RecentTrades from '../components/Dashboard/RecentTrades';
import TradeCalendar from '../components/Dashboard/TradeCalendar';
import DashboardClient from '../components/Dashboard/DashboardClient';
import { getAccounts } from './actions/accounts';
import { getDashboardData } from './actions/trades';

export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ accountId?: string }> }) {
  const { accountId } = await searchParams;
  const accountsRes = await getAccounts();
  const accounts = (accountsRes.success && accountsRes.data) ? accountsRes.data : [];

  // Priority: URL Param > First Account
  const effectiveAccountId = accountId || (accounts.length > 0 ? accounts[0].id : undefined);

  const dashboardRes = await getDashboardData(effectiveAccountId);

  const data = dashboardRes.success && dashboardRes.data ? dashboardRes.data : {
    trades: [],
    kpis: {
      totalPnL: 0, winRate: 0, avgRR: 0, avgWin: 0, avgLoss: 0, totalTrades: 0,
      dailyPnL: 0, dailyTradesCount: 0,
      monthlyPnL: 0, monthlyTradesCount: 0, yearlyPnL: 0, yearlyTradesCount: 0,
      maxPnL: 0, minPnL: 0
    },
    chartData: [],
    calendarData: []
  };

  return (
    <main className={styles.main}>
      <DashboardClient
        initialAccounts={accounts || []}
        totalPnL={data.kpis.totalPnL}
        dailyPnL={data.kpis.dailyPnL || 0}
        maxPnL={data.kpis.maxPnL || 0}
        minPnL={data.kpis.minPnL || 0}
      >
        <div className={styles.content}>
          <KPICards
            netPnL={data.kpis.totalPnL}
            winRate={data.kpis.winRate}
            avgRR={data.kpis.avgRR}
            avgWin={data.kpis.avgWin}
            avgLoss={data.kpis.avgLoss}
            totalTrades={data.kpis.totalTrades}
            dailyPnL={data.kpis.dailyPnL || 0}
            dailyTradesCount={data.kpis.dailyTradesCount || 0}
            monthlyPnL={data.kpis.monthlyPnL}
            monthlyTradesCount={data.kpis.monthlyTradesCount}
            yearlyPnL={data.kpis.yearlyPnL}
            yearlyTradesCount={data.kpis.yearlyTradesCount}
          />

          <div className={styles.midSection}>
            <div className={styles.chartArea}>
              <ProfitChart data={data.chartData} />
            </div>
            <div className={styles.calendarArea}>
              <TradeCalendar data={data.calendarData} />
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
            is_be: t.is_be
          }))} />
        </div>
      </DashboardClient>
    </main>
  );
}
