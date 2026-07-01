"use client";

import { useState } from "react";
import { getPHQ2Status } from "@/lib/scoreStatus";

const OPTIONS = [
  { value: 0, label: "전혀 없음" },
  { value: 1, label: "며칠 동안" },
  { value: 2, label: "7일 이상" },
  { value: 3, label: "거의 매일" },
];

const QUESTIONS = [
  "일이나 여가에서 흥미나 즐거움이 느껴지지 않았다",
  "기분이 가라앉거나 우울하거나 희망이 없다고 느꼈다",
];

export default function PHQ2Screen({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (score: number | null) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null]);
  // If pre-populated (edit mode), show result directly
  const showResult = value !== null && answers.every((a) => a === null);

  function handleAnswer(qIdx: number, val: number) {
    const next = [...answers];
    next[qIdx] = val;
    setAnswers(next);
    if (next.every((v) => v !== null)) {
      onChange(next.reduce((s, v) => s + (v ?? 0), 0));
    }
  }

  function reset() {
    setAnswers([null, null]);
    onChange(null);
  }

  const status = value !== null ? getPHQ2Status(value) : null;

  if (showResult && status) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">기분 선별 (PHQ-2)</span>
          <button type="button" onClick={reset} className="text-xs text-slate-400 underline">
            다시 답변
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.textColor}`}>
            {status.label} ({value}점/6점)
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{status.description}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">기분 선별 (PHQ-2)</p>
        <span className="text-[10px] text-slate-400">지난 2주간</span>
      </div>
      <div className="space-y-3">
        {QUESTIONS.map((q, qIdx) => (
          <div key={qIdx}>
            <p className="mb-2 text-sm font-medium text-slate-800">{q}</p>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {OPTIONS.map((opt) => {
                const selected = answers[qIdx] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(qIdx, opt.value)}
                    className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                      selected
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {value !== null && status && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.textColor}`}>
            {status.label} ({value}/6)
          </span>
          <span className="text-xs text-slate-500">{status.description}</span>
        </div>
      )}
    </div>
  );
}
