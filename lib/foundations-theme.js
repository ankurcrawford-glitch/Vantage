// ─── Vantage Foundations — shared theme ──────────────────────────
// Single source of truth for the Foundations palette and fonts.
// Aligned with the senior-side brand colors (globals.css / #0B1320 navy,
// #C9A977 gold, #E8DDC9 cream) so the whole platform reads as one product.
// Ink discipline follows the house style: full cream for headlines,
// 68% for body, 45% for whispers; one cream hairline everywhere.

export const C = {
  navy: "#0B1320",        // page background (matches senior side)
  navyCard: "#101a2b",    // card surface (matches senior side)
  navyRaised: "#16223A",  // raised surface / inputs
  line: "rgba(232,221,201,0.12)",
  gold: "#C9A977",        // brand gold (matches senior side)
  goldSoft: "rgba(201,169,119,0.14)",
  ink: "#E8DDC9",         // cream text (matches senior side)
  inkDim: "rgba(232,221,201,0.68)",   // secondary text
  inkFaint: "rgba(232,221,201,0.45)", // tertiary / hint text
};

export const display = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
export const body = { fontFamily: "'Montserrat', sans-serif" };
