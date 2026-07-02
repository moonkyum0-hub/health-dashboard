export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
        📡
      </div>
      <h1 className="text-xl font-bold text-slate-800">인터넷 연결이 없어요</h1>
      <p className="max-w-xs text-sm text-slate-500">
        네트워크가 끊겼어요. 연결을 확인한 후 다시 시도해 주세요.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        다시 시도
      </button>
    </div>
  );
}
