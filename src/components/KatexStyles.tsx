"use client";
import 'katex/dist/katex.min.css';

/**
 * Lazy-loaded KaTeX CSS provider.
 * Import this component only in pages that render math formulas.
 * This avoids loading 25KB+ of KaTeX CSS on every page (login, home, etc.).
 */
export default function KatexStyles() {
  return null;
}
