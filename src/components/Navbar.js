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
          {/* MEN */}
          <div className="nav-item-wrapper">
            <Link to="/?category=Men">Men</Link>
            <div className="mega-menu">
              <div className="mega-menu-column">
                <h4>Topwear</h4>
                <Link to="/?category=Men&q=T-Shirts">T-Shirts</Link>
                <Link to="/?category=Men&q=Shirts">Casual Shirts</Link>
                <Link to="/?category=Men&q=Formal">Formal Shirts</Link>
                <Link to="/?category=Men&q=Sweatshirts">Sweatshirts</Link>
                <Link to="/?category=Men&q=Jackets">Jackets</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Bottomwear</h4>
                <Link to="/?category=Men&q=Jeans">Jeans</Link>
                <Link to="/?category=Men&q=Trousers">Casual Trousers</Link>
                <Link to="/?category=Men&q=Formal+Trousers">Formal Trousers</Link>
                <Link to="/?category=Men&q=Shorts">Shorts</Link>
                <Link to="/?category=Men&q=Track+Pants">Track Pants</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Footwear</h4>
                <Link to="/?category=Men&q=Sneakers">Sneakers</Link>
                <Link to="/?category=Men&q=Casual+Shoes">Casual Shoes</Link>
                <Link to="/?category=Men&q=Formal+Shoes">Formal Shoes</Link>
                <Link to="/?category=Men&q=Sandals">Sandals</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Accessories</h4>
                <Link to="/?category=Men&q=Watches">Watches</Link>
                <Link to="/?category=Men&q=Backpacks">Backpacks</Link>
                <Link to="/?category=Men&q=Belts">Belts</Link>
                <Link to="/?category=Men&q=Ties">Ties</Link>
                <Link to="/?category=Men&q=Wallets">Wallets</Link>
              </div>
            </div>
          </div>

          {/* WOMEN */}
          <div className="nav-item-wrapper">
            <Link to="/?category=Women">Women</Link>
            <div className="mega-menu">
              <div className="mega-menu-column">
                <h4>Indian Wear</h4>
                <Link to="/?category=Women&q=Kurtas">Kurtas & Suits</Link>
                <Link to="/?category=Women&q=Dresses">Ethnic Dresses</Link>
                <Link to="/?category=Women&q=Lehengas">Lehengas</Link>
                <Link to="/?category=Women&q=Sarees">Sarees</Link>
                <Link to="/?category=Women&q=Jackets">Jackets</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Western Wear</h4>
                <Link to="/?category=Women&q=Dresses">Dresses</Link>
                <Link to="/?category=Women&q=Tops">Tops</Link>
                <Link to="/?category=Women&q=Tshirts">Tshirts</Link>
                <Link to="/?category=Women&q=Jeans">Jeans</Link>
                <Link to="/?category=Women&q=Trousers">Trousers & Capris</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Footwear</h4>
                <Link to="/?category=Women&q=Flats">Flats</Link>
                <Link to="/?category=Women&q=Heels">Heels</Link>
                <Link to="/?category=Women&q=Boots">Boots</Link>
                <Link to="/?category=Women&q=Shoes">Sports Shoes</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Beauty</h4>
                <Link to="/?category=Women&q=Makeup">Makeup</Link>
                <Link to="/?category=Women&q=Skincare">Skincare</Link>
                <Link to="/?category=Women&q=Lipsticks">Lipsticks</Link>
                <Link to="/?category=Women&q=Fragrances">Fragrances</Link>
              </div>
            </div>
          </div>

          {/* KIDS */}
          <div className="nav-item-wrapper">
            <Link to="/?category=Kids">Kids</Link>
            <div className="mega-menu">
              <div className="mega-menu-column">
                <h4>Boys Clothing</h4>
                <Link to="/?category=Kids&q=T-Shirts">T-Shirts</Link>
                <Link to="/?category=Kids&q=Shirts">Shirts</Link>
                <Link to="/?category=Kids&q=Shorts">Shorts</Link>
                <Link to="/?category=Kids&q=Jeans">Jeans</Link>
                <Link to="/?category=Kids&q=Ethnic">Ethnic Wear</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Girls Clothing</h4>
                <Link to="/?category=Kids&q=Dresses">Dresses</Link>
                <Link to="/?category=Kids&q=Tops">Tops</Link>
                <Link to="/?category=Kids&q=Tshirts">Tshirts</Link>
                <Link to="/?category=Kids&q=Jeans">Jeans</Link>
                <Link to="/?category=Kids&q=Ethnic">Ethnic Wear</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Footwear</h4>
                <Link to="/?category=Kids&q=Casual">Casual Shoes</Link>
                <Link to="/?category=Kids&q=Flipflops">Flipflops</Link>
                <Link to="/?category=Kids&q=Sports">Sports Shoes</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Infants</h4>
                <Link to="/?category=Kids&q=Rompers">Rompers</Link>
                <Link to="/?category=Kids&q=Sets">Sets & Suits</Link>
                <Link to="/?category=Kids&q=Tshirts">Tshirts</Link>
              </div>
            </div>
          </div>

          {/* BEAUTY */}
          <div className="nav-item-wrapper">
            <Link to="/?category=Beauty">Beauty</Link>
            <div className="mega-menu">
              <div className="mega-menu-column">
                <h4>Makeup</h4>
                <Link to="/?category=Beauty&q=Lipstick">Lipstick</Link>
                <Link to="/?category=Beauty&q=Nail">Nail Polish</Link>
                <Link to="/?category=Beauty&q=Eyeshadow">Eyeshadow</Link>
                <Link to="/?category=Beauty&q=Foundation">Foundation</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Skincare</h4>
                <Link to="/?category=Beauty&q=Wash">Face Wash</Link>
                <Link to="/?category=Beauty&q=Moisturizer">Moisturizer</Link>
                <Link to="/?category=Beauty&q=Sunscreen">Sunscreen</Link>
                <Link to="/?category=Beauty&q=Masks">Masks</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Haircare</h4>
                <Link to="/?category=Beauty&q=Shampoo">Shampoo</Link>
                <Link to="/?category=Beauty&q=Conditioner">Conditioner</Link>
                <Link to="/?category=Beauty&q=Oil">Hair Oil</Link>
                <Link to="/?category=Beauty&q=Color">Hair Color</Link>
              </div>
              <div className="mega-menu-column">
                <h4>Fragrances</h4>
                <Link to="/?category=Beauty&q=Perfumes">Perfumes</Link>
                <Link to="/?category=Beauty&q=Deodorants">Deodorants</Link>
                <Link to="/?category=Beauty&q=Mist">Body Mist</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="navlinks right-nav">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        {user?.role === 'seller' && (
          <Link to="/seller/dashboard" className="nav-action">
            <span>Seller</span>
          </Link>
        )}

        {user?.role === 'admin' && (
          <Link to="/admin" className="nav-action">
            <span>Admin</span>
          </Link>
        )}

        {user && (
          <Link to="/orders" className="nav-action">
            <span>Orders</span>
          </Link>
        )}
        
        {user ? (
          <div className="nav-action" onClick={logout} style={{ cursor: 'pointer' }}>
            <span>Logout</span>
          </div>
        ) : (
          <Link to="/login" className="nav-action">
            <span>Log In</span>
          </Link>
        )}
        
        <Link to="/cart" className="nav-action cart-action">
          <span>Bag {cartCount > 0 && `(${cartCount})`}</span>
          {cartCount > 0 && <span className="cart-badge"></span>}
        </Link>
      </div>
    </nav>
  );
}
