"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, X } from "lucide-react";
import { Input } from "@/components/ui";
import { COLORS, zIndex } from "@/lib/design-tokens";

const CALENDAR_GAP = 4;
const SHORT_MONTHS = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",");
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

function formatShortDate(yyyyMmDd: string) {
  if (!yyyyMmDd) return "";
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return `${SHORT_MONTHS[m - 1]} ${d}, ${y}`;
}

function parseYYYYMMDD(s: string): { y: number; m: number; d: number } | null {
  if (!s) return null;
  const parts = s.split("-").map(Number);
  if (parts.length !== 3) return null;
  return { y: parts[0], m: parts[1], d: parts[2] };
}

function dateToTimestamp(yyyyMmDd: string) {
  const p = parseYYYYMMDD(yyyyMmDd);
  if (!p) return 0;
  return new Date(p.y, p.m - 1, p.d).getTime();
}

export interface DateRangePickerFieldProps {
  id?: string;
  dateStart: string;
  dateEnd: string;
  onChange: (range: { dateStart: string; dateEnd: string }) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DateRangePickerField({
  id,
  dateStart,
  dateEnd,
  onChange,
  placeholder = "Select date range",
  className = "",
  style = {},
}: DateRangePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    if (dateStart) {
      const [y, m] = dateStart.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  // Pending range while calendar is open so we don't rely on parent re-render between first and second click
  const [pendingStart, setPendingStart] = useState<string>("");
  const [pendingEnd, setPendingEnd] = useState<string>("");

  const hasRange = !!(dateStart && dateEnd);
  const display = hasRange
    ? `${formatShortDate(dateStart)} – ${formatShortDate(dateEnd)}`
    : "";

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + CALENDAR_GAP,
      left: rect.left,
    });
  }, [open]);

  // When opening calendar, init pending from props so we can select two dates without waiting for parent
  useEffect(() => {
    if (open) {
      setPendingStart(dateStart);
      setPendingEnd(dateEnd);
    }
  }, [open, dateStart, dateEnd]);

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
  // Use pending values when open so calendar shows and uses the in-progress range
  const startForCalendar = open ? pendingStart : dateStart;
  const endForCalendar = open ? pendingEnd : dateEnd;
  const startTs = dateToTimestamp(startForCalendar);
  const endTs = dateToTimestamp(endForCalendar);
  const hasPendingRange = !!(startForCalendar && endForCalendar);

  function prevMonth() {
    setView((v) => new Date(v.getFullYear(), v.getMonth() - 1));
  }
  function nextMonth() {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + 1));
  }

  function selectDay(day: number) {
    const selected = toYYYYMMDD(year, month, day);
    const selectedTs = new Date(year, month, day).getTime();
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(selected);
      setPendingEnd("");
    } else {
      if (selectedTs < startTs) {
        onChange({ dateStart: selected, dateEnd: pendingStart });
      } else {
        onChange({ dateStart: pendingStart, dateEnd: selected });
      }
      setOpen(false);
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange({ dateStart: "", dateEnd: "" });
  }

  const calendarDropdown =
    open &&
    dropdownPosition &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={calendarRef}
        data-filter-datepicker-portal
        className="fixed w-64 rounded-lg border bg-white shadow-lg p-3"
        style={{
          borderColor: COLORS.CARD_BORDER,
          zIndex: zIndex.popover,
          top: dropdownPosition.top,
          left: dropdownPosition.left,
        }}
        role="dialog"
        aria-label="Choose date range"
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
            const cellTs = new Date(year, month, d).getTime();
            const cellStr = toYYYYMMDD(year, month, d);
            const isStart = startForCalendar === cellStr;
            const isEnd = endForCalendar === cellStr;
            const inRange =
              hasPendingRange && startTs <= cellTs && cellTs <= endTs;
            const isSelected = isStart || isEnd;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(d)}
                className="h-8 w-8 rounded-full text-sm hover:bg-gray-100"
                style={{
                  color: COLORS.TEXT_BODY,
                  ...(inRange ? { backgroundColor: COLORS.BRAND_ACTIVE_BG ?? COLORS.GRAY_100 } : {}),
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
          <Calendar className="absolute left-3 h-4 w-4 pointer-events-none shrink-0" style={{ color: COLORS.BRAND }} />
          <Input
            id={id}
            readOnly
            value={display}
            placeholder={placeholder}
            onClick={() => setOpen((o) => !o)}
            className={`h-11 rounded-lg w-full pl-10 pr-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${className} outline-none focus:ring-0 focus:ring-offset-0`}
            style={{ ...style }}
          />
          {hasRange && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-0.5 rounded hover:bg-gray-100 pointer-events-auto"
              style={{ color: COLORS.TEXT_MUTED }}
              aria-label="Clear date range"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {calendarDropdown}
    </>
  );
}
