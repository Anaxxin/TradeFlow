"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './TradeDetailsModal.module.css';
import { addTradeImage, removeTradeImage, updateTradeNotes } from '@/app/actions/trades';

interface Trade {
    id: string;
    symbol: string;
    direction: string;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    quantity: number;
    notes?: string;
    images?: string[];
    is_be?: boolean;
    stopLoss?: number;
}

interface TradeDetailsModalProps {
    trade: Trade;
    onClose: () => void;
    onUpdate?: (notes: string, images: string[]) => void;
}

const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
    trade,
    onClose,
    onUpdate
}) => {

    const [images, setImages] = useState<string[]>(trade.images || []);
    const [notes, setNotes] = useState(trade.notes || '');
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fullImage, setFullImage] = useState<string | null>(null);
    const [imageToDeleteIndex, setImageToDeleteIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate RR
    const risk = Math.abs(trade.entryPrice - (trade.stopLoss || trade.entryPrice));
    const reward = trade.direction === 'LONG' ? (trade.exitPrice - trade.entryPrice) : (trade.entryPrice - trade.exitPrice);
    const rr = risk > 0 ? (reward / risk).toFixed(2) : "0.00";


    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                const res = await addTradeImage(trade.id, base64String);
                if (res.success) {
                    const newImages = [...images, base64String];
                    setImages(newImages);
                    onUpdate?.(notes, newImages);
                } else {
                    alert('Failed to save image.');
                }
                setLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Upload error:', error);
            setLoading(false);
        }
    };

    const handleRemoveImage = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setImageToDeleteIndex(index);
    };

    const confirmDeleteImage = async () => {
        if (imageToDeleteIndex === null) return;
        try {
            const res = await removeTradeImage(trade.id, imageToDeleteIndex);
            if (res.success) {
                const newImages = images.filter((_, i) => i !== imageToDeleteIndex);
                setImages(newImages);
                onUpdate?.(notes, newImages);
            } else {
                alert('Failed to delete image.');
            }
        } catch (error) {
            console.error('Remove error:', error);
        } finally {
            setImageToDeleteIndex(null);
        }
    };

    // Debounced autosave for notes
    useEffect(() => {
        if (notes === trade.notes) return;

        const timer = setTimeout(async () => {
            const res = await updateTradeNotes(trade.id, notes);
            if (res.success) {
                onUpdate?.(notes, images);
            } else {
                console.error('Failed to update notes');
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [notes, trade.id, trade.notes, onUpdate, images]);

    const handleDragOver = (e: React.DragEvent) => {

        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFileUpload(files[0]);
        }
    };

    const handleClose = async () => {
        if (notes !== (trade.notes || '')) {
            await updateTradeNotes(trade.id, notes).catch(console.error);
        }
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div className={styles.modal}>
                <button onClick={handleClose} className={styles.closeBtn}>&times;</button>

                {/* Header: Title & Stats */}
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h2 className={styles.title}>{trade.symbol} {trade.direction}</h2>
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Trade ID: {trade.id.slice(0, 8)}...</span>
                    </div>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>PNL</span>
                            <span className={`${styles.statValue} ${trade.is_be ? styles.be : trade.pnl > 0 ? styles.profit : styles.loss}`}>
                                ${trade.pnl.toLocaleString()}
                            </span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>RR</span>
                            <span className={`${styles.statValue} ${trade.is_be ? styles.be : trade.pnl > 0 ? styles.profit : styles.loss}`}>
                                {rr}R
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={styles.content}>
                    {/* Left: Notes */}
                    <div className={styles.leftColumn}>
                        <div className={styles.sectionTitle}>
                            <span>📝</span> NOTES
                        </div>
                        <textarea
                            className={styles.noteInput}
                            placeholder="Add your trade notes here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />

                    </div>

                    {/* Right: Attachments */}
                    <div className={styles.rightColumn}>
                        <div className={styles.sectionTitle} style={{ color: '#475569' }}>
                            <span>🖼️</span> ATTACHMENTS
                        </div>

                        <div className={styles.galleryGrid}>
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={styles.thumbnailContainer}
                                    onClick={() => setFullImage(img)}
                                >
                                    <img src={img} alt={`Trade ${idx}`} className={styles.thumbnail} />
                                    <button
                                        className={styles.removeBtn}
                                        onClick={(e) => handleRemoveImage(e, idx)}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            {images.length === 0 && (
                                <div className={styles.emptyGallery}>No images yet</div>
                            )}
                        </div>

                        {/* Upload Zone */}
                        <div className={styles.uploadSection}>
                            <div
                                className={styles.dropZone}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {loading ? (
                                    <div className={styles.dropText}>UPLOADING...</div>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '1.5rem' }}>📷</span>
                                        <div className={styles.dropText}>
                                            Drag & Drop or Click to Upload
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {fullImage && (
                <div className={styles.lightbox} onClick={() => setFullImage(null)}>
                    <img src={fullImage} alt="Full view" className={styles.fullImage} />
                </div>
            )}

            {/* Confirmation */}
            {imageToDeleteIndex !== null && (
                <div className={styles.confirmOverlay} onClick={() => setImageToDeleteIndex(null)}>
                    <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmTitle}>Are you sure you want to delete this screenshot?</div>
                        <div className={styles.confirmActions}>
                            <button className={styles.confirmDeleteBtn} onClick={confirmDeleteImage}>OK</button>
                            <button className={styles.confirmCancelBtn} onClick={() => setImageToDeleteIndex(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeDetailsModal;
