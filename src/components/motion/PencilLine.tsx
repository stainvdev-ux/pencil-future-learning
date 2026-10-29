// A slightly uneven graphite stroke, drawn in by sectionEntrances.
export default function PencilLine({ className = "" }: { className?: string }) {
  return (
    <svg className={`pencil-line ${className}`} viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
      <path data-pencil d="M2 7 C 60 4, 110 9, 160 6 S 250 4, 298 7" />
    </svg>
  );
}
