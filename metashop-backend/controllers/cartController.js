import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Get user cart
export const getCart = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId || 'guest_user_123';
    console.log(`🛒 [BACKEND] Fetching cart for user: ${userId}`);
    const cart = await Cart.findOne({ userId }).populate("items.product");
    
    if (cart) {
      const initialLength = cart.items.length;
      cart.items = cart.items.filter(i => i.product != null);
      if (cart.items.length !== initialLength) {
        await cart.save();
      }
    }
    
    res.json(cart || { items: [] });
  } catch (err) {
    console.error("Cart Fetch Error:", err);
    res.status(500).json({ message: "Error fetching cart", error: err.message });
  }
};

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    const userId = req.body.userId || 'guest_user_123';

    // Verify product exists and check stock
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.stock < qty) return res.status(400).json({ message: "Out of stock / Insufficient stock" });

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
      });
    }

    const existing = cart.items.find(
      (i) => i.product.toString() === productId
    );

    if (existing) {
      existing.qty += qty;
      existing.priceAtPurchase = product.price; // Update price snapshot to current
    } else {
      cart.items.push({
        product: productId,
        qty,
        priceAtPurchase: product.price,
      });
    }

    await cart.save();
    await cart.populate("items.product");
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart", error: err.message });
  }
};

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.body.userId || 'guest_user_123';
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = cart.items.filter(
        (i) => i.product?.toString() !== req.params.productId && i._id?.toString() !== req.params.productId
      );
      await cart.save();
      await cart.populate("items.product");
      res.json(cart);
    } else {
      res.status(404).json({ message: "Cart not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error removing item", error: err.message });
  }
};

// Update item quantity
export const updateCartItemQty = async (req, res) => {
  try {
    const productId = req.body.productId;
    const qty = req.body.qty !== undefined ? req.body.qty : req.body.quantity;
    const userId = req.body.userId || 'guest_user_123';

    if (qty < 1) return res.status(400).json({ message: "Quantity must be at least 1" });

    // Stock guard check via backend
    const product = await Product.findById(productId);
    if (!product) {
      // Product was deleted from DB but remains in UI. Self-heal by returning cleaned cart.
      let cart = await Cart.findOne({ userId }).populate("items.product");
      if (cart) {
        cart.items = cart.items.filter(i => i.product != null);
        await cart.save();
        return res.status(200).json(cart);
      }
      return res.status(404).json({ message: "Product not found" });
    }
    
    if (product.stock < qty) return res.status(400).json({ message: "Quantity exceeds available stock" });

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(i => i.product?.toString() === productId || i._id?.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].qty = qty;
      cart.items[itemIndex].priceAtPurchase = product.price; // Freshen the snapshot optionally
      await cart.save();
      // Repopulate explicitly to return full item data to the frontend
      await cart.populate("items.product");
      res.status(200).json(cart);
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error updating quantity", error: err.message });
  }
};
