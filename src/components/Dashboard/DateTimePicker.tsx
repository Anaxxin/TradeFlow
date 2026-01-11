import React, { useState, useEffect, useRef } from 'react';
import styles from './DateTimePicker.module.css';
import DatePicker from './DatePicker';

interface DateTimePickerProps {
    value: string; // ISO string 2026-01-10T21:29
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, label, required }) => {
    // Expected incoming value format: YYYY-MM-DDTHH:mm

    const [datePart, setDatePart] = useState(''); // DD/MM/YYYY
    const [timePart, setTimePart] = useState(''); // HH:mm
    const [showDatePicker, setShowDatePicker] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const datePickerWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!value) return;
        const [d, t] = value.split('T');
        if (d && t) {
            const [y, m, day] = d.split('-');
            setDatePart(`${day}/${m}/${y}`);
            setTimePart(t.slice(0, 5));
        }
    }, [value]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 8) val = val.slice(0, 8);

        let formatted = val;
        if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
        if (val.length > 4) formatted = formatted.slice(0, 5) + '/' + val.slice(4);

        setDatePart(formatted);

        if (val.length === 8) {
            const day = val.slice(0, 2);
            const month = val.slice(2, 4);
            const year = val.slice(4, 8);
            const isoDate = `${year}-${month}-${day}`;
            if (timePart.length === 5) {
                onChange(`${isoDate}T${timePart}`);
            }
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTimePart(e.target.value);
        const [day, m, y] = datePart.split('/');
        if (day && m && y && y.length === 4) {
            const isoDate = `${y}-${m}-${day}`;
            onChange(`${isoDate}T${e.target.value}`);
        }
    };

    const handleDatePickerSelect = (dateStr: string) => {
        // dateStr is in format YYYY-MM-DD
        const [y, m, day] = dateStr.split('-');
        setDatePart(`${day}/${m}/${y}`);
        if (timePart.length === 5) {
            onChange(`${dateStr}T${timePart}`);
        } else if (value) {
            // Keep existing time if no time is set
            const [existingDate, existingTime] = value.split('T');
            if (existingTime) {
                onChange(`${dateStr}T${existingTime}`);
            } else {
                onChange(`${dateStr}T00:00`);
            }
        }
    };

    const getCurrentDateStr = () => {
        if (!value) {
            // Return today's date if no value
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        const [dateStr] = value.split('T');
        return dateStr;
    };

    // Close calendar when clicking outside
    useEffect(() => {
        if (!showDatePicker) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                datePickerWrapperRef.current &&
                !datePickerWrapperRef.current.contains(target) &&
                dateInputRef.current &&
                !dateInputRef.current.parentElement?.contains(target)
            ) {
                setShowDatePicker(false);
            }
        };

        // Use setTimeout to avoid immediate closure
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDatePicker]);

    return (
        <div className={styles.container}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.inputWrapper}>
                <div className={styles.dateInputWrapper}>
                    <input
                        ref={dateInputRef}
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={datePart}
                        onChange={handleDateChange}
                        className={styles.dateInput}
                        required={required}
                        maxLength={10}
                    />
                    <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={styles.calendarIconBtn}
                        title="Select date"
                    >
                        📅
                    </button>
                    {showDatePicker && (
                        <div ref={datePickerWrapperRef} className={styles.datePickerContainer}>
                            <DatePicker
                                value={getCurrentDateStr()}
                                onChange={handleDatePickerSelect}
                                onClose={() => setShowDatePicker(false)}
                            />
                        </div>
                    )}
                </div>
                <input
                    type="time"
                    value={timePart}
                    onChange={handleTimeChange}
                    className={styles.timeInput}
                    required={required}
                />
            </div>
            <span className={styles.hint}>Format: DD/MM/YYYY</span>
        </div>
    );
};

export default DateTimePicker;
