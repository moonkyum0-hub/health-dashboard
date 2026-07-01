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
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7).concat(Array(7 - cells.slice(i, i + 7).length).fill(null)));
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
  const [expanded, setExpanded] = useState(false);
  const logDates = logDatesISO.map((s) => new Date(s));
  const today = new Date();
  const weekDays = getWeekDays();
  const year = today.getFullYear();
  const month = today.getMonth();
  const weeks = getMonthCalendar(year, month);
  const thisMonthCount = logDates.filter(
    (d) => d.getMonth() === month && d.getFullYear() === year
  ).length;

  return (
    <div>
      {/* 상단: 스트릭 + 주간 캘린더 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 스트릭 */}
        <div>
          <p className="text-3xl font-bold">
            {streak > 0 ? `🔥 ${streak}일` : "0일"}
          </p>
          <p className="text-sm text-slate-500">
            {streak > 0 ? "연속 기록 중" : "오늘 첫 기록을 남겨보세요"}
          </p>
        </div>

        {/* 주간 캘린더 — 클릭하면 월 캘린더 펼침 */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="group text-right"
          aria-label="월간 캘린더 열기/닫기"
        >
          <p className="mb-2 flex items-center justify-end gap-1 text-xs text-slate-500">
            이번 주
            <span className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
              ▾
            </span>
          </p>
          <div className="flex gap-1.5">
            {weekDays.map((day, i) => {
              const hasLog = logDates.some((d) => isSameDay(d, day));
              const isToday = isSameDay(day, today);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{DAY_KO[i]}</span>
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium
                      ${hasLog ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}
                      ${isToday ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                      group-hover:opacity-80 transition-opacity`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </button>
      </div>

      {/* 월 캘린더 — 펼쳐지는 영역 */}
      {expanded && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs text-slate-500">{month + 1}월 기록 현황</p>
          <div className="w-fit">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-x-1 mb-0.5">
              {DAY_KO.map((d) => (
                <span key={d} className="w-7 text-center text-[10px] text-slate-500">{d}</span>
              ))}
            </div>
            {/* 날짜 그리드 */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-x-1 gap-y-0.5">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="w-7 h-7" />;
                  const hasLog = logDates.some((d) => isSameDay(d, day));
                  const isToday = isSameDay(day, today);
                  const isFuture = day > today;
                  return (
                    <div
                      key={di}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs
                        ${hasLog ? "bg-blue-600 font-semibold text-white" : ""}
                        ${!hasLog && !isFuture ? "text-slate-700" : ""}
                        ${isFuture ? "text-slate-300" : ""}
                        ${isToday && !hasLog ? "ring-2 ring-blue-300 ring-offset-1 font-medium" : ""}
                        ${isToday && hasLog ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{thisMonthCount}일 기록</p>
        </div>
      )}
    </div>
  );
}
