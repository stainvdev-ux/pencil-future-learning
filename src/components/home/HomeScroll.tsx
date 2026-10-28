"use client";

import { useEffect } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import { playIntro } from "@/lib/store";

// Smooth scrolling for the homepage. There is no preloader yet, so release
// the scroll lock straight away.
export default function HomeScroll() {
  useEffect(() => {
    playIntro();
  }, []);
  return <SmoothScroll />;
}
