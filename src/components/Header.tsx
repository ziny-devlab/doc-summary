"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";

const PROJECTS = [
  {
    name: "Auto Docs",
    href: "https://auto-docs2.vercel.app/landing",
    isSelected: false,
  },
  {
    name: "Docs Summarizer",
    href: "https://doc-summary-gold.vercel.app/landing",
    isSelected: true,
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="font-bold text-lg text-neutral-800 tracking-tight select-none">
          <Link href="https://ziny-devlab.vercel.app/" target="_blank">
            🪄 ziny 개발실
          </Link>
        </div>
        {/* PC 메뉴 */}
        <nav className="hidden sm:flex gap-4">
          {PROJECTS.map((project) => (
            <Link
              key={project.name}
              href={project.href}
              className={clsx(
                "text-neutral-500 hover:text-neutral-900 px-2 py-1 rounded transition",
                {
                  "text-neutral-900 font-semibold": project.isSelected,
                }
              )}
              target={project.href.startsWith("http") ? "_blank" : undefined}
              rel={
                project.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {project.name}
            </Link>
          ))}
        </nav>
        {/* 모바일 메뉴 버튼 */}
        <button
          className="sm:hidden ml-2 p-2 rounded hover:bg-neutral-100 transition"
          onClick={() => setOpen((o) => !o)}
          aria-label="메뉴 열기"
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
      {/* 모바일 드롭다운 메뉴 (트랜지션) */}
      <div
        className={clsx(
          "sm:hidden overflow-hidden transition-all duration-300",
          open
            ? "max-h-[60vh] overflow-y-auto opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        )}
        style={{
          transitionProperty: "max-height, opacity",
        }}
      >
        <nav className="px-4 pb-3 flex flex-col gap-2 bg-white/90 border-b border-neutral-200">
          {PROJECTS.map((project) => (
            <Link
              key={project.name}
              href={project.href}
              className={clsx(
                "text-neutral-600 hover:text-neutral-900 px-2 py-2 rounded transition font-medium",
                {
                  "text-neutral-900 font-semibold": project.isSelected,
                }
              )}
              target={project.href.startsWith("http") ? "_blank" : undefined}
              rel={
                project.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              {project.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
