"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  endpoint: string;
  body: Record<string, unknown>;
  initialContent?: string | null;
  title: string;
}

export default function AiFeedbackPanel({
  endpoint,
  body,
  initialContent,
  title,
}: Props) {
  const [content, setContent] = useState<string | null>(initialContent ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "AI 피드백 생성에 실패했습니다.");
        return;
      }
      setContent(data.feedback.content);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="sm"
            className="shrink-0 rounded-full"
          >
            {loading ? "생성 중..." : content ? "다시 생성" : "AI 피드백 생성"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-2 break-words rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {content ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
            {content}
          </div>
        ) : (
          !loading && (
            <p className="text-sm text-slate-400">
              아직 생성된 피드백이 없습니다.
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}
