"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (isInStandaloneMode()) return;

    if (isIOS()) {
      setMode("ios");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") localStorage.setItem(DISMISSED_KEY, "1");
    setMode(null);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setMode(null);
  }

  if (!mode) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-3 shadow-xl">
      {mode === "android" ? (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg">
            📲
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">앱으로 설치하기</p>
            <p className="text-xs text-slate-400">홈 화면에서 바로 열 수 있어요</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={handleDismiss}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              닫기
            </button>
            <button
              onClick={handleInstall}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              설치
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold text-white">홈 화면에 추가하기</p>
              <p className="text-xs text-slate-400">Safari에서 아래 단계를 따라하세요</p>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-white"
            >
              닫기
            </button>
          </div>
          <ol className="space-y-1">
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold">1</span>
              하단 공유 버튼 <span className="text-base leading-none">⬆</span> 탭
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold">2</span>
              <span><span className="font-semibold text-white">홈 화면에 추가</span> 선택</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold">3</span>
              오른쪽 상단 <span className="font-semibold text-white">추가</span> 탭
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
