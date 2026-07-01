"use client";

import { useState } from "react";
import { isSameDay } from "@/lib/streak";

const DAY_KO = ["월", "화", "수", "목", "금", "토", "일"];

function getWeekDays(): Date[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthCalendar(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  // 월요일 기준 시작 offset (0=월 … 6=일)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  // 7칸씩 주 단위로 분할
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export default function StreakWidget({
  streak,
  logDatesISO,
}: {
  streak: number;
  logDatesISO: string[];
}) {
  const [view, setView] = useState<"week" | "month">("week");

  const logDates = logDatesISO.map((s) => new Date(s));
  const today = new Date();
  const weekDays = getWeekDays();
  const year = today.getFullYear();
  const month = today.getMonth();
  const weeks = getMonthCalendar(year, month);

  return (
    <div>
      {/* 헤더: 스트릭 + 토글 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold">
            {streak > 0 ? `🔥 ${streak}일` : "0일"}
          </p>
          <p className="text-sm text-slate-400">
            {streak > 0 ? "연속 기록 중" : "오늘 첫 기록을 남겨보세요"}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("week")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              view === "week" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            이번 주
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              view === "month" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            이번 달
          </button>
        </div>
      </div>

      {/* 주간 뷰 */}
      {view === "week" && (
        <div className="flex justify-between">
          {weekDays.map((day, i) => {
            const hasLog = logDates.some((d) => isSameDay(d, day));
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400">{DAY_KO[i]}</span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium
                    ${hasLog ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}
                    ${isToday ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 월간 뷰 */}
      {view === "month" && (
        <div>
          {/* 요일 헤더 */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAY_KO.map((d) => (
              <span key={d} className="text-[10px] text-slate-400">{d}</span>
            ))}
          </div>
          {/* 주 단위 행 */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-y-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const hasLog = logDates.some((d) => isSameDay(d, day));
                const isToday = isSameDay(day, today);
                const isFuture = day > today;
                return (
                  <div key={di} className="flex justify-center py-0.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs
                        ${hasLog ? "bg-blue-600 font-semibold text-white" : ""}
                        ${!hasLog && !isFuture ? "text-slate-400" : ""}
                        ${isFuture ? "text-slate-200" : ""}
                        ${isToday && !hasLog ? "ring-2 ring-blue-300 ring-offset-1 text-slate-600" : ""}
                        ${isToday && hasLog ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <p className="mt-2 text-xs text-slate-400">
            {logDates.filter((d) => d.getMonth() === month && d.getFullYear() === year).length}일 기록
          </p>
        </div>
      )}
    </div>
  );
}
