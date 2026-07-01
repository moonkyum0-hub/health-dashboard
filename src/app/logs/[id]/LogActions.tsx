"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteLog } from "./actions";

export default function LogActions({ logId }: { logId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteLog(logId);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/logs/${logId}/edit`}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
      >
        수정
      </Link>
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-500">정말 삭제할까요?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-400 hover:bg-red-50"
        >
          삭제
        </button>
      )}
    </div>
  );
}
