import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=800&q=80";

/**
 * The bag is the last dark room before the paperwork. Hairline-ruled rows, no
 * cards, no radius. Removed: the three emoji trust badges under the action
 * ("🔒 Secure checkout · ↩ Easy returns · 🚚 Fast delivery") — a shop that has
 * to reassure you it is secure has already lost the argument.
 */
export default function Cart() {
  const { cartItems: contextCartItems, removeFromCart, updateQty } = useCart();
  const navigate = useNavigate();

  const cartItems = (Array.isArray(contextCartItems) ? contextCartItems : []).map((item) => {
    const product = item.product || item;
    const prodId = typeof product === "object" && product !== null ? product._id : product;
    return {
      _id: item._id,
      product_id: prodId || item.product_id || item.productId,
      name: product.name || item.name || "Product",
      image: product.image || item.image || FALLBACK_IMAGE,
      price: Number(item.priceAtPurchase || product.price || item.price || 0),
      mrp: Number(
        product.originalPrice ||
          Math.round((item.priceAtPurchase || product.price || item.price || 0) * 1.5)
      ),
      quantity: item.qty || item.quantity || 1,
      size: item.size || product.size || null,
      color: item.color || product.color || null,
      maxStock: product.stock > 0 ? product.stock : 10
    };
  });

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const delivery = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const totalSavings = cartItems.reduce(
    (acc, item) => acc + (item.mrp - item.price) * item.quantity,
    0
  );
  const finalTotal = subtotal + delivery;

  const decreaseQty = async (item) => {
    if (item.quantity > 1) {
      try {
        await toast.promise(updateQty(item.product_id, item.quantity - 1), {
          loading: "Updating",
          success: "Bag updated",
          error: (e) => e.response?.data?.message || "Couldn't update the bag"
        });
      } catch (e) {}
    }
  };

  const increaseQty = async (item) => {
    if (item.quantity < item.maxStock) {
      try {
        await toast.promise(updateQty(item.product_id, item.quantity + 1), {
          loading: "Updating",
          success: "Bag updated",
          error: (e) => e.response?.data?.message || "Couldn't update the bag"
        });
      } catch (e) {}
    } else {
      toast.error(`Only ${item.maxStock} left`);
    }
  };

  const handleRemove = async (item) => {
    try {
      await toast.promise(removeFromCart(item.product_id), {
        loading: "Removing",
        success: "Removed from bag",
        error: "Couldn't remove that"
      });
    } catch (e) {}
  };

  if (cartItems.length === 0) {
    return (
      <div className="page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <h1 className="display display-l" style={{ marginBottom: "14px" }}>
          Your bag is empty
        </h1>
        <p className="meta measure" style={{ marginBottom: "36px" }}>
          Nothing put aside yet.
        </p>
        <button className="textlink" onClick={() => navigate("/")}>
          Browse the collection
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page has-dock">
        <div
          className="gutter"
          style={{
            paddingTop: "34px",
            paddingBottom: "24px",
            display: "flex",
            alignItems: "baseline",
            gap: "14px"
          }}
        >
          <h1 className="display display-l">Your bag</h1>
          <span className="meta">
            {cartItems.length} {cartItems.length === 1 ? "piece" : "pieces"}
          </span>
        </div>

        <div className="rule" />

        <div className="gutter">
          {cartItems.map((item) => (
            <div
              key={item._id || item.product_id}
              style={{
                display: "flex",
                gap: "20px",
                padding: "24px 0",
                borderBottom: "1px solid var(--veil)"
              }}
            >
              <div className="goods" style={{ width: "96px", flexShrink: 0 }}>
                <img src={item.image} alt={item.name} />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "var(--t-s)", marginBottom: "6px" }}>{item.name}</p>
                  {(item.size || item.color) && (
                    <p className="meta" style={{ marginBottom: "6px" }}>
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p style={{ fontSize: "var(--t-s)" }}>
                    ₹{item.price.toLocaleString("en-IN")}
                    {item.mrp > item.price && (
                      <span style={{ marginLeft: "10px", color: "var(--ash)", textDecoration: "line-through" }}>
                        ₹{item.mrp.toLocaleString("en-IN")}
                      </span>
                    )}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "16px",
                    gap: "16px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => decreaseQty(item)}
                      aria-label={`Reduce quantity of ${item.name}`}
                      style={{ width: "44px", height: "44px", marginLeft: "-14px", color: "var(--bone)" }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: "22px", textAlign: "center", fontSize: "var(--t-s)" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increaseQty(item)}
                      aria-label={`Increase quantity of ${item.name}`}
                      style={{ width: "44px", height: "44px", color: "var(--bone)" }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item)}
                    className="label"
                    style={{ color: "var(--ash)", minHeight: "44px" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="gutter" style={{ paddingTop: "30px", maxWidth: "520px" }}>
          {[
            ["Subtotal", `₹${subtotal.toLocaleString("en-IN")}`],
            ["Delivery", delivery === 0 ? "Complimentary" : `₹${delivery}`],
            totalSavings > 0 ? ["Reduced by", `₹${totalSavings.toLocaleString("en-IN")}`] : null
          ]
            .filter(Boolean)
            .map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  fontSize: "var(--t-s)"
                }}
              >
                <span style={{ color: "var(--ash)" }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}

          <div className="rule" style={{ margin: "12px 0" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingTop: "6px"
            }}
          >
            <span className="label" style={{ color: "var(--ash)" }}>Total</span>
            <span className="display display-m">₹{finalTotal.toLocaleString("en-IN")}</span>
          </div>

          {subtotal > 0 && subtotal < 499 && (
            <p className="meta" style={{ marginTop: "18px" }}>
              ₹{499 - subtotal} more for complimentary delivery.
            </p>
          )}

          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", marginTop: "36px" }}>
            <input className="field" placeholder="Coupon code" aria-label="Coupon code" style={{ flex: 1 }} />
            <button className="label" style={{ color: "var(--ash)", minHeight: "44px" }}>
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="dock">
        <button
          className="btn btn-bone"
          style={{ width: "100%" }}
          onClick={() => navigate("/checkout")}
        >
          Continue to checkout — ₹{finalTotal.toLocaleString("en-IN")}
        </button>
      </div>
    </>
  );
}
