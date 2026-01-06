import Order from "../models/Order.js";
import Product from "../models/Product.js";

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

    // ensure user owns the order (or seller later if needed)
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    console.error("GET ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};



export const createOrder = async (req, res) => {
  try {
    const { orderItems, totalPrice } = req.body;

    // ✅ Validate cart coming from frontend
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = await Order.create({
      user: req.user.id,
      orderItems,
      totalPrice,
      status: "PLACED",
      isPaid: true,
      paidAt: new Date(),
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

/**
 * @desc   Get logged-in user's orders
 * @route  GET /api/orders/my
 * @access Private
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });

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
