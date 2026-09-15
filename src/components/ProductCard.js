import { Link } from "react-router-dom";
import { useState } from "react";
import { rupees } from "../utils/productCopy";

/**
 * Merchandise, not a card. No radius, no shadow, no hover lift, no per-item
 * entrance delay, no discount badge, no wishlist heart, no "TRY ON" pill
 * floating over the image.
 *
 * The caption carries the two things a shop must always tell you: what the
 * piece is called and what it costs. Both were here before but set at the same
 * size in the same muted grey, which flattened them into one faint smudge and
 * read as an unfinished page. Now the name sits in bone at reading weight, the
 * price sits under it with its own tracking, and the old price — when there is
 * one — stays small and quiet beside it. Type size and colour do the work;
 * there is no border, badge or background anywhere near it.
 *
 * The photograph gets the catalogue treatment (.goods) and never the mat. The
 * mat presents a customer's own photograph and says "this one is yours"; the
 * goods need the opposite signal.
 *
 * `scale` lets a composition give one piece more weight than its neighbours —
 * the featured chapter on the homepage uses it to set a tall piece beside two
 * quieter ones. Everywhere else the default keeps the grid even.
 *
 * The caption takes its colour from whatever ground it is standing on rather
 * than naming one, so the same card reads correctly in the dark chapters and
 * on the bone catalogue without a second variant.
 */
export default function ProductCard({ product, scale = 'grid' }) {
  const [loaded, setLoaded] = useState(false);

  const price = Number(product.price || 0);
  const was = Number(product.mrp || product.originalPrice || 0);
  const reduced = was > price;

  // The featured chapter sets one piece taller than the two beside it, so the
  // composition never reads as a row of equal tiles.
  const feature = scale === "feature";

  return (
    <Link to={`/products/${product._id}`} style={{ display: "block" }}>
      <div className={`goods${feature ? " goods-feature" : ""}`}>
        {!loaded && <div className="loading-block" style={{ position: "absolute", inset: 0, zIndex: 2 }} />}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity var(--d-state) var(--ease-drape)"
          }}
        />
      </div>

      <div style={{ paddingTop: "16px" }}>
        <p className="goods-name">{product.name}</p>
        <p className="goods-price">
          {rupees(price)}
          {reduced && <span className="goods-was">{rupees(was)}</span>}
        </p>
      </div>
    </Link>
  );
}
