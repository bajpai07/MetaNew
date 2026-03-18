import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Always navigate to home to show search results if not already there
    if (value.trim()) {
      navigate(`/?q=${encodeURIComponent(value)}`);
    } else {
      navigate(`/`);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="brand">MetaShop</Link>
        <div className="nav-categories">
          <Link to="#">MEN</Link>
          <Link to="#">WOMEN</Link>
          <Link to="#">KIDS</Link>
          <Link to="#">HOME & LIVING</Link>
          <Link to="#">BEAUTY</Link>
          <Link to="#" className="studio-link">
            STUDIO <sup className="new-badge">NEW</sup>
          </Link>
        </div>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Search for products, brands and more" 
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="navlinks right-nav">
        {user?.role === 'seller' && (
          <Link to="/seller/dashboard" className="nav-action">
            <span className="icon">🏪</span>
            <span>Seller</span>
          </Link>
        )}

        {user?.role === 'admin' && (
          <Link to="/admin" className="nav-action">
            <span className="icon">🛡️</span>
            <span>Admin</span>
          </Link>
        )}

        {user && (
          <Link to="/orders" className="nav-action">
            <span className="icon">📦</span>
            <span>Orders</span>
          </Link>
        )}
        
        {user ? (
          <div className="nav-action" onClick={logout} style={{ cursor: 'pointer' }}>
            <span className="icon">👤</span>
            <span>Logout ({user.name.split(' ')[0]})</span>
          </div>
        ) : (
          <Link to="/login" className="nav-action">
            <span className="icon">👤</span>
            <span>Profile</span>
          </Link>
        )}
        
        <Link to="#" className="nav-action">
          <span className="icon">🤍</span>
          <span>Wishlist</span>
        </Link>

        <Link to="/cart" className="nav-action cart-action">
          <span className="icon">👜</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          <span>Bag</span>
        </Link>

        {!user && (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
