"use client";

import { useState, type ReactNode } from "react";
import { CoffeeDrawing, LeafDrawing } from "./cafe-art";

export function DogDrawing() {
  return (
    <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M48 73C30 83 21 61 29 37c6-17 19-20 33-8m38 0c16-12 30-5 34 12 8 26-2 41-21 32"
          fill="var(--pink)"
        />
        <path
          d="M49 52c0-37 65-37 65 0v40c0 28-66 28-66 0Z"
          fill="var(--paper)"
        />
        <path d="m53 112-7 27m60-27 9 27M35 144h91M57 115l-4 29m47-28 9 28" />
        <path d="M61 72h1m35 0h1" strokeWidth="7" />
        <path d="m74 86 7 6 7-6Z" fill="currentColor" />
        <path d="M81 92v8m-12-1c7 7 19 7 25 0" />
        <path
          className="doodle-tongue"
          d="M78 105v10c0 8 11 8 11 0v-10"
          fill="var(--pink)"
        />
      </g>
    </svg>
  );
}

export function CroissantDrawing() {
  return (
    <svg viewBox="0 0 170 140" fill="none" aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M23 113C-3 74 29 21 80 19c56-4 88 43 68 89-13 19-31 6-31-9 0-21-12-33-32-32-24 0-36 18-35 32 2 22-17 29-27 14Z"
          fill="var(--pink)"
        />
        <path d="m64 22 9 44m27-46-7 47M41 30l19 46m60-45-14 43M24 49l26 38m89-36-22 35M17 77l29 20m101-18-27 19M20 100l23 10m102-8-21 8" />
      </g>
    </svg>
  );
}

export function MenuAtmosphere({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`illustrated-menu ${paused ? "illustrations-paused" : ""}`}>
      <div aria-hidden="true" className="menu-doodles">
        <div className="menu-doodle doodle-plant">
          <LeafDrawing />
          <span>a little greenery</span>
        </div>
        <div className="menu-doodle doodle-coffee">
          <CoffeeDrawing />
          <span>your usual?</span>
        </div>
        <div className="menu-doodle doodle-dog">
          <DogDrawing />
          <span>crumb patrol</span>
        </div>
        <div className="menu-doodle doodle-pastry">
          <CroissantDrawing />
          <span>something flaky</span>
        </div>
      </div>
      <div className="menu-motion-controls container">
        <span>GOOD FOOD. GOOD COMPANY. TAKE YOUR TIME.</span>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? "▶ Play illustrations" : "Ⅱ Pause illustrations"}
        </button>
      </div>
      {children}
    </div>
  );
}
