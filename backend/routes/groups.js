import express from "express";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  listGroups,
  getMyGroups,
  getGroupById,
  getTagOptions,
  addResource,
  getResources,
  deleteResource,
  updateResource,
} from "../controllers/groupController.js";
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
// Note: updateGroup/deleteGroup endpoints not available in controller


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
