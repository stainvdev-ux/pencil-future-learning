import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/schools", label: "Schools" },
  { href: "/programs", label: "Programs" },
  { href: "/campus", label: "Campus" },
  { href: "/admissions", label: "Admissions" },
];

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-logo" aria-label="Pencil Future Learning City, home">
        <span aria-hidden="true" />
      </Link>
      <nav aria-label="Main">
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link href="/contact" className="site-action">
        Enquire Now
      </Link>
    </header>
  );
}
