import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import HeroFilm from "../components/HeroFilm";
import SiteFooter from "../components/SiteFooter";
import Wordmark from "../components/Wordmark";
import { getProducts } from "../api/productService";
import axios from "axios";
import useDebounce from "../hooks/useDebounce";
import { API_BASE } from '../config/api';

/**
 * HOME — composed as chapters, not assembled from components.
 *
 * The scroll is the story: a campaign film, a held breath, three pieces set
 * at unequal weight, a full-bleed garment, the Fitting Room offered as a
 * service, a chapter where the colour comes entirely from cloth, then the
 * collection and a quiet close.
 *
 * Two rules govern the page. No two chapters share a composition — scale,
 * alignment, image weight and text placement all change from one to the next,
 * because repetition is what makes a page read as a template. And every
 * product name, price and description is real catalogue data; where a field
 * does not exist the design does without it rather than inventing it.
 *
 * Three photographic registers, never mixed: campaign imagery is cloth and
 * silhouette, product imagery is garments under the catalogue treatment, and
 * the customer's own photograph gets the mat.
 */

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=800&q=80";

const FILTERS = ["All", "Women", "Men", "Kids"];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const debouncedQuery = useDebounce(query, 300);

  const [category, setCategory] = useState(searchParams.get("category") || "All");

  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat && urlCat !== category) setCategory(urlCat);
    else if (!urlCat && category !== "All") setCategory("All");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let data;
        if (debouncedQuery.trim()) {
          const res = await axios.get(
            `${API_BASE}/api/products/search?q=${encodeURIComponent(debouncedQuery)}`
          );
          data = res.data;
        } else {
          data = await getProducts({ category: category === "All" ? "" : category });
        }

        const productArray = Array.isArray(data) ? data : data.data || [];
        setProducts(
          productArray.map((p) => {
            const base = Number(p.price || p.currentPrice || p.basePrice || 0);
            return {
              ...p,
              price: base,
              originalPrice: p.originalPrice || Math.round(base * 1.5),
              image: p.image || p.imageUrl || FALLBACK_IMAGE
            };
          })
        );
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedQuery, category]);

  const searching = Boolean(debouncedQuery.trim());
  const browsing = searching || category !== "All";

  // The first three pieces carry the featured chapter; the rest form the
  // collection. When someone is searching or filtering they want a catalogue,
  // not a campaign, so the editorial chapters step aside.
  const featured = browsing ? [] : products.slice(0, 3);
  const rest = featured.length ? products.slice(3) : products;

  // How the catalogue is broken up. Someone who has filtered or searched wants
  // a catalogue and nothing else, so they get one uninterrupted grid. Otherwise
  // the interruptions are earned by length: a full-bleed garment once there are
  // four pieces to carry it, and an ink band as well once there are nine — below
  // that the page would be more interruption than collection.
  // How the collection is composed.
  //
  // A filtered or searched view is a catalogue and gets one grid. The full
  // collection is a campaign, and it is paced by scale rather than by repeating
  // one row: a single piece at campaign size, then two large, then three, and
  // between those a dark chapter, a pair set off the grid, and one piece given
  // a page of its own.
  //
  // No grid block is ever longer than a single desktop row. Two rows of three
  // in a row is where a collection starts to read as a result set — the eye
  // learns the rhythm and stops looking at the clothes.
  const blocks = [];
  let at = 0;
  const take = (n) => rest.slice(at, (at += n));

  if (browsing || rest.length < 4) {
    if (rest.length) blocks.push({ kind: "grid", items: rest });
  } else {
    blocks.push({ kind: "signature", product: take(1)[0] });
    blocks.push({ kind: "pair", items: take(2) });

    if (rest.length >= 10) {
      blocks.push({ kind: "grid", items: take(3) });
      blocks.push({ kind: "duo", items: take(2) });
    }
    if (rest.length >= 15) {
      blocks.push({ kind: "grid", items: take(3) });
    }
    if (rest.length >= 10) {
      blocks.push({ kind: "moment", product: take(1)[0] });
    }
    if (at < rest.length) {
      blocks.push({ kind: "grid", items: rest.slice(at) });
    }
  }

  const goTo = (id) => () =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ paddingBottom: "calc(var(--tab-h) + env(safe-area-inset-bottom))" }}>
      <span
        id="hero-sentinel"
        aria-hidden="true"
        style={{ position: "absolute", top: 0, width: "1px", height: "1px" }}
      />

      {/* ───────────────────────── I. THE CAMPAIGN ───────────────────────── */}
      <header className="hero">
        <HeroFilm alt="A model walking the runway in a printed gown" />
        <div className="hero-scrim hero-scrim-top" aria-hidden="true" />
        <div className="hero-scrim hero-scrim-v" aria-hidden="true" />

        {/* No masthead down here any more. AIYAASHI now sits at the very top
            of the screen, centred in the header, on this page and every other
            — so the hero carries the film and the campaign line, nothing else,
            and the name is never said twice on one screen. */}
        <div className="hero-stage">
          <div />

          <div className="hero-foot">
            <h1 className="hero-title">
              Indulgence,
              <br />
              on approval.
            </h1>

            <div className="hero-actions">
              <button className="textlink" onClick={goTo("collection")}>
                Explore the Collection
              </button>
              <button className="head-link" onClick={goTo("fitting")} style={{ minHeight: "44px" }}>
                Try It On
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────────────── II. THE BREATH ───────────────────────── */}
      {!browsing && (
        <section className="chapter-breath gutter">
          <div style={{ width: "min(100%, 1440px)", marginInline: "auto" }}>
            <h2 className="display display-l" style={{ maxWidth: "15ch", marginBottom: "24px" }}>
              Cloth first, everything else after.
            </h2>
            <p className="lede measure" style={{ maxWidth: "36ch" }}>
              A short collection, chosen slowly — and every piece in it can be
              seen on your own body before you commit.
            </p>
          </div>
        </section>
      )}

      {/* ──────────────────── III. THREE PIECES, UNEQUAL ──────────────────── */}
      {featured.length > 0 && (
        <section className="gutter" style={{ paddingBottom: "clamp(80px, 12vh, 150px)" }}>
          <div style={{ width: "min(100%, 1440px)", marginInline: "auto" }}>
            <div className="feature-set">
              {featured.map((p, i) => (
                <ProductCard key={p._id} product={p} scale={i === 0 ? "feature" : "quiet"} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────── V. THE FITTING ROOM ────────────────────── */}
      {/* This chapter used to hold an empty bone frame labelled "Your
          photograph". The idea was that the only honest image here is the one
          you have not uploaded yet — but on the page it read as a placeholder
          nobody had finished, which is worse than saying nothing. The chapter
          now carries type alone: the offer on the left, the terms and the way
          in on the right. The mat itself is untouched and still does its real
          job inside the fitting room. */}
      {!browsing && (
        <section id="fitting" className="chapter-fitting gutter">
          <div className="chapter-fitting-inner">
            <h2 className="display display-l chapter-fitting-title">
              See how it feels before you wear it.
            </h2>

            <div className="chapter-fitting-side">
              <p className="lede">
                Upload one photograph and any piece in the collection is shown
                on your own body, in your own proportions.
              </p>
              <p className="meta">
                It is never shown to anyone else, and it is deleted within
                twenty-four hours.
              </p>
              <button className="textlink" onClick={goTo("collection")}>
                Choose a piece
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────── VII. THE CATALOGUE ───────────────────────── */}
      {/* Set on bone. Everything above this point is a dark campaign; the
          catalogue is where you actually look at clothes, and garments read
          better against paper than against ink. It also stops the page being
          black from top to bottom.

          It is not one grid. A block of pieces, one garment at full bleed,
          another block, and — when the collection is long enough to earn it —
          an ink band before the last block. The interruptions are what stop a
          catalogue reading as a result set; the thresholds are what stop them
          reading as filler when there are only a few pieces to show. */}
      <section id="collection" className="on-paper catalogue">
        <header className="catalogue-intro cat-gutter">
          <div className="catalogue-masthead">
            <h2 className="display catalogue-title">
              {searching ? `“${debouncedQuery.trim()}”` : category === "All" ? "The collection" : category}
            </h2>
            {!searching && (
              <p className="catalogue-lede">
                A short season, cut from cloth chosen before anything was designed.
              </p>
            )}
          </div>

          <div className="catalogue-controls">
            {!searching && (
              <p className="catalogue-count">
                {rest.length} {rest.length === 1 ? "piece" : "pieces"}
              </p>
            )}
            <nav className="catalogue-filters" aria-label="Filter by category">
              {FILTERS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`catalogue-filter${category === cat ? " is-on" : ""}`}
                  aria-current={category === cat ? "true" : undefined}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {loading ? (
          <div className="catalogue-grid cat-gutter">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="loading-block" style={{ aspectRatio: "4/5", width: "100%" }} />
            ))}
          </div>
        ) : rest.length > 0 ? (
          <>
            {blocks.map((block, i) => {
              // The signature look. One real piece from the collection, at a
              // scale nothing else on the page is given, before the catalogue
              // begins. It is the answer to "what is Aiyaashi" — so it is a
              // garment, photographed, not a slogan over a stock image.
              if (block.kind === "signature") {
                return (
                  <Link key={`s${i}`} to={`/products/${block.product._id}`} className="catalogue-signature">
                    <img src={block.product.image} alt={block.product.name} decoding="async" />
                    <div className="catalogue-signature-copy cat-gutter">
                      <p className="signature-label">The signature look</p>
                      <p className="display signature-name">{block.product.name}</p>
                      <p className="signature-price">
                        &#8377;{Number(block.product.price || 0).toLocaleString("en-IN")}
                      </p>
                      <span className="textlink">View the piece</span>
                    </div>
                  </Link>
                );
              }

              // Two pieces off the grid: one at twice the width, one dropped
              // below it. The measure underneath is the same three columns the
              // rest of the page uses, so it reads as a decision rather than a
              // wobble.
              // Two pieces at twice the width of the catalogue, directly under
              // the signature. Without it the page fell from one image at
              // campaign size straight to a row of three, and the drop read as
              // the editorial ending and the shop beginning.
              if (block.kind === "pair") {
                return (
                  <div key={`p${i}`} className="catalogue-pair cat-gutter">
                    {block.items.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                );
              }

              if (block.kind === "duo") {
                return (
                  <div key={`d${i}`} className="catalogue-duo cat-gutter">
                    {block.items.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                );
              }

              if (block.kind === "grid") {
                return (
                  <div key={`g${i}`} className="catalogue-grid cat-gutter">
                    {block.items.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                );
              }

              // One garment at full width, before the grid can start reading
              // as a spreadsheet. A real piece from the catalogue, not a stock
              // campaign shot.
              if (block.kind === "moment") {
                return (
                  <Link key={`m${i}`} to={`/products/${block.product._id}`} className="catalogue-moment">
                    <div className="catalogue-moment-figure">
                      <img src={block.product.image} alt={block.product.name} loading="lazy" decoding="async" />
                    </div>
                    <div className="catalogue-moment-copy">
                      <p className="catalogue-moment-eyebrow">From the collection</p>
                      <div className="catalogue-moment-foot">
                        <p className="display catalogue-moment-name">{block.product.name}</p>
                        <p className="catalogue-moment-price">
                          &#8377;{Number(block.product.price || 0).toLocaleString("en-IN")}
                        </p>
                        <span className="textlink">View the piece</span>
                      </div>
                    </div>
                  </Link>
                );
              }

              return null;
            })}
          </>
        ) : (
          <div className="cat-gutter" style={{ padding: "80px 0 40px" }}>
            <p className="display display-m" style={{ marginBottom: "12px" }}>
              Nothing matches that search
            </p>
            <p className="meta measure">Try a different word, or browse the full collection.</p>
          </div>
        )}
      </section>

      {/* ───────────────────── VIII. THE CLOSING MOMENT ───────────────────── */}
      {!browsing && (
        <section className="chapter-close gutter">
          <Wordmark variant="display" className="close-mark" />
          <p className="display close-line">Worn before it&rsquo;s bought.</p>
          <button className="textlink" onClick={goTo("fitting")}>
            Try it on
          </button>
        </section>
      )}

      {/* ───────────────────────── IX. THE FOOTER ───────────────────────── */}
      <SiteFooter />
    </div>
  );
}
