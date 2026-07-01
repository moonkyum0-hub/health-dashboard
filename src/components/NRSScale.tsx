"use client";

import { getPainStatus, getFatigueStatus } from "@/lib/scoreStatus";

export default function NRSScale({
  type,
  value,
  onChange,
}: {
  type: "pain" | "fatigue";
  value: number | null;
  onChange: (score: number) => void;
}) {
  const isPain = type === "pain";
  const label = isPain ? "통증 강도" : "피로도";
  const lowLabel = isPain ? "통증 없음" : "피로 없음";
  const highLabel = isPain ? "최악의 통증" : "극심한 피로";
  const status = value !== null ? (isPain ? getPainStatus(value) : getFatigueStatus(value)) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {status && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.textColor}`}>
            {status.label}
          </span>
        )}
      </div>

      <div className="flex justify-between gap-1">
        {Array.from({ length: 11 }, (_, n) => {
          const isSelected = value === n;
          const colorClass = isSelected
            ? n <= 3
              ? "bg-green-500 text-white"
              : n <= 6
              ? "bg-yellow-500 text-white"
              : "bg-red-500 text-white"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200";
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`h-8 flex-1 rounded text-xs font-semibold transition-colors ${colorClass}`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>

      {value !== null && status && (
        <p className="mt-1.5 text-xs text-slate-500">{status.description}</p>
      )}
    </div>
  );
}
