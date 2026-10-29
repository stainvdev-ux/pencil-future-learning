"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { contact, schools } from "@/content/site";

const AREAS = [...schools.map((s) => s.name), "Collaborations", "Institutional information"];

// The enquiry form from the copy. It is not connected to anything yet, and says so.
export default function ContactForm() {
  const params = useSearchParams();
  const asked = params.get("interest");
  const options = asked && !AREAS.includes(asked) ? [asked, ...AREAS] : AREAS;
  const [sent, setSent] = useState(false);
  const f = contact.fields;

  return (
    <form
      className="contact-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label>
        <span>{f.name}</span>
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        <span>{f.email}</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>{f.phone}</span>
        <input name="phone" type="tel" autoComplete="tel" />
      </label>
      <label>
        <span>{f.interest}</span>
        <select name="interest" defaultValue={asked ?? ""} required>
          <option value="" disabled>
            Choose one
          </option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <label className="is-wide">
        <span>{f.message}</span>
        <textarea name="message" rows={5} />
      </label>
      <label className="contact-consent is-wide">
        <input name="consent" type="checkbox" required />
        <span>{f.consent}</span>
      </label>
      <button type="submit" className="button is-primary is-large">
        Send enquiry
      </button>
      <p className="contact-status" role="status">
        {sent && "Thank you. Online enquiries are not connected yet, so nothing was sent. The official contact channels will be published soon."}
      </p>
    </form>
  );
}
