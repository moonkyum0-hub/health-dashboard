import type { ExerciseCategory } from "@/lib/exerciseCatalog";

const PATHS: Record<ExerciseCategory, React.ReactNode> = {
  CORE: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v7" />
      <path d="M8 10h8" />
      <path d="M9 21l3-7 3 7" />
    </>
  ),
  UPPER: (
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v6" />
      <path d="M5 9l7-1 7 1" />
      <path d="M12 12l-3 9" />
      <path d="M12 12l3 9" />
    </>
  ),
  LOWER: (
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v6" />
      <path d="M9 21l2-9h2l2 9" />
      <path d="M9 21h2" />
      <path d="M13 21h2" />
    </>
  ),
  FLEXIBILITY: (
    <>
      <circle cx="6" cy="5" r="2" />
      <path d="M6 7c0 5 4 6 9 7s5 6 5 6" />
      <path d="M16 13l4 1" />
    </>
  ),
  CARDIO: (
    <path d="M3 12h4l2 6 4-12 2 6h6" />
  ),
};

export default function CategoryIcon({
  category,
  className,
}: {
  category: ExerciseCategory;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[category]}
    </svg>
  );
}
