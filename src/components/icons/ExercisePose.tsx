import { type Joints, type PoseKey, POSES } from "@/lib/poses";
import type { ExerciseCategory } from "@/lib/exerciseCatalog";
import type { BodySegment } from "@/lib/muscleHighlight";

const HIGHLIGHT_COLOR = "#2563eb";
const BASE_COLOR = "#94a3b8";

// Fallback when an exercise has no explicit muscle mapping yet — keeps the
// old per-category behavior so nothing regresses to all-gray.
function categoryFallback(category: ExerciseCategory): BodySegment[] {
  if (category === "CORE" || category === "FLEXIBILITY") return ["trunk"];
  if (category === "UPPER") return ["arm"];
  return ["thigh", "shank"];
}

function StickFigure({
  joints,
  highlight,
}: {
  joints: Joints;
  highlight: Set<BodySegment>;
}) {
  const { head, neck, hip, shoulder, elbow, hand, knee, foot, knee2, foot2 } = joints;

  const trunkColor = highlight.has("trunk") ? HIGHLIGHT_COLOR : BASE_COLOR;
  const armColor = highlight.has("arm") ? HIGHLIGHT_COLOR : BASE_COLOR;
  const thighColor = highlight.has("thigh") ? HIGHLIGHT_COLOR : BASE_COLOR;
  const shankColor = highlight.has("shank") ? HIGHLIGHT_COLOR : BASE_COLOR;

  return (
    <g fill="none" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={head[0]} cy={head[1]} r={6} fill={trunkColor} stroke="none" />
      <line x1={neck[0]} y1={neck[1]} x2={hip[0]} y2={hip[1]} stroke={trunkColor} />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={elbow[0]} y2={elbow[1]} stroke={armColor} />
      <line x1={elbow[0]} y1={elbow[1]} x2={hand[0]} y2={hand[1]} stroke={armColor} />
      <line x1={hip[0]} y1={hip[1]} x2={knee[0]} y2={knee[1]} stroke={thighColor} />
      <line x1={knee[0]} y1={knee[1]} x2={foot[0]} y2={foot[1]} stroke={shankColor} />
      {knee2 && foot2 && (
        <>
          <line
            x1={hip[0]}
            y1={hip[1]}
            x2={knee2[0]}
            y2={knee2[1]}
            stroke={thighColor}
            opacity={0.55}
          />
          <line
            x1={knee2[0]}
            y1={knee2[1]}
            x2={foot2[0]}
            y2={foot2[1]}
            stroke={shankColor}
            opacity={0.55}
          />
        </>
      )}
    </g>
  );
}

export default function ExercisePose({
  poseStart,
  poseEnd,
  category,
  highlightSegments,
  className,
}: {
  poseStart: PoseKey;
  poseEnd: PoseKey;
  category: ExerciseCategory;
  highlightSegments?: BodySegment[];
  className?: string;
}) {
  const isStatic = poseStart === poseEnd;
  const a = POSES[poseStart];
  const b = POSES[poseEnd];
  const highlight = new Set(highlightSegments ?? categoryFallback(category));

  return (
    <svg viewBox="0 0 100 100" className={className}>
      {isStatic ? (
        <g className="origin-center animate-[pose-pulse_2.4s_ease-in-out_infinite]">
          <StickFigure joints={a} highlight={highlight} />
        </g>
      ) : (
        <>
          <g className="animate-[pose-fade-a_2s_ease-in-out_infinite]">
            <StickFigure joints={a} highlight={highlight} />
          </g>
          <g className="animate-[pose-fade-b_2s_ease-in-out_infinite]">
            <StickFigure joints={b} highlight={highlight} />
          </g>
        </>
      )}
    </svg>
  );
}
