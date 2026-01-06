import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";
import API from "../api/api";

export default function Checkout() {
  console.log("CHECKOUT COMPONENT RENDERED");

  const navigate = useNavigate();
  const cart = useStore((s) => s.cart);
  const total = useStore((s) => s.cartTotal());
  const clearCart = useStore((s) => s.clearCart);

  console.log("CHECKOUT CART:", cart);
  console.log("CHECKOUT CART LENGTH:", cart.length);

  const placeOrder = async () => {
    if (!cart || cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      const orderItems = cart.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        image: item.image,
        product: item._id, // must be PRODUCT id
      }));

      const res = await API.post("/orders", {
        orderItems,
        totalPrice: total,
      });

      clearCart();
      navigate(`/order-success/${res.data._id}`);
    } catch (err) {
      console.error("ORDER ERROR FULL:", err);
      console.error("RESPONSE:", err.response?.data);
      alert(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        "Order failed"
      );
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Checkout</h2>

      {cart.map((item) => (
        <div key={item._id}>
          {item.name} × {item.qty}
        </div>
      ))}

      <h3>Total: ₹{total}</h3>

      <button onClick={placeOrder}>Place Order</button>
    </div>
  );
}
