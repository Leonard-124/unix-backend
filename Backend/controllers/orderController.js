
// import Order from "../Models/Order.js";
// import Art from "../Models/artModel.js";


// //Admin bypass
// // Add your Auth0 user ID(s) to .env:  ADMIN_AUTH0_IDS=auth0|abc,auth0|xyz
// const ADMIN_IDS = (process.env.ADMIN_AUTH0_ID, process.env.ADMIN2_AUTH0_IDS ||"" ).split(",").map(id => id.trim()).filter(Boolean);
// const isAdmin = (auth0Id) => ADMIN_IDS.includes(auth0Id);

// /**
//  * Create a new order after successful payment
//  */
// export const createOrder = async (req, res) => {
//   try {
//     const { artId, reference, amount, quantity, paymentData } = req.body;
//     const auth0Id = req.auth?.payload?.sub || req.user?.sub;

//     if (!auth0Id) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     if (!artId || !reference || !amount) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "artId, reference, and amount are required" 
//       });
//     }

//     // Get art details
//     const art = await Art.findById(artId);
//     if (!art) {
//       return res.status(404).json({ success: false, message: "Art not found" });
//     }

//     // Check if order already exists (prevent duplicates)
//     const existingOrder = await Order.findOne({ reference });
//     if (existingOrder) {
//       return res.status(200).json({ 
//         success: true, 
//         message: "Order already exists",
//         order: existingOrder 
//       });
//     }

//     // Create order with art details snapshot
//     const order = await Order.create({
//       auth0Id,
//       artId,
//       artDetails: {
//         name: art.name,
//         image: art.image,
//         price: art.price,
//         author: art.author,
//         inventor: art.inventor,
//         type: art.type,
//       },
//       reference,
//       amount,
//       quantity: quantity || 1,
//       status: "success",
//       paidAt: new Date(),
//       paymentData,
//     });

//     // Update art quantity
//     if (art.quantity > 0) {
//       art.quantity -= quantity || 1;
//       await art.save();
//     }

//     res.status(201).json({ success: true, order });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// /**
//  * Get all orders for a user
//  */
// export const getUserOrders = async (req, res) => {
//   try {
//     const auth0Id = req.auth?.payload?.sub || req.user?.sub;

//     if (!auth0Id) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const orders = await Order.find({ auth0Id })
//       .populate("artId")
//       .sort({ createdAt: -1 });

//     res.status(200).json({ success: true, orders });
//   } catch (error) {
//     console.error("Error fetching orders:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// /**
//  * Get a single order by ID
//  */
// export const getOrderById = async (req, res) => {
//   try {
//     const auth0Id = req.auth?.payload?.sub || req.user?.sub;
//     const { id } = req.params;

//     if (!auth0Id) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const order = await Order.findById(id).populate("artId");

//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     // Verify ownership
//     if (order.auth0Id !== auth0Id && !isAdmin(id)) { /// Only allow users/admin to view their own orders
//       return res.status(403).json({ 
//         success: false, 
//         message: "Forbidden: You can only view your own orders" 
//       });
//     }

//     res.status(200).json({ success: true, order });
//   } catch (error) {
//     console.error("Error fetching order:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

////////////////////////////////////////////////////////////

import Order from "../Models/Order.js";
import Art from "../Models/artModel.js";

// ✅ Bug 1 Fixed: comma operator was silently discarding ADMIN_AUTH0_ID.
// (process.env.A, process.env.B) evaluates to just B — A is thrown away.
// Use template literals or array join to combine both env vars.
const ADMIN_IDS = [
  ...(process.env.ADMIN_AUTH0_ID || "").split(","),
  ...(process.env.ADMIN2_AUTH0_IDS || "").split(","),
]
  .map((id) => id.trim())
  .filter(Boolean);

const isAdmin = (auth0Id) => ADMIN_IDS.includes(auth0Id);

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
        message: "artId, reference, and amount are required",
      });
    }

    const art = await Art.findById(artId);
    if (!art) {
      return res.status(404).json({ success: false, message: "Art not found" });
    }

    const existingOrder = await Order.findOne({ reference });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already exists",
        order: existingOrder,
      });
    }

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
      quantity: quantity || 1, // </>
      status: "success", // </>
      paidAt: new Date(), // </>
      paymentData, // </>
    });

    if (art.quantity > 0) {
      art.quantity -= quantity || 1; // why
      await art.save();
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all orders for a user (admins get ALL orders)
 */
export const getUserOrders = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.user?.sub;

    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Bug 2 Fixed: admins were never given access to all orders here.
    // Admins now get every order; regular users only get their own.
    const query = isAdmin(auth0Id) ? {} : { auth0Id };

    const orders = await Order.find(query)
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
    const { id } = req.params;  // This is the ORDER id

    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const order = await Order.findById(id).populate("artId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ✅ Bug 3 Fixed: isAdmin(id) was checking the ORDER id instead of the
    // requester's Auth0 id. Admin check must use auth0Id, not the route param.
    if (order.auth0Id !== auth0Id && !isAdmin(auth0Id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only view your own orders",
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};