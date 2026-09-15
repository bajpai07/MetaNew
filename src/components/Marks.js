/**
 * The only three marks in the application.
 *
 * No icon library — a stock set shipped as-is is the fastest tell of a
 * templated build, and a luxury interface uses a fraction of the icons a SaaS
 * product does. Everything that could be a word is a word: Save, Search, Bag.
 *
 * These three survive because no word replaces them cleanly. All are drawn at
 * stroke-width 1 to match the stem weight of the body face at its UI sizes.
 */

export const Rules = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
    <path d="M1 5h16M1 9h11M1 13h16" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

export const Back = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17 9H1m0 0 6.5-6.5M1 9l6.5 6.5" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

export const Close = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
    <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);
