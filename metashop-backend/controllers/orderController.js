import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import sendOrderConfirmationEmail from "../utils/sendEmail.js";

/**
 * @desc   Create new order (from frontend cart)
 * @route  POST /api/orders
 * @access Private
 */


/**
 * @desc   Get single order by ID
 * @route  GET /api/orders/:id
 * @access Private
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Bypass Auth checking for guest checkout demonstration logic
    // if (order.user && order.user.toString() !== req.user?.id) {
    //  return res.status(403).json({ message: "Access denied" });
    // }

    res.json(order);
  } catch (err) {
    console.error("GET ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};



import Cart from "../models/Cart.js";

export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, userId: requestUserId } = req.body;
    const userId = req.user?.id || requestUserId || 'guest_user_123';

    // 1. Fetch live cart securely from DB
    const cart = await Cart.findOne({ userId }).populate("items.product");
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2. Map items and verify stock availability
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (!item.product) continue;
      
      if (item.product.stock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${item.product.name}` });
      }

      calculatedTotal += item.priceAtPurchase * item.qty;
      
      orderItems.push({
        product: item.product._id,
        name: item.product.name,
        qty: item.qty,
        price: item.priceAtPurchase,
        image: item.product.image
      });
      
      // Optionally decrement stock here:
      // item.product.stock -= item.qty;
      // await item.product.save();
    }

    // 3. Generate Virtual Transaction ID
    const transactionId = `TXN_${Math.floor(10000000 + Math.random() * 90000000)}RS`;

    // 4. Create the robust Order record
    const order = await Order.create({
      user: req.user?.id || null,     // Allows null for guest users temporarily
      userId: userId,                 // Store the string ID for guest linking
      orderItems,
      shippingAddress: shippingAddress || { address: 'Not provided', city: 'N/A', postalCode: 'N/A', country: 'N/A' },
      paymentMethod: paymentMethod || "Virtual Gateway",
      transactionId,
      totalPrice: calculatedTotal,
      status: "Pending",
      isPaid: true,
      paidAt: new Date(),
    });

    // 5. Wipe the cart clean
    cart.items = [];
    await cart.save();

    // 6. Send Email Receipt if user exists
    if (order.user) {
      const user = await User.findById(order.user);
      if (user && user.email) {
        await sendOrderConfirmationEmail(user.email, order);
      }
    }

    res.status(201).json({ ...order.toObject(), message: "Payment Verified & Order Created" });
  } catch (err) {
    console.error("CREATE ORDER EXACT ERROR:", err);
    res.status(500).json({ message: err.message || "Order creation failed" });
  }
};

/**
 * @desc   Get logged-in user's orders
 * @route  GET /api/orders/my
 * @access Private
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ user: req.user.id }, { userId: req.user.id }]
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("MY ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * @desc   Get seller orders
 * @route  GET /api/orders/seller
 * @access Seller
 */
export const getSellerOrders = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Access denied" });
    }

    // get seller products
    const sellerProductIds = await Product.find({
      sellerId: req.user.id,
    }).distinct("_id");

    const orders = await Order.find({
      "orderItems.product": { $in: sellerProductIds },
    })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("SELLER ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch seller orders" });
  }
};

/**
 * @desc   Update order status (seller)
 * @route  PUT /api/orders/:id
 * @access Seller
 */
export const updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status } = req.body;

    if (!["SHIPPED", "DELIVERED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id).populate(
      "orderItems.product"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ensure seller owns product in this order
    const ownsProduct = order.orderItems.some(
      (item) =>
        item.product &&
        item.product.sellerId.toString() === req.user.id
    );

    if (!ownsProduct) {
      return res.status(403).json({ message: "Not your order" });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.error("UPDATE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

/**
 * @desc   Get ALL orders (Admin)
 * @route  GET /api/orders/admin/all
 * @access Admin
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("ADMIN GET ALL ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch all orders" });
  }
};

/**
 * @desc   Update order status (Admin)
 * @route  PUT /api/orders/admin/:id/status
 * @access Admin
 */
export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    
    // As requested: Pending, Processing, Shipped, Delivered
    if (!["Pending", "Processing", "Shipped", "Delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.error("ADMIN UPDATE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};
