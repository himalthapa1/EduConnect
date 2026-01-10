import express from "express";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  removeMember,
  deleteGroup,
  listGroups,
  getMyGroups,
  getGroupById,
  getTagOptions,
  addResource,
  getResources,
  deleteResource,
  updateResource,
} from "../controllers/groupController.js";
import {
  getGroupMessages,
  sendTextMessage,
  sendVoiceMessage,
  createPoll,
  voteInPoll,
  deleteMessage,
} from "../controllers/groupMessageController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */
router.get("/list", listGroups);
router.get("/tag-options", getTagOptions);

/* =========================
   PROTECTED ROUTES
========================= */

// ⚠️ STATIC ROUTES FIRST
router.get("/my-groups", authenticateToken, getMyGroups);

router.post("/create", authenticateToken, createGroup);
router.post("/join/:groupId", authenticateToken, joinGroup);
router.post("/leave/:groupId", authenticateToken, leaveGroup);
router.delete("/:groupId/members/:memberId", authenticateToken, removeMember);
router.delete("/:groupId", authenticateToken, deleteGroup);


/* =========================
   GROUP MESSAGES
========================= */

// Get messages for a group
router.get("/:groupId/messages", authenticateToken, getGroupMessages);

// Send text message
router.post("/:groupId/messages/text", authenticateToken, sendTextMessage);

// Send voice message
router.post("/:groupId/messages/voice", authenticateToken, ...sendVoiceMessage);

// Create poll
router.post("/:groupId/messages/poll", authenticateToken, createPoll);

// Vote in poll
router.post("/:groupId/messages/:messageId/vote/:optionIndex", authenticateToken, voteInPoll);

// Delete message
router.delete("/:groupId/messages/:messageId", authenticateToken, deleteMessage);

// Resources
router.post("/:groupId/resources", authenticateToken, ...addResource);
router.get("/:groupId/resources", authenticateToken, getResources);
router.delete("/:groupId/resources/:resourceId", authenticateToken, deleteResource);
router.put("/:groupId/resources/:resourceId", authenticateToken, updateResource);

/* =========================
   DYNAMIC ROUTES LAST
========================= */

// ⚠️ MUST BE LAST
router.get("/:groupId", getGroupById);

export default router;
