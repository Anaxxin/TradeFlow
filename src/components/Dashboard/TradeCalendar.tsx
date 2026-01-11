import React from 'react';
import styles from './TradeCalendar.module.css';

interface CalendarDay {
    date: string;
    pnl: number;
    tradeCount: number;
}

interface TradeCalendarProps {
    data: CalendarDay[];
}

const TradeCalendar: React.FC<TradeCalendarProps> = ({ data }) => {
    // Generate actual days for the current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const days = Array.from({ length: daysInMonth }, (_, i) => {
        // Adjust for timezone matching if needed, but simple day check is usually robust enough for local
        // matching based on "YYYY-MM-DD" string prefix check from data
        const dayNum = i + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

        // Find data for this specific date string
        const dayData = data.find(d => d.date.startsWith(dateStr) || new Date(d.date).getDate() === dayNum && new Date(d.date).getMonth() === month);

        return {
            day: dayNum,
            pnl: dayData?.pnl,
            tradeCount: dayData?.tradeCount
        };
    });

    const formatCompactNumber = (num: number) => {
        const absNum = Math.abs(num);
        // Ensure strictly no decimals for numbers under 1000
        if (absNum < 1000) return Math.round(absNum).toString();

        // For thousands (e.g., 1200 -> 1.2K, 3456 -> 3.45K)
        // User requested "round down" (truncate) to 3 sig figs / 2 decimals max
        const thousands = absNum / 1000;

        // Math.floor(3.456 * 100) / 100 -> 3.45
        const truncated = Math.floor(thousands * 100) / 100;

        return `${truncated}K`;
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Calendar</h3>
            <div className={styles.grid}>
                {dayLabels.map((label, idx) => (
                    <div key={`header-${idx}`} className={styles.dayLabel}>{label}</div>
                ))}

                {/* Spacers for alignment */}
                {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                    <div key={`spacer-${idx}`} className={styles.spacer}></div>
                ))}

                {days.map((day, idx) => {
                    let boxClass = styles.dayBox;
                    if (day.pnl && day.pnl > 0) boxClass += ` ${styles.win}`;
                    if (day.pnl && day.pnl < 0) boxClass += ` ${styles.loss}`;

                    return (
                        <div key={idx} className={boxClass}>
                            <span className={styles.dateNum}>{day.day}</span>
                            {day.pnl !== undefined && day.pnl !== null && (
                                <div className={styles.pnl} title={`$${Math.abs(day.pnl).toLocaleString()}`}>
                                    ${formatCompactNumber(day.pnl)}
                                </div>
                            )}
                            {day.tradeCount !== undefined && day.tradeCount > 0 && (
                                <div className={styles.tradeCountBadge}>{day.tradeCount}T</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TradeCalendar;
