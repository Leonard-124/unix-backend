
import Message from "../Models/message.js";
import Users from "../Models/users.js";

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, artworkId } = req.body;
    const senderId = req.auth?.payload?.sub || req.user?.sub;

    if (!senderId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        message: "recipientId and content are required",
      });
    }

    const message = await Message.create({
      senderId,
      recipientId,
      content,
      artworkId: artworkId || null,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.auth?.payload?.sub || req.user?.sub;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("artworkId", "name image price");

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.auth?.payload?.sub || req.user?.sub;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sentMessages = await Message.find({ senderId: currentUserId })
      .distinct("recipientId");
    
    const receivedMessages = await Message.find({ recipientId: currentUserId })
      .distinct("senderId");

    const uniqueUserIds = [...new Set([...sentMessages, ...receivedMessages])];

    const conversations = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const user = await Users.findOne({ auth0Id: userId })
          .select("auth0Id username fullname avatar");

        const lastMessage = await Message.findOne({
          $or: [
            { senderId: currentUserId, recipientId: userId },
            { senderId: userId, recipientId: currentUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(1);

        const unreadCount = await Message.countDocuments({
          senderId: userId,
          recipientId: currentUserId,
          read: false,
        });

        return {
          user,
          lastMessage,
          unreadCount,
        };
      })
    );

    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || 0;
      const timeB = b.lastMessage?.createdAt || 0;
      return timeB - timeA;
    });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;
    const currentUserId = req.auth?.payload?.sub || req.user?.sub;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await Message.updateMany(
      { senderId, recipientId: currentUserId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.auth?.payload?.sub || req.user?.sub;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await Message.countDocuments({
      recipientId: currentUserId,
      read: false,
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
