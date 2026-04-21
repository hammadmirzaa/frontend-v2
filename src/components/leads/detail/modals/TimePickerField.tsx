"use client";

import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui";
import { COLORS } from "@/lib/design-tokens";

function to24h(hour12: number, period: "AM" | "PM"): string {
  let h = hour12 === 12 ? 0 : hour12;
  if (period === "PM") h += 12;
  return String(h).padStart(2, "0");
}

function from24h(value: string): { hour12: number; minute: number; period: "AM" | "PM" } {
  if (!value) return { hour12: 12, minute: 0, period: "AM" };
  const [h24, m] = value.split(":").map(Number);
  const period = h24 >= 12 ? "PM" : "AM";
  const hour12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { hour12, minute: m || 0, period };
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const PERIODS: ("AM" | "PM")[] = ["AM", "PM"];

export interface TimePickerFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TimePickerField({ id, value, onChange, placeholder = "Select time", className = "", style = {} }: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { hour12, minute, period } = from24h(value);

  const display = value ? `${hour12}:${String(minute).padStart(2, "0")} ${period}` : "";

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function update(h: number, m: number, p: "AM" | "PM") {
    onChange(`${to24h(h, p)}:${String(m).padStart(2, "0")}`);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative flex items-center">
        <Clock className="absolute left-3 h-4 w-4 pointer-events-none" style={{ color: COLORS.BRAND }} />
        <Input
          id={id}
          readOnly
          value={display}
          placeholder={placeholder}
          onClick={() => setOpen((o) => !o)}
          className={`h-11 rounded-lg border w-full pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${className}`}
          style={{ ...style, borderColor: style.borderColor ?? COLORS.CARD_BORDER }}
        />
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 rounded-lg border bg-white shadow-lg p-3 flex gap-2" style={{ borderColor: COLORS.CARD_BORDER }}>
          <div className="flex flex-col">
            <span className="text-xs font-medium mb-1" style={{ color: COLORS.TEXT_MUTED }}>Hour</span>
            <div className="overflow-y-auto max-h-32 w-10 border rounded" style={{ borderColor: COLORS.CARD_BORDER }}>
              {HOURS.map((h) => (
                <button key={h} type="button" onClick={() => update(h, minute, period)} className="w-full py-1 text-sm hover:bg-gray-100"
                  style={hour12 === h ? { backgroundColor: COLORS.BRAND_ACTIVE_BG, color: COLORS.BRAND_TITLE } : { color: COLORS.TEXT_BODY }}>
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium mb-1" style={{ color: COLORS.TEXT_MUTED }}>Minute</span>
            <div className="overflow-y-auto max-h-32 w-12 border rounded" style={{ borderColor: COLORS.CARD_BORDER }}>
              {MINUTES.map((m) => (
                <button key={m} type="button" onClick={() => update(hour12, m, period)} className="w-full py-1 text-sm hover:bg-gray-100"
                  style={minute === m ? { backgroundColor: COLORS.BRAND_ACTIVE_BG, color: COLORS.BRAND_TITLE } : { color: COLORS.TEXT_BODY }}>
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium mb-1" style={{ color: COLORS.TEXT_MUTED }}>Period</span>
            <div className="overflow-y-auto max-h-32 w-12 border rounded" style={{ borderColor: COLORS.CARD_BORDER }}>
              {PERIODS.map((p) => (
                <button key={p} type="button" onClick={() => update(hour12, minute, p)} className="w-full py-1 text-sm hover:bg-gray-100"
                  style={period === p ? { backgroundColor: COLORS.BRAND_ACTIVE_BG, color: COLORS.BRAND_TITLE } : { color: COLORS.TEXT_BODY }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
