import Order from "../models/Order.js";

export const mockPayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: "Order already paid" });
    }

    // MOCK PAYMENT SUCCESS
    order.isPaid = true;
    order.paidAt = new Date();

    await order.save();

    res.json({
      message: "Payment successful (MOCK)",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: "Mock payment failed" });
  }
};
