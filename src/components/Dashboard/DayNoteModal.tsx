'use client';

import { useState, useEffect } from 'react';
import styles from './DayNoteModal.module.css';
import TradeDetailsModal from './TradeDetailsModal';


// Mock types - in real app, import from Prisma or shared types
interface Trade {
    id: string;
    symbol: string;
    direction: string;
    entry_price: number;
    exit_price: number;
    pnl: number;
    quantity: number;
    notes?: string;
    images?: string[];
    is_be?: boolean;
    stop_loss?: number;
}

interface DayNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string; // YYYY-MM-DD
    initialContent?: string;
    initialTrades?: Trade[];
    onSave: (date: string, content: string) => Promise<void>;
    // New prop for saving trade notes
    onSaveTradeNote: (tradeId: string, notes: string, images?: string[]) => Promise<void>;
}

export default function DayNoteModal({

    isOpen,
    onClose,
    date,
    initialContent = '',
    initialTrades = [],
    onSave,
    onSaveTradeNote
}: DayNoteModalProps) {
    const [content, setContent] = useState(initialContent);
    const [trades, setTrades] = useState<Trade[]>(initialTrades);
    const [attachmentsTrade, setAttachmentsTrade] = useState<Trade | null>(null);
    const [fullImage, setFullImage] = useState<string | null>(null);



    // Update internal state when props change
    useEffect(() => {
        setContent(initialContent);
        setTrades(initialTrades);
    }, [initialContent, initialTrades, isOpen]);

    // Calculate Stats
    const dailyTradesCount = trades.length;
    const dailyPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
    const winners = trades.filter(t => t.pnl > 0).length;
    const winRate = dailyTradesCount > 0 ? Math.round((winners / dailyTradesCount) * 100) : 0;


    const handleTradeUpdate = (tradeId: string, notes: string, images: string[]) => {
        setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, notes, images } : t));
    };

    if (!isOpen) return null;


    // Date Formatting for Header: "Mon Jun 1"
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = dateObj.getDate();

    const circleDasharray = `${winRate}, 100`;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header Section */}
                <div className={styles.header}>

                    {/* Top Left: Stats */}
                    <div className={styles.statsContainer}>
                        <span className={styles.tradeCount}>{dailyTradesCount} Trades</span>
                        <span className={`${styles.pnl} ${dailyPnL >= 0 ? styles.profit : styles.loss}`}>
                            ${dailyPnL.toLocaleString()}
                        </span>
                    </div>

                    {/* Center: Date */}
                    <div className={styles.dateContainer}>
                        <div className={styles.month}>{dayName} {monthName}</div>
                        <div className={styles.dayNumber}>{dayNum}</div>
                    </div>

                    {/* Top Right: Win % Widget */}
                    <div className={styles.winRateContainer}>
                        <svg viewBox="0 0 36 36" className={styles.circularChart}>
                            <path
                                className={styles.circleBg}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className={styles.circleProgress}
                                strokeDasharray={circleDasharray}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                style={{ stroke: winRate >= 50 ? '#22d3ee' : '#4b5563' }}
                            />
                        </svg>
                        <div className={styles.winRateTextContainer}>
                            <span className={styles.winRateValue}>{winRate}%</span>
                            <span className={styles.winRateLabel}>Win %</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className={styles.content}>

                    {/* List of Trades */}
                    {trades.map((trade, idx) => (
                        <div key={trade.id} className={styles.tradeItem}>
                            <div className={styles.tradeHeader}>
                                <div className={styles.dot}></div>
                                <h4 className={styles.tradeTitle}>Trade {idx + 1}: {trade.symbol} {trade.direction}</h4>

                                {/* Trade Details: P&L and RR */}
                                <div className={styles.tradeDetails}>
                                    <span className={`${styles.tradePnL} ${trade.is_be ? styles.be : trade.pnl > 0 ? styles.profit : styles.loss}`}>
                                        ${trade.pnl.toLocaleString()}
                                    </span>
                                    {(() => {
                                        const risk = Math.abs(trade.entry_price - (trade.stop_loss || trade.entry_price));
                                        if (risk > 0) {
                                            const reward = trade.direction === 'LONG' ? (trade.exit_price - trade.entry_price) : (trade.entry_price - trade.exit_price);
                                            const rr = (reward / risk).toFixed(2);
                                            return (
                                                <span className={`${styles.tradeRR} ${trade.is_be ? styles.be : trade.pnl > 0 ? styles.profit : styles.loss}`}>
                                                    {rr}R
                                                </span>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                {/* Notes & Details Icon */}
                                <button
                                    onClick={() => setAttachmentsTrade(trade)}
                                    className={styles.folderBtn}
                                    title="Trade Details & Notes"
                                >
                                    📝
                                </button>

                            </div>

                            {/* Image Previews */}
                            {trade.images && trade.images.length > 0 && (
                                <div className={styles.imagePreview}>
                                    {trade.images.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img}
                                            alt="Trade Screenshot"
                                            className={styles.tradeImage}
                                            onClick={() => setFullImage(img)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    ))}
                                </div>
                            )}


                            <div className={styles.notesContainer}>
                                {trade.notes ? (
                                    <p className={styles.tradeNoteText}>{trade.notes}</p>
                                ) : (
                                    <p className={styles.addNotesCTA}>
                                        Click the notes icon on the right to add notes for this trade
                                    </p>
                                )}
                            </div>


                        </div>
                    ))}

                    {trades.length === 0 && (
                        <div className={styles.emptyState}>
                            No trades taken on this day.
                        </div>
                    )}
                </div>

                {attachmentsTrade && (
                    <TradeDetailsModal
                        trade={{
                            ...attachmentsTrade,
                            entryPrice: attachmentsTrade.entry_price,
                            exitPrice: attachmentsTrade.exit_price,
                            stopLoss: attachmentsTrade.stop_loss
                        } as any}
                        onClose={() => {
                            setAttachmentsTrade(null);
                        }}
                        onUpdate={(notes, images) => handleTradeUpdate(attachmentsTrade.id, notes, images)}
                    />
                )}

                {/* Lightbox Overlay */}
                {fullImage && (
                    <div className={styles.lightbox} onClick={() => setFullImage(null)}>
                        <img src={fullImage} alt="Full view" className={styles.fullImage} />
                    </div>
                )}


            </div>
        </div>

    );
}
