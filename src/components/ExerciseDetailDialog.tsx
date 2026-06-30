"use client";

import { useState } from "react";
import {
  CATEGORY_LABEL,
  type ExerciseCategory,
} from "@/lib/exerciseCatalog";
import type { PoseKey } from "@/lib/poses";
import type { BodySegment } from "@/lib/muscleHighlight";
import CategoryIcon from "@/components/icons/CategoryIcon";
import ExercisePose from "@/components/icons/ExercisePose";
import VideoLinkEditor from "@/components/VideoLinkEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ExerciseDetailProps {
  id: string;
  category: ExerciseCategory;
  name: string;
  description: string;
  benefit: string;
  cue: string;
  defaultDurationMin: number | null;
  defaultSetsReps: string | null;
  poseStart: PoseKey;
  poseEnd: PoseKey;
  highlightSegments?: BodySegment[];
  videoUrl: string | null;
  canEdit: boolean;
}

export default function ExerciseDetailDialog(props: ExerciseDetailProps) {
  const {
    category,
    name,
    description,
    benefit,
    cue,
    defaultDurationMin,
    defaultSetsReps,
    poseStart,
    poseEnd,
  } = props;
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left"
      >
        <Card className="min-w-0 transition-colors hover:border-blue-300">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-50 p-2">
                <ExercisePose
                  poseStart={poseStart}
                  poseEnd={poseEnd}
                  category={category}
                  highlightSegments={props.highlightSegments}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate font-display font-semibold">{name}</h3>
                  <CategoryIcon category={category} className="h-5 w-5 shrink-0 text-slate-300" />
                </div>
                {(defaultDurationMin || defaultSetsReps) && (
                  <Badge variant="secondary" className="mt-1">
                    {defaultDurationMin ? `${defaultDurationMin}분` : ""}
                    {defaultDurationMin && defaultSetsReps ? " · " : ""}
                    {defaultSetsReps ?? ""}
                  </Badge>
                )}
                <p className="mt-1 text-xs text-slate-400">자세히 보려면 클릭하세요 ›</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </button>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary">{CATEGORY_LABEL[category]}</Badge>
            {(defaultDurationMin || defaultSetsReps) && (
              <span className="text-xs text-slate-400">
                {defaultDurationMin ? `${defaultDurationMin}분` : ""}
                {defaultDurationMin && defaultSetsReps ? " · " : ""}
                {defaultSetsReps ?? ""}
              </span>
            )}
          </div>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mx-auto h-32 w-32 rounded-xl bg-slate-50 p-3">
          <ExercisePose poseStart={poseStart} poseEnd={poseEnd} category={category} />
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-700">기대 효과</dt>
            <dd className="text-slate-600 break-words">{benefit}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">수행 큐</dt>
            <dd className="text-slate-600 break-words">{cue}</dd>
          </div>
        </dl>

        {props.canEdit ? (
          <VideoLinkEditor exerciseId={props.id} initialUrl={props.videoUrl} />
        ) : (
          props.videoUrl && (
            <a
              href={props.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 underline"
            >
              참고 영상 보기 ▶
            </a>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
