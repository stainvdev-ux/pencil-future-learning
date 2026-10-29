import { createContext, useContext } from "react";

// Scroll-driven parameters for a refinery scene, written by GSAP and read
// every frame by the scene. Each runs 0 → 1.
export function createSceneState() {
  return {
    intro: 0, // first strokes drawn on arrival, before any scroll
    draw: 0, // pencil sketch drawing in
    reveal: 0, // solid plant constructed from the ground up
    real: 0, // paper → real world (sky, ground, light)
    dusk: 0, // day → dusk: lamps, windows and flare come on
    cam: 0, // camera keyframe position, 0 → cameraKeys.length - 1
    labels: 0, // equipment tags
    truck: 0, // tanker progress along its route, 0 → 1
    side: 0, // 1 = camera rides alongside the truck, 0 = camera on its keyframe path
  };
}

export type SceneState = ReturnType<typeof createSceneState>;

/** The homepage journey's state. Other scenes create their own. */
export const refineryState = createSceneState();

export const SceneStateContext = createContext<SceneState>(refineryState);
export const useSceneState = () => useContext(SceneStateContext);
