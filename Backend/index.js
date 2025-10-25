
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
//import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./Database/db.js";

import paystackRouter from "./Routes/paystackroute2.js";
import artRoutes from "./Routes/artRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import orderRoutes from "./Routes/orderRoutes.js";
import feedbackRoute from "./Routes/feedbackroute.js";
import messageRoutes from "./Routes/messageRoute.js"; // ADD THIS

dotenv.config();

const app = express();

// Collect allowed origins from env
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.LOCAL_URL,
  process.env.ALT_LOCAL_URL,
].filter(Boolean); // removes undefined

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/", (req, res) => {
  res.send("Welcome to Unix guys");
});

// Routes
app.use("/api/art", artRoutes);
app.use("/api/payments/paystack", paystackRouter);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/feedback", feedbackRoute);
app.use("/api/messages", messageRoutes); // ADD THIS

// Server start
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log("Allowed origins:", allowedOrigins);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
/////////////////////////////////////////////////////////////

// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import morgan from "morgan";
// import { createServer } from "http";
// import { Server } from "socket.io";
// import { connectDB } from "./Database/db.js";

// import paystackRouter from "./Routes/paystackroute2.js";
// import artRoutes from "./Routes/artRoutes.js";
// import userRoutes from "./Routes/userRoutes.js";
// import orderRoutes from "./Routes/orderRoutes.js";
// import feedbackRoute from "./Routes/feedbackroute.js";
// import messageRoutes from "./Routes/messageRoute.js"; // ADD THIS

// dotenv.config();

// const app = express();
// const httpServer = createServer(app); // CHANGED: Create HTTP server

// // Collect allowed origins from env
// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   process.env.LOCAL_URL,
//   process.env.ALT_LOCAL_URL,
// ].filter(Boolean);

// // CORS for Express
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//   })
// );

// // Socket.IO setup - ADD THIS ENTIRE SECTION
// const io = new Server(httpServer, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// app.use(express.json());
// app.use(morgan("dev"));

// // Make io accessible to routes - ADD THIS
// app.set("io", io);

// // Health check
// app.get("/", (req, res) => {
//   res.send("Welcome to Unix guys");
// });

// // Routes
// app.use("/api/art", artRoutes);
// app.use("/api/payments/paystack", paystackRouter);
// app.use("/api/users", userRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/feedback", feedbackRoute);
// app.use("/api/messages", messageRoutes); // ADD THIS

// // Socket.IO connection handling - ADD THIS ENTIRE SECTION
// const onlineUsers = new Map();

// io.on("connection", (socket) => {
//   console.log("✅ User connected:", socket.id);

//   socket.on("user:join", (auth0Id) => {
//     onlineUsers.set(auth0Id, socket.id);
//     socket.auth0Id = auth0Id;
//     console.log(`👤 User ${auth0Id} is online`);
//     socket.emit("user:connected", { auth0Id });
//   });

//   socket.on("message:send", async (data) => {
//     const { recipientId, senderId, content, artworkId } = data;
//     console.log(`📨 Message from ${senderId} to ${recipientId}`);

//     const recipientSocketId = onlineUsers.get(recipientId);
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("message:receive", {
//         _id: Date.now().toString(),
//         senderId,
//         recipientId,
//         content,
//         artworkId,
//         timestamp: new Date(),
//         read: false,
//       });
      
//       socket.emit("message:delivered", {
//         recipientId,
//         delivered: true,
//       });
//     } else {
//       socket.emit("message:delivered", {
//         recipientId,
//         delivered: false,
//         offline: true,
//       });
//     }
//   });

//   socket.on("typing:start", ({ recipientId, senderId }) => {
//     const recipientSocketId = onlineUsers.get(recipientId);
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("typing:user", { senderId, typing: true });
//     }
//   });

//   socket.on("typing:stop", ({ recipientId, senderId }) => {
//     const recipientSocketId = onlineUsers.get(recipientId);
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("typing:user", { senderId, typing: false });
//     }
//   });

//   socket.on("disconnect", () => {
//     if (socket.auth0Id) {
//       onlineUsers.delete(socket.auth0Id);
//       console.log(`👋 User ${socket.auth0Id} disconnected`);
//     }
//     console.log("❌ User disconnected:", socket.id);
//   });
// });

// // Server start - CHANGED: Use httpServer instead of app
// const PORT = process.env.PORT || 3000;

// async function start() {
//   try {
//     await connectDB();
//     httpServer.listen(PORT, () => {
//       console.log(`✅ Server is running on http://localhost:${PORT}`);
//       console.log("✅ Socket.IO is ready");
//       console.log("Allowed origins:", allowedOrigins);
//     });
//   } catch (err) {
//     console.error("❌ Failed to start server:", err);
//     process.exit(1);
//   }
// }

// start();
////////////////////////////////////////////////////////////////////////////////
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import morgan from "morgan";
// import serverless from "serverless-http";
// import { connectDB } from "./Database/db.js";

// import paystackRouter from "./Routes/paystackroute2.js";
// import artRoutes from "./Routes/artRoutes.js";
// import userRoutes from "./Routes/userRoutes.js";
// import orderRoutes from "./Routes/orderRoutes.js";
// import feedbackRoute from "./Routes/feedbackroute.js";
// //import messageRoutes from "./Routes/messageRoute.js";

// dotenv.config();

// const app = express();

// // Allowed origins
// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   process.env.LOCAL_URL,
//   process.env.ALT_LOCAL_URL,
// ].filter(Boolean);

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true); // allow Postman/curl
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
//     console.warn("❌ Blocked by CORS:", origin);
//     return callback(null, false);
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// // Apply CORS before routes
// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

// app.use(express.json());
// app.use(morgan("dev"));

// // Debug incoming origins
// app.use((req, res, next) => {
//   console.log("🌍 Incoming Origin:", req.headers.origin);
//   console.log("✅ Allowed Origins:", allowedOrigins);
//   next();
// });

// // Health check
// app.get("/", (req, res) => {
//   res.send("Welcome to Unix guys (serverless mode, safe from path-to-regexp)");
// });

// // ✅ Always mount routers with relative paths only
// app.use("/api/art", artRoutes);
// app.use("/api/payments/paystack", paystackRouter);
// app.use("/api/users", userRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/feedback", feedbackRoute);
// //app.use("/api/messages", messageRoutes);

// // Lazy DB connection (serverless-friendly)
// let isConnected = false;
// app.use(async (req, res, next) => {
//   if (!isConnected) {
//     try {
//       await connectDB();
//       isConnected = true;
//       console.log("✅ Database connected");
//     } catch (err) {
//       console.error("❌ Database connection failed:", err);
//       return res.status(500).json({ error: "Database connection failed" });
//     }
//   }
//   next();
// });

// // Export as serverless handler
// export const handler = serverless(app);
