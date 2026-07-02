"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const DRAFT_KEY = "mhd-new-log-draft";

function hasMeaningfulContent(raw: string): boolean {
  try {
    const d = JSON.parse(raw);
    return !!(
      d.quickEnergy || d.sleepHours || d.bedTime ||
      d.exercises?.length || d.reactionTimeMs || d.fatigueScore != null
    );
  } catch {
    return false;
  }
}

export default function DraftNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasDraft, setHasDraft] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  function check() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      setHasDraft(!!raw && hasMeaningfulContent(raw));
    } catch {
      setHasDraft(false);
    }
  }

  useEffect(() => {
    check();
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  // 경로 변경될 때마다 재확인 (제출 후 draft 삭제 반영)
  useEffect(() => {
    check();
    setDismissed(false);
  }, [pathname]);

  // /log/new 에서는 폼 자체 배너가 처리 — 여기선 숨김
  if (!hasDraft || dismissed || pathname === "/log/new" || pathname?.startsWith("/logs/") && pathname.endsWith("/edit")) {
    return null;
  }

  function handleContinue() {
    router.push("/log/new");
  }

  function handleDiscard() {
    try {
      localStorage.removeItem(DRAFT_KEY);
      window.dispatchEvent(new StorageEvent("storage", { key: DRAFT_KEY }));
    } catch { /* ignore */ }
    setHasDraft(false);
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 shadow-xl">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
      </span>
      <span className="text-sm font-medium text-white">임시저장된 기록이 있어요</span>
      <button
        type="button"
        onClick={handleContinue}
        className="ml-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-amber-300"
      >
        이어 작성
      </button>
      <button
        type="button"
        onClick={handleDiscard}
        className="rounded-full px-2 py-1 text-xs text-slate-400 hover:text-white"
      >
        삭제
      </button>
    </div>
  );
}
