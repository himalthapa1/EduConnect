import mongoose from "mongoose";
import GroupMessage from "../models/GroupMessage.js";
import StudyGroup from "../models/StudyGroup.js";
import User from "../models/User.js";
import { upload } from "../middleware/upload.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

/* =========================
   HELPERS
========================= */
const getUserObjectId = (req) => {
  if (!req.user?.userId) return null;
  return new mongoose.Types.ObjectId(req.user.userId);
};

/* =========================
   MESSAGE CRUD
========================= */

// Get messages for a group (with pagination)
export const getGroupMessages = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied: Not a group member" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await GroupMessage.find({ groupId })
      .populate('senderId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Reverse to show oldest first
    messages.reverse();

    const totalMessages = await GroupMessage.countDocuments({ groupId });
    const hasMore = totalMessages > skip + messages.length;

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          hasMore
        }
      }
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};

// Send a text message
export const sendTextMessage = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied: Not a group member" });
    }

    const message = await GroupMessage.create({
      groupId,
      senderId: userId,
      content: content.trim(),
      type: 'text'
    });

    // Populate sender info for response
    await message.populate('senderId', 'username email');

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Send text message error:', error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

// Send a voice message
export const sendVoiceMessage = [
  upload.single("audio"),
  async (req, res) => {
    try {
      const userId = getUserObjectId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { groupId } = req.params;
      const { content = "Voice message" } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }

      // Check if user is a member of the group
      const group = await StudyGroup.findById(groupId);
      if (!group) {
        if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ message: "Group not found" });
      }

      if (!group.isMember(userId)) {
        if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(403).json({ message: "Access denied: Not a group member" });
      }

      const message = await GroupMessage.create({
        groupId,
        senderId: userId,
        content: content.trim(),
        type: 'voice',
        audioUrl: `uploads/${req.file.filename}`
      });

      // Populate sender info for response
      await message.populate('senderId', 'username email');

      res.status(201).json({
        success: true,
        data: { message }
      });
    } catch (error) {
      console.error('Send voice message error:', error);
      if (req.file?.path) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
      res.status(500).json({ message: "Failed to send voice message", error: error.message });
    }
  }
];

// Create a poll
export const createPoll = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;
    const { question, options } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ message: "Poll question is required" });
    }

    if (!options || !Array.isArray(options) || options.length < 2 || options.length > 10) {
      return res.status(400).json({ message: "Poll must have 2-10 options" });
    }

    // Validate options
    const validOptions = options.filter(opt =>
      typeof opt === 'string' && opt.trim().length > 0 && opt.trim().length <= 100
    );

    if (validOptions.length !== options.length) {
      return res.status(400).json({ message: "All options must be non-empty strings (max 100 chars)" });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied: Not a group member" });
    }

    const pollOptions = validOptions.map(text => ({
      text: text.trim(),
      votes: []
    }));

    const message = await GroupMessage.create({
      groupId,
      senderId: userId,
      content: question.trim(),
      type: 'poll',
      pollData: {
        question: question.trim(),
        options: pollOptions
      }
    });

    // Populate sender info for response
    await message.populate('senderId', 'username email');

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ message: "Failed to create poll", error: error.message });
  }
};

// Vote in a poll
export const voteInPoll = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { messageId, optionIndex } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const optionIdx = parseInt(optionIndex);
    if (isNaN(optionIdx) || optionIdx < 0) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.type !== 'poll') {
      return res.status(400).json({ message: "Message is not a poll" });
    }

    // Check if user is a member of the group
    const group = await StudyGroup.findById(message.groupId);
    if (!group || !group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied: Not a group member" });
    }

    // Add vote
    await message.addVote(userId, optionIdx);

    // Get updated poll results
    const results = message.getPollResults();

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    console.error('Vote in poll error:', error);
    res.status(500).json({ message: "Failed to vote in poll", error: error.message });
  }
};

// Delete a message (only sender or group admin)
export const deleteMessage = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is a member of the group
    const group = await StudyGroup.findById(message.groupId);
    if (!group || !group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied: Not a group member" });
    }

    // Check permissions: sender or group admin
    const canDelete = message.senderId.equals(userId) || group.isAdmin(userId);
    if (!canDelete) {
      return res.status(403).json({ message: "Only message sender or group admin can delete messages" });
    }

    // Delete audio file if it exists
    if (message.type === 'voice' && message.audioUrl) {
      const filePath = path.join(UPLOADS_DIR, path.basename(message.audioUrl));
      await fs.promises.unlink(filePath).catch(() => {});
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: "Failed to delete message", error: error.message });
  }
};