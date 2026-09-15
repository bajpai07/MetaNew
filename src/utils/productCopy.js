/**
 * The cloth line.
 *
 * Every piece needs one line under its name saying what it is made of and how
 * it sits — the sentence a shop assistant would give you before you ask. It is
 * assembled from what the catalogue actually holds, in order of preference:
 *
 *   1. the explicit material and fit fields, when a seller supplied them
 *   2. failing that, the opening sentence of the product's own description
 *   3. failing that, nothing at all
 *
 * Rule three matters. There is no generic fallback string here on purpose:
 * "Premium quality fabric" under every piece is placeholder text wearing a
 * costume, and a line that says nothing is worse than no line.
 */
export function clothLine(product) {
  if (!product) return null;

  const stated = [product.material, product.fit].filter(Boolean).join(' · ');
  if (stated) return stated;

  const description = (product.description || '').trim();
  if (description) {
    const firstSentence = description.split(/(?<=\.)\s/)[0].trim();
    if (firstSentence.length > 3) {
      return firstSentence.replace(/\.$/, '');
    }
  }

  return null;
}

/** Prices are written the way they are spoken here: ₹2,400, not ₹2400.00 */
export function rupees(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `₹${n.toLocaleString('en-IN')}`;
}
