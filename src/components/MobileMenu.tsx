"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function MobileMenu({
  links,
  isAdmin,
  userEmail,
}: {
  links: { href: string; label: string }[];
  isAdmin: boolean;
  userEmail: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="메뉴 열기"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5H16M2 9H16M2 13.5H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-[57px] z-30 max-h-[calc(100vh-57px)] overflow-y-auto border-b border-slate-200 bg-white px-4 py-3 shadow-lg">
          <nav className="flex flex-col gap-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-blue-600 hover:bg-blue-50"
              >
                관리자
              </Link>
            )}
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="truncate px-3 text-xs text-slate-400">{userEmail}</p>
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/" })}
              className="mt-2 w-full rounded-full border border-slate-200 px-3 py-2 text-center text-sm text-slate-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
