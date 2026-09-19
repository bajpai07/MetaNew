import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import Wordmark from "./Wordmark";
import { Rules, Close } from "./Marks";

/**
 * The header.
 *
 * Wordmark left, sections centred, actions right — and almost nothing else.
 * No containers, no pills, no icon set. The only three marks in the whole
 * application are the drawer rules, the close cross and the back arrow, and
 * only the first two appear here.
 *
 * Over the homepage hero it is transparent, so the campaign image runs to the
 * very top of the screen; once the hero has passed it settles onto ink. That
 * is driven by an IntersectionObserver watching a sentinel the homepage
 * renders — no scroll listener, and on every other page the sentinel simply
 * doesn't exist, so the header stays solid and those screens are untouched.
 */

const SECTIONS = [
  { label: "New", to: "/" },
  { label: "Collections", to: "/#collection" },
  { label: "Women", to: "/?category=Women" },
  { label: "Men", to: "/?category=Men" },
  { label: "Fitting Room", to: "/#fitting" }
];

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [overHero, setOverHero] = useState(location.pathname === "/");

  const isHome = location.pathname === "/";

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isDrawerOpen]);

  // Transparent only while the homepage hero is still behind the bar.
  //
  // This was an IntersectionObserver twice, and twice it left the header in
  // the wrong state — once never firing at all, once reporting the opposite of
  // what was on screen, which put bone navigation on the bone catalogue. It is
  // now a plain scroll comparison: the hero's own height against how far down
  // the page we are. Read inside a rAF so it costs nothing per scroll event.
  useEffect(() => {
    if (!isHome) {
      setOverHero(false);
      return;
    }

    // One rect read per scroll event, called straight rather than through
    // requestAnimationFrame. rAF was skipping in some environments, which left
    // the bar stuck in its over-hero state and put bone navigation on the bone
    // catalogue. A single getBoundingClientRect is cheap enough to do directly,
    // and React drops the update when the value has not changed.
    const measure = function () {
      const hero = document.querySelector("header.hero");
      if (!hero) {
        setOverHero(false);
        return;
      }
      setOverHero(hero.getBoundingClientRect().bottom > 80);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return function () {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [isHome, location.key]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    navigate(value.trim() ? `/?q=${encodeURIComponent(value)}` : "/");
  };

  const goToSection = (e, to) => {
    if (!to.includes("#")) return;
    const id = to.split("#")[1];
    if (location.pathname === "/") {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const tab = (label, to, active) => (
    <Link
      key={label}
      to={to}
      className="label"
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "var(--bone)" : "var(--ash)",
        transition: "color var(--d-micro) var(--ease-drape)"
      }}
    >
      {label}
    </Link>
  );

  return (
    <>
      <nav
        className={`site-head${overHero ? " site-head-over" : ""}`}
        style={{
          backgroundColor: overHero ? "transparent" : "#14110F",
          borderBottomColor: overHero ? "transparent" : "rgba(237,231,222,0.10)"
        }}
      >
        {/* Left: the way in and the way to look. The section list that used to
            run across the middle has moved into the drawer — the centre of the
            bar now carries the name and nothing else. */}
        <div className="site-head-left">
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              marginLeft: "-14px",
              color: "inherit"
            }}
          >
            <Rules />
          </button>

          <button
            className="head-link"
            onClick={() => setIsSearchOpen((v) => !v)}
            aria-expanded={isSearchOpen}
            style={{ minHeight: "44px" }}
          >
            Search
          </button>
        </div>

        {/* The masthead. One AIYAASI, dead centre, at the very top of the
            screen — on every page and over the hero as well. */}
        <Link to="/" aria-label="AIYAASI, home" className="head-brand">
          <Wordmark className="head-mark" />
        </Link>

        <div className="site-head-right">
          <Link to={user ? "/orders" : "/login"} className="head-link head-wide">
            {user ? "Account" : "Sign in"}
          </Link>

          <Link to="/cart" className="head-link" style={{ minHeight: "44px", display: "flex", alignItems: "center" }}>
            Bag{cartCount > 0 ? ` (${cartCount})` : ""}
          </Link>
        </div>
      </nav>

      {isSearchOpen && (
        <div className="gutter head-searchrow">
          <input
            className="field"
            autoFocus
            placeholder="Search the collection"
            value={searchTerm}
            onChange={handleSearch}
            aria-label="Search the collection"
          />
        </div>
      )}

      {/* Drawer */}
      <div
        onClick={closeDrawer}
        aria-hidden={!isDrawerOpen}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(14,12,11,0.72)",
          opacity: isDrawerOpen ? 1 : 0,
          pointerEvents: isDrawerOpen ? "auto" : "none",
          transition: "opacity var(--d-state) var(--ease-drape)"
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            width: "min(84%, 340px)",
            height: "100%",
            background: "var(--ink-raised)",
            borderRight: "1px solid var(--veil)",
            transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform var(--d-state) var(--ease-drape)",
            display: "flex",
            flexDirection: "column",
            padding: "24px var(--gutter) 40px",
            color: "var(--bone)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "32px" }}>
            <Wordmark size={16} />
            <button onClick={closeDrawer} aria-label="Close menu" style={{ padding: "13px", margin: "-13px", color: "var(--bone)" }}>
              <Close />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {SECTIONS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                onClick={(e) => { goToSection(e, to); closeDrawer(); }}
                className="display display-m"
                style={{ padding: "10px 0", color: "var(--bone)" }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="rule" style={{ margin: "32px 0 28px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <Link to="/history" onClick={closeDrawer} className="label" style={{ color: "var(--bone)" }}>
              Your looks
            </Link>
            {user && (
              <Link to="/orders" onClick={closeDrawer} className="label" style={{ color: "var(--bone)" }}>
                Orders
              </Link>
            )}
            {user?.role === "seller" && (
              <Link to="/seller/dashboard" onClick={closeDrawer} className="label" style={{ color: "var(--bone)" }}>
                Seller
              </Link>
            )}
            {user?.role === "admin" && (
              <Link to="/admin" onClick={closeDrawer} className="label" style={{ color: "var(--bone)" }}>
                Administration
              </Link>
            )}
            {user ? (
              <button onClick={() => { logout(); closeDrawer(); }} className="label" style={{ color: "var(--ash)", textAlign: "left" }}>
                Sign out
              </button>
            ) : (
              <Link to="/login" onClick={closeDrawer} className="label" style={{ color: "var(--ash)" }}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile tab bar — four words, no icons */}
      <div
        className="mobile-only"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "calc(var(--tab-h) + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "var(--ink)",
          borderTop: "1px solid var(--veil)",
          display: "flex",
          zIndex: 100
        }}
      >
        {tab("Shop", "/", location.pathname === "/")}
        {tab("Looks", "/history", location.pathname === "/history")}
        {tab("Orders", "/orders", location.pathname === "/orders")}
        {tab(cartCount > 0 ? `Bag (${cartCount})` : "Bag", "/cart", location.pathname === "/cart")}
      </div>
    </>
  );
}
