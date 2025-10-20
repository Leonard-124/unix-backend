
import express from "express";
import checkJwt from "../Middlewares/checkJwt.js";
import {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount,
} from "../controllers/messageController.js";

const router = express.Router();

// Send message
router.post("/send", checkJwt, sendMessage);

// Get conversation with specific user
router.get("/conversation/:otherUserId", checkJwt, getConversation);

// Get all conversations
router.get("/conversations", checkJwt, getConversations);

// Mark messages as read
router.put("/read", checkJwt, markAsRead);

// Get unread count
router.get("/unread-count", checkJwt, getUnreadCount);

export default router;
