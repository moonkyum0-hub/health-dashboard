"use client";

import { useRef, useState } from "react";

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
}: {
  value: StroopResult | null;
  onChange: (result: StroopResult | null) => void;
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

      {!active && value && (
        <div className="flex h-28 w-full flex-col items-center justify-center rounded-xl bg-blue-50 text-sm text-blue-700">
          <span>
            정확도 <span className="text-lg font-semibold">{value.accuracy}%</span> · 평균{" "}
            <span className="text-lg font-semibold">{value.avgMs}ms</span>
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
        스트룹 테스트(Stroop Test): 글자의 뜻과 색깔이 다를 때 색깔만 빠르게 골라내는 능력을 측정해
        주의력·실행기능(전두엽 기능)을 객관적으로 평가합니다.
      </p>
    </div>
  );
}
