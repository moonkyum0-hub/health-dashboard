"use client";

import { useState } from "react";

export default function CollapsibleAI({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-purple-700">
            AI
          </span>
          <span className="text-sm font-medium text-slate-700">{title}</span>
        </div>
        <span className="text-xs text-slate-400">{open ? "접기 ▲" : "분석 보기 ▼"}</span>
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  );
}
