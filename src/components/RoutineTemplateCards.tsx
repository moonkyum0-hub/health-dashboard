"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATALOG_SEED, CATEGORY_LABEL, type ExerciseCategory } from "@/lib/exerciseCatalog";
import { ROUTINE_TEMPLATES } from "@/lib/routineTemplates";
import { addRoutineFromTemplate } from "@/app/routines/actions";

const catalogByName = Object.fromEntries(CATALOG_SEED.map((e) => [e.name, e]));

export default function RoutineTemplateCards() {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const selected = ROUTINE_TEMPLATES.find((t) => t.id === open) ?? null;

  return (
    <>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ROUTINE_TEMPLATES.map((tpl) => (
          <li key={tpl.id}>
            <button
              type="button"
              onClick={() => setOpen(tpl.id)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:border-blue-300"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{tpl.name}</p>
                <p className="truncate text-xs text-slate-400 mt-0.5">{tpl.description}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-300">›</span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="mt-0.5 text-sm text-slate-400">{selected.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100"
                aria-label="닫기"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ul className="space-y-3">
              {selected.exerciseNames.map((name, idx) => {
                const ex = catalogByName[name];
                return (
                  <li key={name} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        <span className="mr-2 text-xs text-slate-300">{idx + 1}</span>
                        {name}
                      </span>
                      {ex && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORY_LABEL[ex.category as ExerciseCategory]}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {ex.defaultDurationMin}분
                            {ex.defaultSetsReps ? ` · ${ex.defaultSetsReps}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    {ex?.benefit && (
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{ex.benefit}</p>
                    )}
                  </li>
                );
              })}
            </ul>

            <form
              action={addRoutineFromTemplate.bind(null, selected.id)}
              onSubmit={() => { setAdding(selected.id); setOpen(null); }}
              className="mt-4"
            >
              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={adding === selected.id}
              >
                {adding === selected.id ? "추가 중..." : "내 루틴에 추가하기"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
