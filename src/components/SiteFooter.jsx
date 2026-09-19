import { Link } from "react-router-dom";
import Wordmark from "./Wordmark";

/**
 * The last page of the publication, not a sitemap.
 *
 * Three columns, no rules between them, no social icon set, no newsletter
 * box shouting for an address. Every link goes somewhere that actually
 * exists in this application — nothing here is decorative navigation.
 */
export default function SiteFooter() {
  const scrollTo = (id) => () =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="site-foot gutter">
      <div className="foot-cols" style={{ width: "min(100%, 1440px)", marginInline: "auto" }}>
        <div>
          <Wordmark variant="display" style={{ fontSize: "clamp(22px, 3.4vw, 34px)", display: "block", marginBottom: "20px" }} />
          <p className="meta measure" style={{ maxWidth: "26ch" }}>
            Pieces chosen slowly, and seen on you before you decide.
          </p>
        </div>

        <nav className="foot-list" aria-label="Shop">
          <button onClick={scrollTo("collection")}>Collection</button>
          <button onClick={scrollTo("fitting")}>Fitting Room</button>
          <Link to="/?category=Women">Women</Link>
          <Link to="/?category=Men">Men</Link>
        </nav>

        <nav className="foot-list" aria-label="Your account">
          <Link to="/history">Your looks</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/cart">Bag</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </div>

      <div
        className="rule"
        style={{ width: "min(100%, 1440px)", marginInline: "auto", marginBlock: "clamp(40px, 6vh, 64px) 22px" }}
      />

      <p className="meta" style={{ width: "min(100%, 1440px)", marginInline: "auto" }}>
        © {new Date().getFullYear()} AIYAASI
      </p>
    </footer>
  );
}
