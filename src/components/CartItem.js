// src/components/CartItem.jsx
import React from "react";

export default function CartItem({ product, onRemove, onChangeQty }) {
  const qty = product.quantity || 1;

  return (
    <div className="cart-item">
      <img src={product.image || product.img || "/placeholder.jpg"} alt={product.name} />
      <div className="meta">
        <h4>{product.name}</h4>
        <div className="muted">₹{(product.price || 0).toFixed(2)}</div>

        <div className="controls">
          <div className="qty-controls">
            <button className="qty-btn" onClick={() => onChangeQty(qty - 1)}>−</button>
            <input
              className="qty-input"
              value={qty}
              onChange={(e) => onChangeQty(Number(e.target.value))}
            />
            <button className="qty-btn" onClick={() => onChangeQty(qty + 1)}>+</button>
          </div>

          <button className="link-btn" onClick={onRemove}>Remove</button>
        </div>
      </div>
    </div>
  );
}
