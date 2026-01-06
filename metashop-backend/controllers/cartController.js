import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Get user cart
export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
  res.json(cart || { items: [] });
};

// Add to cart
export const addToCart = async (req, res) => {
  const { productId, qty = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: [],
    });
  }

  const existing = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({
      product: productId,
      qty,
      price: product.currentPrice ?? product.basePrice,
    });
  }

  await cart.save();
  res.json(cart);
};

// Remove from cart
export const removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  cart.items = cart.items.filter(
    (i) => i.product.toString() !== req.params.productId
  );
  await cart.save();
  res.json(cart);
};
