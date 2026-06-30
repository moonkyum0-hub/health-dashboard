"use client";

import { useState } from "react";
import { createKnowledgeCard } from "@/app/cards/actions";
import { CARD_CATEGORIES } from "@/lib/knowledgeCards";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ImageRow {
  url: string;
  caption: string;
}

export default function KnowledgeCardForm() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(CARD_CATEGORIES[0]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addImage() {
    setImages((rows) => [...rows, { url: "", caption: "" }]);
  }

  function updateImage(idx: number, patch: Partial<ImageRow>) {
    setImages((rows) => rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function removeImage(idx: number) {
    setImages((rows) => rows.filter((_, i) => i !== idx));
  }

  async function handleSubmit(formData: FormData) {
    const payload = {
      title,
      summary,
      body,
      category,
      images: images
        .filter((img) => img.url.trim().length > 0)
        .map((img) => ({ url: img.url.trim(), caption: img.caption || undefined })),
    };

    formData.set("payload", JSON.stringify(payload));
    setSubmitting(true);
    setError(null);
    try {
      await createKnowledgeCard(formData);
    } catch {
      setError("게시에 실패했습니다. 이미지 URL 형식을 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="category">카테고리</Label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        >
          {CARD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="summary">한 줄 요약</Label>
        <Input
          id="summary"
          required
          maxLength={300}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>시각 자료 (이미지 URL)</Label>
        <p className="text-xs text-slate-400">
          이미지를 호스팅 중인 URL을 추가하세요. 카드 상세 화면에 순서대로 표시됩니다.
        </p>
        <div className="space-y-2">
          {images.map((img, idx) => (
            <div key={idx} className="flex flex-wrap gap-2 rounded-lg border border-slate-100 p-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={img.url}
                onChange={(e) => updateImage(idx, { url: e.target.value })}
                className="min-w-0 flex-1 text-sm"
              />
              <Input
                placeholder="설명(선택)"
                value={img.caption}
                onChange={(e) => updateImage(idx, { caption: e.target.value })}
                className="min-w-0 flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeImage(idx)}
                className="shrink-0 text-slate-500"
              >
                삭제
              </Button>
              {img.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={img.caption || ""}
                  className="h-16 w-full rounded-lg object-cover sm:w-28"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addImage} className="border-dashed text-slate-600">
          + 이미지 추가
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">본문</Label>
        <Textarea
          id="body"
          required
          rows={10}
          maxLength={8000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full rounded-full">
        {submitting ? "게시 중..." : "게시하기"}
      </Button>
    </form>
  );
}
