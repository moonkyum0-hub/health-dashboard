"use client";

import { useRef, useState } from "react";

export default function BalanceTest({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (sec: number | null) => void;
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

      {!holding && value !== null && (
        <div className="flex h-28 w-full flex-col items-center justify-center rounded-xl bg-blue-50 text-sm text-blue-700">
          <span>
            유지 시간 <span className="text-lg font-semibold">{value}초</span>
          </span>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs text-blue-500 underline"
          >
            다시 측정
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-slate-400">
        한 발 서기 균형 테스트: 눈을 뜨고 한쪽 다리를 들어올린 상태로 버튼을 누른 채 버틸 수 있는
        시간을 측정해 신체 균형 능력을 객관적으로 평가합니다.
      </p>
    </div>
  );
}
