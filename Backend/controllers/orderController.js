
import Order from "../Models/Order.js";
import Art from "../Models/artModel.js";

/**
 * Create a new order after successful payment
 */
export const createOrder = async (req, res) => {
  try {
    const { artId, reference, amount, quantity, paymentData } = req.body;
    const auth0Id = req.auth?.payload?.sub || req.user?.sub;

    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!artId || !reference || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "artId, reference, and amount are required" 
      });
    }

    // Get art details
    const art = await Art.findById(artId);
    if (!art) {
      return res.status(404).json({ success: false, message: "Art not found" });
    }

    // Check if order already exists (prevent duplicates)
    const existingOrder = await Order.findOne({ reference });
    if (existingOrder) {
      return res.status(200).json({ 
        success: true, 
        message: "Order already exists",
        order: existingOrder 
      });
    }

    // Create order with art details snapshot
    const order = await Order.create({
      auth0Id,
      artId,
      artDetails: {
        name: art.name,
        image: art.image,
        price: art.price,
        author: art.author,
        inventor: art.inventor,
        type: art.type,
      },
      reference,
      amount,
      quantity: quantity || 1,
      status: "success",
      paidAt: new Date(),
      paymentData,
    });

    // Update art quantity
    if (art.quantity > 0) {
      art.quantity -= quantity || 1;
      await art.save();
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all orders for a user
 */
export const getUserOrders = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.user?.sub;

    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await Order.find({ auth0Id })
      .populate("artId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.user?.sub;
    const { id } = req.params;

    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const order = await Order.findById(id).populate("artId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify ownership
    if (order.auth0Id !== auth0Id) {
      return res.status(403).json({ 
        success: false, 
        message: "Forbidden: You can only view your own orders" 
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
