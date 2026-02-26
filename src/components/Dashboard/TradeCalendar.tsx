'use client';

import React from 'react';
import styles from './TradeCalendar.module.css';
import DayNoteModal from './DayNoteModal';

interface CalendarDay {
    date: string;
    pnl: number;
    tradeCount: number;
}

interface TradeCalendarProps {
    data: CalendarDay[];
    accountId?: string;
}

const TradeCalendar: React.FC<TradeCalendarProps> = ({ data, accountId }) => {
    const [viewDate, setViewDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalContent, setModalContent] = React.useState('');
    const [modalTrades, setModalTrades] = React.useState<any[]>([]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const monthName = viewDate.toLocaleString('default', { month: 'long' });

    const nextMonth = () => {
        setViewDate(new Date(year, month + 1, 1));
    };

    const prevMonth = () => {
        setViewDate(new Date(year, month - 1, 1));
    };

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

        const dayData = data.find(d => d.date.startsWith(dateStr));

        return {
            day: dayNum,
            pnl: dayData?.pnl,
            tradeCount: dayData?.tradeCount,
            fullDate: dateStr
        };
    });

    const formatCompactNumber = (num: number) => {
        const absNum = Math.abs(num);
        if (absNum < 1000) return Math.round(absNum).toString();
        const truncated = Math.floor((absNum / 1000) * 100) / 100;
        return `${truncated}K`;
    };

    const handleDayClick = async (dateStr: string) => {
        if (!dateStr) return;
        if (!accountId) {
            alert("Please select an account first");
            return;
        }

        setSelectedDate(dateStr);
        setModalContent('');
        setModalTrades([]);
        setIsModalOpen(true);

        try {
            const res = await fetch(`/api/journal?date=${dateStr}&accountId=${accountId}`);
            const data = await res.json();
            if (data.content) setModalContent(data.content);
            if (data.trades) setModalTrades(data.trades);
        } catch (err) {
            console.error('Failed to fetch note', err);
        }
    };

    const handleSaveNote = async (date: string, content: string) => {
        if (!accountId) return;
        try {
            await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, content, accountId }),
            });
        } catch (err) {
            console.error('Failed to save note', err);
        }
    };

    const handleSaveTradeNote = async (tradeId: string, notes: string, images?: string[]) => {
        try {
            await fetch('/api/journal', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId, notes, images }),
            });
        } catch (err) {
            console.error('Failed to save trade note', err);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Calendar</h3>
                <div className={styles.monthNav}>
                    <button onClick={prevMonth} className={styles.navBtn}>&#10229;</button>
                    <span className={styles.monthName}>{monthName} {year}</span>
                    <button onClick={nextMonth} className={styles.navBtn}>&#10230;</button>
                </div>
            </div>
            <div className={styles.grid}>
                {dayLabels.map((label, idx) => (
                    <div key={`header-${idx}`} className={styles.dayLabel}>{label}</div>
                ))}

                {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                    <div key={`spacer-${idx}`} className={styles.spacer}></div>
                ))}

                {days.map((day, idx) => {
                    let boxClass = styles.dayBox;
                    if (day.pnl && day.pnl > 0) boxClass += ` ${styles.win}`;
                    if (day.pnl && day.pnl < 0) boxClass += ` ${styles.loss}`;

                    return (
                        <div
                            key={idx}
                            className={boxClass}
                            onClick={() => handleDayClick(day.fullDate)}
                            style={{ cursor: 'pointer' }}
                        >
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

            {selectedDate && (
                <DayNoteModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    date={selectedDate}
                    initialContent={modalContent}
                    initialTrades={modalTrades}
                    onSave={handleSaveNote}
                    onSaveTradeNote={handleSaveTradeNote}
                />
            )}
        </div>
    );
};

export default TradeCalendar;
