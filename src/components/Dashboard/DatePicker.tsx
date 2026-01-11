"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './DateTimePicker.module.css';

interface DatePickerProps {
    value: string; // ISO date string YYYY-MM-DD
    onChange: (value: string) => void;
    onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }
        }
    }, [value]);


    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleDateClick = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const selectedDate = new Date(year, month, day);
        const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(isoDate);
        onClose();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const selectedDate = value ? new Date(value) : null;
    const selectedDay = selectedDate && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear() 
        ? selectedDate.getDate() 
        : null;

    return (
        <div ref={pickerRef} className={styles.calendarPopup}>
            <div className={styles.calendarHeader}>
                <button type="button" onClick={handlePrevMonth} className={styles.calendarNavBtn}>&lt;</button>
                <div className={styles.calendarMonthYear}>
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <button type="button" onClick={handleNextMonth} className={styles.calendarNavBtn}>&gt;</button>
            </div>
            <div className={styles.calendarGrid}>
                {dayNames.map(day => (
                    <div key={day} className={styles.calendarDayHeader}>{day}</div>
                ))}
                {emptyDays.map((_, idx) => (
                    <div key={`empty-${idx}`} className={styles.calendarDayEmpty}></div>
                ))}
                {days.map(day => (
                    <button
                        key={day}
                        type="button"
                        onClick={() => handleDateClick(day)}
                        className={`${styles.calendarDay} ${selectedDay === day ? styles.calendarDaySelected : ''}`}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DatePicker;
