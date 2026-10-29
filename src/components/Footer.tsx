import Link from "next/link";
import { contact, nav } from "@/content/site";

export default function Footer() {
  return (
    <footer className="site-footer" data-theme="dark">
      <div className="footer-logo" role="img" aria-label="Pencil Future Learning City, Calicut" />
      <nav aria-label="Footer">
        <ul>
          {nav.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
      <div className="footer-contact">
        <p>{contact.place}</p>
        <p>{contact.body}</p>
      </div>
      <p className="footer-legal">
        © 2026 Pencil Future Learning City. Programs shown are proposed unless explicitly marked as open for admissions.
      </p>
    </footer>
  );
}
