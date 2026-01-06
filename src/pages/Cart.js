import useStore from "../store/useStore";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const cart = useStore((s) => s.cart);
  const remove = useStore((s) => s.removeFromCart);
  const updateQty = useStore((s) => s.updateQty);
  const total = useStore((s) => s.cartTotal());

  const navigate = useNavigate();

  if (cart.length === 0) {
    return <h2>Your cart is empty</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Shopping Cart</h2>

      {cart.map((item) => (
        <div key={item._id} style={{ marginBottom: "10px" }}>
          <h4>{item.name}</h4>
          <p>₹{item.price}</p>

          <input
            type="number"
            min="1"
            value={item.qty}
            onChange={(e) =>
              updateQty(item._id, Number(e.target.value))
            }
          />

          <button onClick={() => remove(item._id)}>
            Remove
          </button>
        </div>
      ))}

      <h3>Total: ₹{total}</h3>

      <button
        style={{ marginTop: "20px" }}
        onClick={() => navigate("/checkout")}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
