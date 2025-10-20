

import express from "express";
import checkJwt from "../Middlewares/checkJwt.js";
import {
  createOrder,
  getUserOrders,
  getOrderById,
} from "../controllers/orderController.js";

const router = express.Router();

// CREATE order (after successful payment)
router.post("/", checkJwt, createOrder);

// GET all orders for authenticated user
router.get("/", checkJwt, getUserOrders);

// GET single order by ID
router.get("/:id", checkJwt, getOrderById);

export default router