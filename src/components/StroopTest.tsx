"use client";

import { useRef, useState } from "react";
import { getStroopAccuracyStatus, getStroopAvgMsStatus, calcTrend } from "@/lib/scoreStatus";

type ColorKey = "RED" | "BLUE" | "GREEN" | "YELLOW";

const COLORS: Record<ColorKey, { label: string; hex: string }> = {
  RED: { label: "빨강", hex: "#ef4444" },
  BLUE: { label: "파랑", hex: "#3b82f6" },
  GREEN: { label: "초록", hex: "#22c55e" },
  YELLOW: { label: "노랑", hex: "#eab308" },
};

const KEYS = Object.keys(COLORS) as ColorKey[];

const ROUNDS = 10;

function randomColor(exclude?: ColorKey): ColorKey {
  const pool = exclude ? KEYS.filter((k) => k !== exclude) : KEYS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export type StroopResult = { accuracy: number; avgMs: number };

export default function StroopTest({
  value,
  onChange,
  personalAvgAccuracy,
  personalAvgMs,
}: {
  value: StroopResult | null;
  onChange: (result: StroopResult | null) => void;
  personalAvgAccuracy?: number | null;
  personalAvgMs?: number | null;
}) {
  const [active, setActive] = useState(false);
  const [round, setRound] = useState(0);
  const [word, setWord] = useState<ColorKey>("RED");
  const [ink, setInk] = useState<ColorKey>("BLUE");
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const startedAtRef = useRef(0);

  function nextRound(roundNumber: number) {
    const nextWord = randomColor();
    const nextInk = Math.random() < 0.2 ? nextWord : randomColor(nextWord);
    setWord(nextWord);
    setInk(nextInk);
    setRound(roundNumber);
    setFlash(null);
    startedAtRef.current = performance.now();
  }

  function start() {
    setActive(true);
    setCorrectCount(0);
    setTimes([]);
    onChange(null);
    nextRound(1);
  }

  function handleColorClick(e: React.MouseEvent<HTMLButtonElement>) {
    answer(e.currentTarget.dataset.color as ColorKey);
  }

  function answer(key: ColorKey) {
    if (!active || flash) return;
    const elapsed = performance.now() - startedAtRef.current;
    const isCorrect = key === ink;
    if (isCorrect) setCorrectCount((c) => c + 1);
    setTimes((t) => [...t, elapsed]);
    setFlash(isCorrect ? "correct" : "wrong");

    window.setTimeout(() => {
      if (round >= ROUNDS) {
        const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
        const finalTimes = [...times, elapsed];
        const accuracy = Math.round((finalCorrect / ROUNDS) * 100);
        const avgMs = Math.round(
          finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length
        );
        onChange({ accuracy, avgMs });
        setActive(false);
      } else {
        nextRound(round + 1);
      }
    }, 250);
  }

  function reset() {
    setActive(false);
    setRound(0);
    onChange(null);
  }

  return (
    <div>
      {!active && !value && (
        <button
          type="button"
          onClick={start}
          className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-medium text-slate-600"
        >
          탭해서 측정 시작
        </button>
      )}

      {active && (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="mb-3 text-center text-xs text-slate-400">
            {round}/{ROUNDS}회 · 글자의 <strong>색깔</strong>에 맞는 버튼을 누르세요 (단어 뜻 아님)
          </p>
          <div
            className="flex h-20 items-center justify-center rounded-lg text-3xl font-bold transition-colors"
            style={{
              color: COLORS[ink].hex,
              backgroundColor:
                flash === "correct" ? "#dcfce7" : flash === "wrong" ? "#fee2e2" : "#f8fafc",
            }}
          >
            {COLORS[word].label}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                data-color={k}
                onClick={handleColorClick}
                className="rounded-lg py-2 text-xs font-medium text-white"
                style={{ backgroundColor: COLORS[k].hex }}
              >
                {COLORS[k].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!active && value && (() => {
        const accStatus = getStroopAccuracyStatus(value.accuracy);
        const msStatus = getStroopAvgMsStatus(value.avgMs);
        const accTrend = personalAvgAccuracy ? calcTrend(value.accuracy, personalAvgAccuracy, true) : null;
        const msTrend = personalAvgMs ? calcTrend(value.avgMs, personalAvgMs, false) : null;
        return (
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-700">
                정확도 {value.accuracy}% · 평균 {value.avgMs}ms
              </span>
              <button type="button" onClick={reset} className="text-xs text-blue-400 underline">다시 측정</button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${accStatus.color} ${accStatus.textColor}`}>정확도 {accStatus.label}</span>
                {accTrend && (
                  <span className={`text-xs font-medium ${accTrend.improved ? "text-green-600" : "text-red-500"}`}>
                    {accTrend.direction} 내 평균 대비 {accTrend.changePct}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${msStatus.color} ${msStatus.textColor}`}>반응 {msStatus.label}</span>
                {msTrend && (
                  <span className={`text-xs font-medium ${msTrend.improved ? "text-green-600" : "text-red-500"}`}>
                    {msTrend.direction} 내 평균 대비 {msTrend.changePct}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{accStatus.description}</p>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
