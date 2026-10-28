import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "var(--margin)" }}>
      <h1 style={{ fontFamily: "var(--font-display)" }}>Pencil Future Learning City</h1>
      <p>
        Homepage in progress. Prototype: <Link href="/lab/refinery">refinery scene</Link>
      </p>
    </main>
  );
}
