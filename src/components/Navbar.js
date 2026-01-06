import { Link } from "react-router-dom";
import useStore from "../store/useStore";
console.log("Navbar useStore:", useStore);
export default function Navbar() {
  const cartCount = useStore((s) => s.cartCount());
  const token = localStorage.getItem("token");

  return (
    <nav className="navbar">
      <div className="brand">MetaShop</div>

      <div className="navlinks">
        <Link to="/">Home</Link>
        <Link to="/cart">Cart ({cartCount})</Link>

        {token && (
          <Link to="/seller/dashboard">Seller Dashboard</Link>
        )}

        {!token && (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
