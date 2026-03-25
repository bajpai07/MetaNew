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
      <nav className="sticky top-0 z-50 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 h-14 flex items-center justify-between px-4 md:px-8 max-w-screen-xl mx-auto text-white">
        {/* Left: Mobile Hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden flex flex-col justify-center items-center w-11 h-11 space-y-1.5"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Menu"
          >
            <span className="block w-5 h-0.5 bg-white"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </button>
          
          <Link to="/" className="font-display font-bold text-xl md:text-2xl tracking-widest uppercase text-white">
            MetaShop
          </Link>
        </div>

        {/* Center/Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 h-full">
          {["Men", "Women", "Kids", "Beauty"].map(cat => (
            <Link 
              key={cat} 
              to={`/?category=${cat}`} 
              className="text-xs uppercase tracking-widest font-medium hover:text-rose transition-colors"
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
      <div className="md:hidden fixed bottom-0 left-0 w-full h-[calc(60px+env(safe-area-inset-bottom))] bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] flex items-center justify-around z-50 shadow-[0_-5px_30px_rgba(0,0,0,0.4)]">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-95 space-y-1 ${location.pathname === '/' ? 'text-rose' : 'text-white/50'}`}>
          <svg width="22" height="22" fill={location.pathname === '/' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          <span className="text-[10px] font-bold tracking-wide">Home</span>
        </Link>
        <button onClick={() => { setIsMobileSearchOpen(true); window.scrollTo(0,0); }} className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-95 space-y-1 ${isMobileSearchOpen || location.pathname.includes('/search') ? 'text-rose' : 'text-white/50'}`}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isMobileSearchOpen || location.pathname.includes('/search') ? '2.5' : '1.5'} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.4-4.4"/></svg>
          <span className="text-[10px] font-bold tracking-wide">Search</span>
        </button>
        <Link to="/try-on" className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-95 space-y-1 ${location.pathname.includes('/try-on') ? 'text-rose' : 'text-white/50'}`}>
          <svg width="24" height="24" fill={location.pathname.includes('/try-on') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span className="text-[10px] font-bold tracking-wide">Try AI</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-95 relative space-y-1 ${location.pathname === '/cart' ? 'text-rose' : 'text-white/50'}`}>
          <div className="relative">
            <svg width="22" height="22" fill={location.pathname === '/cart' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose border border-black rounded-full"></span>}
          </div>
          <span className="text-[10px] font-bold tracking-wide">Bag</span>
        </Link>
      </div>
    </>
  );
}
