"use client";

// 30-minute resolution time picker
// Clinical basis: Pittsburgh Sleep Quality Index (Buysse et al. 1989) uses 30-min intervals
// Recall bias makes minute-level precision unreliable for subjective sleep reporting

interface Props {
  value: string;          // "HH:MM" format
  onChange: (v: string) => void;
  label?: string;
  presets: number[];      // hours to show as quick buttons (24h format)
}

function toHHMM(hour: number, half: boolean): string {
  return `${String(hour).padStart(2, "0")}:${half ? "30" : "00"}`;
}

function parseHHMM(v: string): { hour: number; half: boolean } | null {
  const [h, m] = v.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { hour: h, half: m >= 30 };
}

function displayLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "자정";
  if (hour === 12) return "정오";
  const h = hour % 12 || 12;
  return hour < 12 ? `오전${h}시` : `오후${h}시`;
}

export default function TimeQuickPicker({ value, onChange, presets }: Props) {
  const parsed = parseHHMM(value);

  function setHour(h: number) {
    const half = parsed?.half ?? false;
    onChange(toHHMM(h, half));
  }

  function toggleHalf() {
    const h = parsed?.hour ?? presets[0];
    onChange(toHHMM(h, !(parsed?.half ?? false)));
  }

  const selectedHour = parsed?.hour;
  const isHalf = parsed?.half ?? false;

  return (
    <div className="space-y-2">
      {/* Hour preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((h) => {
          const sel = selectedHour === h;
          return (
            <button
              key={h}
              type="button"
              onClick={() => setHour(h)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                sel
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {displayLabel(h)}
            </button>
          );
        })}
      </div>

      {/* 30-min toggle + display */}
      {value && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            {value}
          </span>
          <button
            type="button"
            onClick={toggleHalf}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              isHalf
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            +30분
          </button>
          {/* manual override */}
          <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 focus:border-blue-400 focus:outline-none"
          />
        </div>
      )}

      {!value && (
        <p className="text-xs text-slate-400">위에서 시간을 선택하세요</p>
      )}
    </div>
  );
}
