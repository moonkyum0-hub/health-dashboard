"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VideoLinkEditor({
  exerciseId,
  initialUrl,
}: {
  exerciseId: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/catalog/${exerciseId}/video`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: draft.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setUrl(data.exercise.videoUrl);
      setEditing(false);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://youtube.com/..."
          className="min-w-0 flex-1 text-xs"
        />
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditing(false);
            setDraft(url ?? "");
            setError(null);
          }}
        >
          취소
        </Button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 underline hover:text-blue-700"
        >
          참고 영상 보기 ▶
        </a>
      ) : (
        <span className="text-slate-400">참고 영상 없음</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-slate-400 underline hover:text-slate-600"
      >
        {url ? "수정" : "링크 추가"}
      </button>
    </div>
  );
}
