import type { Metadata } from "next";
import RefineryLab from "./RefineryLab";
import "./lab.css";

export const metadata: Metadata = {
  title: "Refinery prototype · Pencil Future Learning City",
  robots: { index: false },
};

export default function Page() {
  return <RefineryLab />;
}
