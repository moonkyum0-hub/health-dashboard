"use client";

import { useEffect, useRef, useState } from "react";
import { getDigitSpanStatus, calcTrend } from "@/lib/scoreStatus";

// Generate a random digit sequence of given length,
// avoiding immediate repetition of the same digit (WAIS administration standard)
function randomSeq(length: number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    let d: number;
    do { d = Math.floor(Math.random() * 10); }
    while (seq.length > 0 && d === seq[seq.length - 1]);
    seq.push(d);
  }
  return seq;
}

const MIN_LENGTH = 4;
const MAX_LENGTH = 9;

type Phase = "idle" | "countdown" | "showing" | "input" | "feedback" | "done";

export default function DigitSpanTest({
  value,
  onChange,
  personalAvg,
}: {
  value: number | null;
  onChange: (span: number | null) => void;
  personalAvg?: number | null;
}) {
  const [phase, setPhase] = useState<Phase>(() => (value !== null ? "done" : "idle"));
  const [currentLength, setCurrentLength] = useState(MIN_LENGTH);
  const [trialIndex, setTrialIndex] = useState(0);
  const [digitIdx, setDigitIdx] = useState(0);
  const [currentSeq, setCurrentSeq] = useState<number[]>([]);
  const [userInput, setUserInput] = useState("");
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [bestSpan, setBestSpan] = useState(value ?? 0);
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  function startTest() {
    setBestSpan(0);
    setCurrentLength(MIN_LENGTH);
    setTrialIndex(0);
    onChange(null);
    beginCountdown(MIN_LENGTH, 0);
  }

  function beginCountdown(length: number, _trial: number) {
    setCurrentSeq(randomSeq(length));
    setCountdown(3);
    setPhase("countdown");
  }

  // Countdown 3→2→1→go
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setDigitIdx(0);
      setPhase("showing");
      return;
    }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 900);
    return () => window.clearTimeout(t);
  }, [phase, countdown]);

  // Show digits one at a time at ~900ms each
  useEffect(() => {
    if (phase !== "showing") return;
    const t = window.setTimeout(() => {
      if (digitIdx + 1 >= currentSeq.length) {
        setPhase("input");
        setUserInput("");
        window.setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setDigitIdx((i) => i + 1);
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [phase, digitIdx, currentSeq.length]);

  function handleConfirm() {
    const correct = userInput.replace(/\s/g, "") === currentSeq.join("");
    setFeedbackCorrect(correct);
    setPhase("feedback");

    window.setTimeout(() => {
      if (correct) {
        const newBest = Math.max(bestSpan, currentLength);
        setBestSpan(newBest);
        if (currentLength >= MAX_LENGTH) {
          onChange(newBest);
          setPhase("done");
        } else {
          const nextLen = currentLength + 1;
          setCurrentLength(nextLen);
          setTrialIndex(0);
          beginCountdown(nextLen, 0);
        }
      } else {
        if (trialIndex === 0) {
          // Second trial at same length
          setTrialIndex(1);
          beginCountdown(currentLength, 1);
        } else {
          // Both failed → done
          onChange(bestSpan);
          setPhase("done");
        }
      }
    }, 800);
  }

  function reset() {
    setPhase("idle");
    onChange(null);
    setBestSpan(0);
  }

  return (
    <div>
      {phase === "idle" && (
        <button
          type="button"
          onClick={startTest}
          className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-medium text-slate-600"
        >
          탭해서 측정 시작
        </button>
      )}

      {phase === "countdown" && (
        <div className="flex h-28 w-full flex-col items-center justify-center rounded-xl bg-slate-700 select-none">
          <span className="text-4xl font-bold text-white">{countdown > 0 ? countdown : "시작!"}</span>
          <span className="mt-1 text-xs text-slate-400">{currentLength}자리 숫자를 준비하세요</span>
        </div>
      )}

      {phase === "showing" && (
        <div className="flex h-28 w-full flex-col items-center justify-center rounded-xl bg-slate-800 select-none">
          <span className="text-5xl font-bold text-white tracking-widest">
            {currentSeq[digitIdx]}
          </span>
          <span className="mt-2 text-xs text-slate-500">
            {digitIdx + 1} / {currentSeq.length}
          </span>
        </div>
      )}

      {phase === "feedback" && (
        <div
          className={`flex h-28 w-full items-center justify-center rounded-xl text-lg font-semibold select-none ${
            feedbackCorrect ? "bg-green-500 text-white" : "bg-red-400 text-white"
          }`}
        >
          {feedbackCorrect ? "정확해요!" : trialIndex === 0 ? "다시 한번 시도할게요" : "여기까지예요"}
        </div>
      )}

      {phase === "input" && (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="mb-2 text-center text-sm text-slate-500">
            방금 본 숫자를 순서대로 입력하세요
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder="숫자 입력 후 확인"
              maxLength={currentLength}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-2xl font-mono tracking-widest focus:border-blue-400 focus:outline-none"
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
        const status = getDigitSpanStatus(value);
        const trend = personalAvg ? calcTrend(value, personalAvg, true) : null;
        return (
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-700">기억 범위 {value}자리</span>
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
                  {trend.direction} 내 평균({personalAvg}자리) 대비 {trend.changePct}%{" "}
                  {trend.improved ? "향상" : "낮음"}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">{status.description}</p>
          </div>
        );
      })()}

    </div>
  );
}
