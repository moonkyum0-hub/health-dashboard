"use client";

import { useState } from "react";
import { updateUserRole } from "@/app/settings/actions";
import { ROLE_OPTIONS, type UserRole } from "@/lib/roleMetrics";
import { Button } from "@/components/ui/button";

export default function RoleSettingsForm({ initialRole }: { initialRole: UserRole }) {
  const [role, setRole] = useState<UserRole>(initialRole);

  return (
    <form action={updateUserRole} className="space-y-4">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRole(opt.value)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              role === opt.value
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <span className="block font-medium">{opt.label}</span>
            <span className="mt-0.5 block text-xs text-slate-400">{opt.description}</span>
          </button>
        ))}
      </div>
      <Button type="submit" className="rounded-full">
        저장
      </Button>
    </form>
  );
}
