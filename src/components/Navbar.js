import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      navigate(`/?q=${encodeURIComponent(value)}`);
    } else {
      navigate(`/`);
    }
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <nav 
        style={{
          height: '56px',
          background: 'var(--black)',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        {/* Left: Mobile Hamburger & Logo */}
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden flex flex-col justify-center items-center w-6 h-6 space-y-1.5"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Menu"
          >
            <span className="block w-5 h-[1.5px] bg-white"></span>
            <span className="block w-5 h-[1.5px] bg-white"></span>
            <span className="block w-5 h-[1.5px] bg-white"></span>
          </button>
          
          <Link 
            to="/" 
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '22px', 
              fontWeight: 600, 
              color: 'var(--white)', 
              letterSpacing: '0.06em' 
            }}
          >
            METASHOP
          </Link>
        </div>

        {/* Center/Desktop Menu */}
        <div className="hidden md:flex items-center gap-[24px] h-full">
          {["Men", "Women", "Kids"].map(cat => (
            <Link 
              key={cat} 
              to={`/?category=${cat}`} 
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                letterSpacing: '0.14em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase'
              }}
              className="hover:text-white transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-1 md:gap-4">
          <div className="hidden md:flex items-center border border-white/20 rounded-full px-4 py-1.5">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={handleSearch}
              className="outline-none text-sm w-48 bg-transparent text-white placeholder-white/50"
            />
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>

          <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="md:hidden flex items-center justify-center w-11 h-11 text-white">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.4-4.4"/></svg>
          </button>

          <Link to="/cart" className="relative flex items-center justify-center w-11 h-11 text-white">
             <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            {cartCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose rounded-full"></span>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile Inline Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden sticky top-14 z-40 bg-[#111] border-b border-white/10 px-4 py-3 flex items-center shadow-lg">
          <input 
            type="text" 
            placeholder="Search for products..." 
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-white/10 rounded-xl h-11 px-4 outline-none text-[13px] font-bold text-white placeholder:text-white/40 focus:ring-1 focus:ring-rose"
            autoFocus
          />
        </div>
      )}

      {/* Slide Drawer (Mobile) */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      >
        <div 
          className={`absolute top-0 left-0 w-[80%] max-w-[320px] h-full bg-[#111] text-white transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <span className="font-display font-bold text-2xl tracking-widest uppercase">MetaShop</span>
            <button onClick={closeDrawer} className="text-xl p-2 -mr-2 text-white">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              <span className="text-xs text-muted font-bold tracking-widest uppercase">Categories</span>
              {["Men", "Women", "Kids", "Beauty"].map(cat => (
                <Link 
                  key={cat} 
                  to={`/?category=${cat}`} 
                  onClick={closeDrawer}
                  className="text-[17px] font-bold uppercase tracking-[0.15em] hover:text-rose transition-colors py-1"
                >
                  {cat}
                </Link>
              ))}
            </div>

            <div className="w-full h-[1px] bg-white/10 my-2"></div>

            <div className="flex flex-col gap-4">
              <span className="text-xs text-white/50 font-bold tracking-widest uppercase">Account</span>
              {user?.role === 'seller' && <Link to="/seller/dashboard" onClick={closeDrawer} className="text-sm font-bold">Seller Dashboard</Link>}
              {user?.role === 'admin' && <Link to="/admin" onClick={closeDrawer} className="text-sm font-bold">Admin Controls</Link>}
              {user && <Link to="/orders" onClick={closeDrawer} className="text-sm font-bold">My Orders</Link>}
              
              {user ? (
                <button onClick={() => { logout(); closeDrawer(); }} className="text-sm text-left font-bold text-rose">Logout</button>
              ) : (
                <Link to="/login" onClick={closeDrawer} className="text-sm font-bold">Sign In / Register</Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Navigation (Mobile) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 w-full z-[100]"
        style={{
          height: 'calc(64px + env(safe-area-inset-bottom))',
          background: 'var(--black)',
          borderTop: '0.5px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <Link to="/" className="flex flex-col items-center justify-center gap-1 transition-transform active:scale-95" style={{ color: location.pathname === '/' ? 'var(--rose)' : 'var(--text-muted)' }}>
          <svg width="20" height="20" fill={location.pathname === '/' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span style={{ fontSize: '9px', letterSpacing: '0.1em', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>Home</span>
        </Link>
        <button onClick={() => { setIsMobileSearchOpen(true); window.scrollTo(0,0); }} className="flex flex-col items-center justify-center gap-1 transition-transform active:scale-95" style={{ color: isMobileSearchOpen || location.pathname.includes('/search') ? 'var(--rose)' : 'var(--text-muted)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={isMobileSearchOpen || location.pathname.includes('/search') ? '2.5' : '1.5'} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.4-4.4"/></svg>
          <span style={{ fontSize: '9px', letterSpacing: '0.1em', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>Search</span>
        </button>
        <Link to="/try-on" className="flex flex-col items-center justify-center gap-1 transition-transform active:scale-95" style={{ color: 'var(--rose)' }}>
          <svg width="20" height="20" fill={location.pathname.includes('/try-on') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 4.545V2m0 2.545l2.455-2.455M11 4.545l-2.455-2.455M11 15v2.545m0-2.545l2.455 2.455M11 15l-2.455 2.455M4.545 11H2m2.545 0L2 8.545M4.545 11l-2.455 2.455M18.455 11H21m-2.545 0l2.455-2.455M18.455 11l2.455 2.455"/></svg>
          <span style={{ fontSize: '9px', letterSpacing: '0.1em', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>Try AI</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 relative" style={{ color: location.pathname === '/cart' ? 'var(--rose)' : 'var(--text-muted)' }}>
          <div className="relative">
            <svg width="20" height="20" fill={location.pathname === '/cart' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--rose)] border border-[var(--black)] rounded-full"></span>}
          </div>
          <span style={{ fontSize: '9px', letterSpacing: '0.1em', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>Bag</span>
        </Link>
      </div>
    </>
  );
}
