"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui";
import { COLORS, zIndex } from "@/lib/design-tokens";

const CALENDAR_GAP = 4;

const MONTHS = "January,February,March,April,May,June,July,August,September,October,November,December".split(",");
const WEEKDAYS = "Su,Mo,Tu,We,Th,Fr,Sa".split(",");

function getDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days: (number | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  while (days.length < 42) days.push(null);
  return days;
}

function toYYYYMMDD(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export interface DatePickerFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DatePickerField({ id, value, onChange, placeholder = "Select date", className = "", style = {} }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const display = value ? (() => {
    const [y, m, d] = value.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  })() : "";

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + CALENDAR_GAP,
      left: rect.left,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (calendarRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const days = getDays(year, month);

  function prevMonth() {
    setView((v) => new Date(v.getFullYear(), v.getMonth() - 1));
  }
  function nextMonth() {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + 1));
  }
  function selectDay(day: number) {
    onChange(toYYYYMMDD(year, month, day));
    setOpen(false);
  }

  const calendarDropdown =
    open &&
    dropdownPosition &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={calendarRef}
        className="fixed w-64 rounded-lg border bg-white shadow-lg p-3"
        style={{
          borderColor: COLORS.CARD_BORDER,
          zIndex: zIndex.popover,
          top: dropdownPosition.top,
          left: dropdownPosition.left,
        }}
        role="dialog"
        aria-label="Choose date"
      >
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 text-gray-600">‹</button>
          <span className="text-sm font-medium" style={{ color: COLORS.TEXT_TITLE }}>{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 text-gray-600">›</button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs" style={{ color: COLORS.TEXT_MUTED }}>
          {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mt-1">
          {days.map((d, i) => {
            if (d === null) return <span key={i} />;
            const isSelected = value === toYYYYMMDD(year, month, d);
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(d)}
                className="h-8 w-8 rounded-full text-sm hover:bg-gray-100"
                style={{
                  color: COLORS.TEXT_BODY,
                  ...(isSelected ? { backgroundColor: COLORS.BRAND, color: COLORS.WHITE } : {}),
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <div ref={wrapRef} className="relative">
        <div className="relative flex items-center">
          <Calendar className="absolute left-3 h-4 w-4 pointer-events-none" style={{ color: COLORS.BRAND }} />
          <Input
            id={id}
            readOnly
            value={display}
            placeholder={placeholder}
            onClick={() => setOpen((o) => !o)}
            className={`h-11 rounded-lg w-full pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${className} outline-none focus:ring-0 focus:ring-offset-0 `}
            // style={{ ...style, borderColor: style.borderColor ?? COLORS.CARD_BORDER }}
          />
        </div>
      </div>
      {calendarDropdown}
    </>
  );
}
