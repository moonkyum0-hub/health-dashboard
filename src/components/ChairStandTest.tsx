"use client";

import { useEffect, useRef, useState } from "react";
import { getChairStandStatus, calcTrend } from "@/lib/scoreStatus";

type Phase = "idle" | "ready" | "running" | "input" | "done";

export default function ChairStandTest({
  value,
  onChange,
  personalAvg,
}: {
  value: number | null;
  onChange: (count: number | null) => void;
  personalAvg?: number | null;
}) {
  const [phase, setPhase] = useState<Phase>(() => (value !== null ? "done" : "idle"));
  const [remaining, setRemaining] = useState(30);
  const [countInput, setCountInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "running") return;
    if (remaining <= 0) {
      setPhase("input");
      window.setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, remaining]);

  function start() {
    setRemaining(30);
    setCountInput("");
    onChange(null);
    setPhase("running");
  }

  function handleConfirm() {
    const count = parseInt(countInput, 10);
    if (!isNaN(count) && count >= 0 && count <= 60) {
      onChange(count);
      setPhase("done");
    }
  }

  function reset() {
    setPhase("idle");
    onChange(null);
  }

  return (
    <div>
      {phase === "idle" && (
        <button
          type="button"
          onClick={() => setPhase("ready")}
          className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-medium text-slate-600"
        >
          탭해서 측정 시작
        </button>
      )}

      {phase === "ready" && (
        <div className="rounded-xl border border-slate-200 p-4 text-sm">
          <p className="mb-3 font-medium text-slate-700">준비 방법</p>
          <ol className="mb-3 space-y-1 text-xs text-slate-500 list-decimal list-inside">
            <li>팔짱을 끼고 등받이 없는 의자에 앉으세요</li>
            <li>30초 동안 최대한 빨리 완전히 일어서고 앉으세요</li>
            <li>측정 후 직접 횟수를 입력하세요</li>
          </ol>
          <button
            type="button"
            onClick={start}
            className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            타이머 시작
          </button>
        </div>
      )}

      {phase === "running" && (
        <div className="flex h-28 w-full flex-col items-center justify-center rounded-xl bg-blue-500 text-white select-none">
          <span className="text-4xl font-bold">{remaining}</span>
          <span className="mt-1 text-sm">초 남음 — 횟수를 세세요</span>
        </div>
      )}

      {phase === "input" && (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="mb-2 text-center text-sm text-slate-500">
            30초 동안 몇 회 일어섰나요?
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              min={0}
              max={60}
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder="횟수 입력"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-2xl font-semibold focus:border-blue-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-lg bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-600"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {phase === "done" && value !== null && (() => {
        const status = getChairStandStatus(value);
        const trend = personalAvg ? calcTrend(value, personalAvg, true) : null;
        return (
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-700">{value}회 / 30초</span>
              <button type="button" onClick={reset} className="text-xs text-blue-400 underline">
                다시 측정
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.textColor}`}>
                {status.label}
              </span>
              {trend && (
                <span className={`text-xs font-medium ${trend.improved ? "text-green-600" : "text-red-500"}`}>
                  {trend.direction} 내 평균({personalAvg}회) 대비 {trend.changePct}%
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">{status.description}</p>
          </div>
        );
      })()}

      {phase === "idle" && (
        <p className="mt-2 text-xs text-slate-400">
          30초 동안 의자에서 일어서고 앉기 반복 — 하체 근력 기능 측정
        </p>
      )}
    </div>
  );
}
