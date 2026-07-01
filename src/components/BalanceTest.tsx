"use client";

import { useRef, useState } from "react";
import { getBalanceStatus, calcTrend } from "@/lib/scoreStatus";

export default function BalanceTest({
  value,
  onChange,
  personalAvg,
}: {
  value: number | null;
  onChange: (sec: number | null) => void;
  personalAvg?: number | null;
}) {
  const [holding, setHolding] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  function tick() {
    setElapsedMs(performance.now() - startedAtRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }

  function start() {
    startedAtRef.current = performance.now();
    setElapsedMs(0);
    setHolding(true);
    onChange(null);
    rafRef.current = requestAnimationFrame(tick);
  }

  function stop() {
    if (!holding) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const finalSec = Math.round(((performance.now() - startedAtRef.current) / 100)) / 10;
    setHolding(false);
    onChange(finalSec);
  }

  function reset() {
    onChange(null);
    setElapsedMs(0);
  }

  return (
    <div>
      {!holding && value === null && (
        <button
          type="button"
          onPointerDown={start}
          className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-medium text-slate-600 select-none"
        >
          한 발로 서서 버튼을 누르고 있다가, 균형이 무너지면 손을 떼세요
        </button>
      )}

      {holding && (
        <button
          type="button"
          onPointerUp={stop}
          onPointerLeave={stop}
          className="flex h-28 w-full select-none items-center justify-center rounded-xl bg-green-500 text-2xl font-semibold text-white"
        >
          {(elapsedMs / 1000).toFixed(1)}초
        </button>
      )}

      {!holding && value !== null && (() => {
        const status = getBalanceStatus(value);
        const trend = personalAvg ? calcTrend(value, personalAvg, true) : null;
        return (
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-700">유지 시간 {value}초</span>
              <button type="button" onClick={reset} className="text-xs text-blue-400 underline">다시 측정</button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.textColor}`}>
                {status.label}
              </span>
              {trend && (
                <span className={`text-xs font-medium ${trend.improved ? "text-green-600" : "text-red-500"}`}>
                  {trend.direction} 내 평균({personalAvg}초) 대비 {trend.changePct}% {trend.improved ? "나음" : "낮음"}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">{status.description}</p>
          </div>
        );
      })()}

      <p className="mt-2 text-xs text-slate-400">
        한 발 서기 균형 테스트: 눈을 뜨고 한쪽 다리를 들어올린 상태로 버튼을 누른 채 버틸 수 있는
        시간을 측정해 신체 균형 능력을 객관적으로 평가합니다.
      </p>
    </div>
  );
}
