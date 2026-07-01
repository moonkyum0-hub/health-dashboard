"use client";

import { useRef, useState } from "react";
import { getReactionTimeStatus, calcTrend } from "@/lib/scoreStatus";

type Phase = "idle" | "waiting" | "ready" | "tooSoon" | "done";

const ROUNDS = 5;

export default function ReactionTimeTest({
  value,
  onChange,
  personalAvg,
}: {
  value: number | null;
  onChange: (ms: number | null) => void;
  personalAvg?: number | null;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  function startRound() {
    setPhase("waiting");
    const delay = 800 + Math.random() * 2000;
    timeoutRef.current = window.setTimeout(() => {
      startedAtRef.current = performance.now();
      setPhase("ready");
    }, delay);
  }

  function reset() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setPhase("idle");
    setRound(0);
    setTimes([]);
    onChange(null);
  }

  function handleTap() {
    if (phase === "idle" || phase === "done") {
      setTimes([]);
      setRound(0);
      startRound();
      return;
    }
    if (phase === "waiting") {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setPhase("tooSoon");
      return;
    }
    if (phase === "tooSoon") {
      startRound();
      return;
    }
    if (phase === "ready") {
      const elapsed = performance.now() - startedAtRef.current;
      const next = [...times, elapsed];
      setTimes(next);
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= ROUNDS) {
        const avg = next.reduce((a, b) => a + b, 0) / next.length;
        onChange(Math.round(avg));
        setPhase("done");
      } else {
        startRound();
      }
    }
  }

  const boxStyle: Record<Phase, string> = {
    idle: "bg-slate-100 text-slate-600",
    waiting: "bg-slate-700 text-white",
    ready: "bg-green-500 text-white",
    tooSoon: "bg-red-500 text-white",
    done: "bg-blue-50 text-blue-700",
  };

  const boxText: Record<Phase, string> = {
    idle: "탭해서 측정 시작",
    waiting: "초록색이 되면 탭하세요",
    ready: "지금 탭!",
    tooSoon: "너무 빨라요! 다시 탭해서 재시도",
    done: "측정 완료",
  };

  return (
    <div>
      {phase !== "done" && (
        <button
          type="button"
          onClick={handleTap}
          className={`flex h-28 w-full items-center justify-center rounded-xl text-sm font-medium transition-colors select-none ${boxStyle[phase]}`}
        >
          {boxText[phase]}
        </button>
      )}
      {phase !== "idle" && phase !== "done" && (
        <p className="mt-1 text-xs text-slate-400">{round}/{ROUNDS}회 진행 중</p>
      )}
      {phase === "done" && value !== null && (() => {
        const status = getReactionTimeStatus(value);
        const trend = personalAvg ? calcTrend(value, personalAvg, false) : null;
        return (
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-700">평균 반응속도 {value}ms</span>
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
                  {trend.direction} 내 평균({personalAvg}ms) 대비 {trend.changePct}%{" "}
                  {trend.improved ? "빠름" : "느림"}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">{status.description}</p>
          </div>
        );
      })()}
      {phase !== "done" && (
        <p className="mt-2 text-xs text-slate-400">
          색이 초록색으로 바뀌는 순간 최대한 빠르게 탭하세요. {ROUNDS}회 평균을 기록합니다.
        </p>
      )}
    </div>
  );
}
