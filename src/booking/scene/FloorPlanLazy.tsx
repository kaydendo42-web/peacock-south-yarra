"use client";
import dynamic from "next/dynamic";

/**
 * The room, loaded in the browser and only in the browser.
 *
 * three.js is the heaviest thing on the site by some margin and an isometric
 * canvas has nothing to say to a server renderer — there is no markup to
 * pre-paint and no crawler that benefits. Loading it on demand keeps it out of
 * the bundle every other page pays for, and the placeholder holds the sky
 * gradient so the layout does not jump when it arrives.
 */
const FloorPlan = dynamic(() => import("./FloorPlan"), {
  ssr: false,
  loading: () => (
    <div className="scene" aria-busy="true">
      <p className="scene__loading t-13 ink-45">Setting the room…</p>
    </div>
  ),
});

export default FloorPlan;
