/**
 * Public company, people, and waitlist facts used by the launch site.
 * Keep this file the source of truth so links and claims cannot drift.
 */

export const PREBASE_LINKEDIN = "https://www.linkedin.com/company/prebase";

export type Founder = {
  name: string;
  role: string;
  linkedin: string;
  /** Real photograph only. Omit until a genuine asset exists. */
  photoSrc?: string;
  photoAlt?: string;
};

export const FOUNDERS: readonly Founder[] = [
  {
    name: "David Fan",
    role: "Co-founder",
    linkedin: "https://www.linkedin.com/in/david-fan-3a5a66313/",
    photoSrc: "/team/david-fan.jpg",
    photoAlt: "David Fan",
  },
  {
    name: "Vybhav Parthan",
    role: "Co-founder",
    linkedin: "https://www.linkedin.com/in/vybhavp/",
    photoSrc: "/team/vybhav-parthan.jpg",
    photoAlt: "Vybhav Parthan",
  },
];

/** Hidden spam trap. Never shown as a real website field. */
export const WAITLIST_HONEYPOT_FIELD = "website";

export const COPYRIGHT_YEAR = 2026;
