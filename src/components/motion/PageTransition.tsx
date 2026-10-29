import { ViewTransition } from "react";

// Page enter and exit: the old page lifts away and the new one is revealed
// from below, like the preloader's sheet. The header is named separately so it stays put.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
