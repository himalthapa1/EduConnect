import mongoose from "mongoose";
import StudyGroup from "../models/StudyGroup.js";
import GroupResource from "../models/GroupResource.js";
import User from "../models/User.js";
import { upload } from "../middleware/upload.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Predefined tag options for semantic tagging
export const TAG_OPTIONS = {
  topics: [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'Artificial Intelligence',
    'English',
    'History',
    'Economics',
    'Psychology',
    'Business',
    'Finance',
    'Law',
    'Medicine',
    'Engineering',
    'Design',
    'Photography',
    'Music',
    'Languages',
    'Other'
  ],
  level: [
    'beginner',
    'intermediate',
    'advanced'
  ],
  styles: [
    'discussion-based',
    'problem-solving',
    'project-based',
    'daily-practice',
    'lecture-review',
    'peer-teaching',
    'exam-prep',
    'interview-prep'
  ],
  commitment: [
    'short-term',
    'long-term',
    'weekly-sessions',
    'daily-study',
    'sprint-based'
  ]
};

/* =========================
   PATH SETUP
========================= */
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
   GROUP CRUD
========================= */

export const createGroup = async (req, res) => {
  try {
    // Debug: log incoming payload and user
    console.log("createGroup payload:", req.body);
    console.log("createGroup user:", req.user);

    // Validate userId existence and type
    const rawUserId = req.user?.userId;
    if (!rawUserId || typeof rawUserId !== "string" || !mongoose.Types.ObjectId.isValid(rawUserId)) {
      console.error("Invalid userId:", rawUserId);
      return res.status(401).json({ message: "Unauthorized: Invalid userId" });
    }
    const userId = new mongoose.Types.ObjectId(rawUserId);

    // Validate required fields
    const { name, description, subject, tags, maxMembers, isPublic } = req.body;
    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof subject !== "string" ||
      !name.trim() ||
      !description.trim() ||
      !subject.trim()
    ) {
      return res.status(400).json({ message: "Missing required fields: name, description, and subject are required" });
    }

    // Validate semantic tags
    if (!tags || typeof tags !== 'object') {
      return res.status(400).json({ message: "Tags object is required" });
    }

    if (!tags.level || typeof tags.level !== 'string') {
      return res.status(400).json({ message: "Skill level is required" });
    }

    if (!TAG_OPTIONS.level.includes(tags.level)) {
      return res.status(400).json({ message: "Invalid skill level" });
    }

    if (tags.topics && !Array.isArray(tags.topics)) {
      return res.status(400).json({ message: "Topics must be an array" });
    }

    if (tags.topics && tags.topics.length > 3) {
      return res.status(400).json({ message: "Maximum 3 topics allowed" });
    }

    // Validate tag options exist in predefined lists
    if (tags.topics) {
      for (const topic of tags.topics) {
        if (!TAG_OPTIONS.topics.includes(topic)) {
          return res.status(400).json({ message: `Invalid topic: ${topic}` });
        }
      }
    }

    if (tags.styles) {
      for (const style of tags.styles) {
        if (!TAG_OPTIONS.styles.includes(style)) {
          return res.status(400).json({ message: `Invalid style: ${style}` });
        }
      }
    }

    if (tags.commitment) {
      for (const commitment of tags.commitment) {
        if (!TAG_OPTIONS.commitment.includes(commitment)) {
          return res.status(400).json({ message: `Invalid commitment: ${commitment}` });
        }
      }
    }

    const groupData = {
      name: name.trim(),
      description: description.trim(),
      subject: subject.trim(),
      tags: {
        topics: tags.topics || [],
        level: tags.level,
        styles: tags.styles || [],
        commitment: tags.commitment || []
      },
      // Legacy compatibility
      difficulty: tags.level,
      subjectTags: tags.topics || [],
      tag: tags.level, // Use level as fallback color tag
      creator: userId,
      maxMembers: typeof maxMembers === "number" ? maxMembers : 50,
      isPublic: typeof isPublic === "boolean" ? isPublic : true,
      members: [userId],
    };

    const group = await StudyGroup.create(groupData);

    res.status(201).json({ success: true, data: { group } });
  } catch (err) {
    console.error("createGroup error:", err);
    if (err.stack) console.error(err.stack);
    res.status(500).json({ message: "Failed to create group", error: err.message });
  }
};

export const listGroups = async (_, res) => {
  try {
    const groups = await StudyGroup.find()
      .populate("creator", "username email")
      .populate("members", "username");
    res.json({ success: true, data: { groups } });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch groups" });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const groups = await StudyGroup.find({ members: userId })
      .populate("creator", "username email")
      .populate("members", "username");

    res.json({ success: true, data: { groups } });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your groups" });
  }
};

export const getGroupById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await StudyGroup.findById(req.params.groupId)
      .populate("creator", "username email")
      .populate("members", "username");

    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json({ success: true, data: { group } });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group" });
  }
};

export const getTagOptions = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        tagOptions: TAG_OPTIONS
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tag options" });
  }
};

/* =========================
   MEMBERSHIP
========================= */

export const joinGroup = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Check if group exists first
    const group = await StudyGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is already a member
    const isMember = group.members.some((m) => m.equals(userId));
    if (isMember) {
      return res.status(400).json({ message: "User is already a member of this group" });
    }

    // Atomic update to add member without triggering full document validation
    await StudyGroup.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: userId } }
    );

    // Update user tracking for recommendations
    await User.findByIdAndUpdate(userId, {
      $addToSet: { joinedGroups: group._id },
      $inc: { activityScore: 10 } // Joining group increases activity
    });

    // Update group activity score (find fresh document to avoid validation issues)
    const updatedGroup = await StudyGroup.findById(groupId);
    await updatedGroup.updateActivityScore();

    res.json({ success: true, message: "Joined group successfully" });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: "Failed to join group", error: error.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = getUserObjectId(req);

    // Early validation
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if group exists first
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is actually a member
    const isMember = group.members.some((m) => m.equals(userId));
    if (!isMember) {
      return res.status(400).json({ message: "User is not a member of this group" });
    }

    // Atomic removal using $pull without triggering full document validation
    await StudyGroup.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId } }
    );

    // Update user tracking for recommendations
    await User.findByIdAndUpdate(userId, {
      $pull: { joinedGroups: group._id },
      $inc: { activityScore: -5 } // Leaving group decreases activity
    });

    // Update group activity score (find fresh document to avoid validation issues)
    const updatedGroup = await StudyGroup.findById(groupId);
    await updatedGroup.updateActivityScore();

    res.json({ success: true, message: "Left group successfully" });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: "Failed to leave group", error: error.message });
  }
};

/* =========================
   RESOURCE CRUD
========================= */

export const addResource = [
  upload.single("file"),
  async (req, res) => {
    try {
      const userId = getUserObjectId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { groupId } = req.params;
      const { title, description, url, resourceType, isShared } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      if (resourceType === "file" && !req.file) {
        return res
          .status(400)
          .json({ message: "File is required for this resource type" });
      }

      const group = await StudyGroup.findById(groupId);
      if (!group) {
        if (req.file) await fs.promises.unlink(req.file.path).catch(() => { });
        return res.status(404).json({ message: "Group not found" });
      }

      if (!group.members.some((m) => m.equals(userId))) {
        if (req.file) await fs.promises.unlink(req.file.path).catch(() => { });
        return res.status(403).json({ message: "Not authorized" });
      }

      const resourceData = {
        groupId,
        title,
        description,
        resourceType,
        isShared: isShared === "true" || isShared === true,
        addedBy: userId,
      };

      if (resourceType === "link" && url) {
        resourceData.url = url;
      }

      if (req.file) {
        resourceData.file = `uploads/${req.file.filename}`;
        resourceData.resourceType = "file";
      }

      const resource = await GroupResource.create(resourceData);

      // Update user activity score for uploading resource
      await User.findByIdAndUpdate(userId, {
        $inc: { activityScore: 5 } // Uploading resource increases activity
      });

      // Update group activity score
      await group.updateActivityScore();

      res.status(201).json({ success: true, data: { resource } });
    } catch (err) {
      console.error("addResource error:", err);
      if (req.file?.path) {
        await fs.promises.unlink(req.file.path).catch(() => { });
      }
      res.status(500).json({ message: "Failed to add resource", error: err.message });
    }
  },
];

export const getResources = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = getUserObjectId(req);

    // Get shared resources (visible to all group members)
    const shared = await GroupResource.find({ groupId, isShared: true })
      .populate('addedBy', 'username email')
      .sort({ createdAt: -1 });

    // Get private resources (only visible to the uploader)
    const privateRes = userId
      ? await GroupResource.find({ groupId, isShared: false, addedBy: userId })
          .populate('addedBy', 'username email')
          .sort({ createdAt: -1 })
      : [];

    res.json({ 
      success: true, 
      data: { 
        shared, 
        private: privateRes 
      } 
    });
  } catch (err) {
    console.error("getResources error:", err);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    const resource = await GroupResource.findById(req.params.resourceId);
    if (!userId || !resource) return res.status(404).json({ message: "Not found" });

    if (!resource.addedBy.equals(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (resource.file) {
      const filePath = path.join(UPLOADS_DIR, path.basename(resource.file));
      await fs.promises.unlink(filePath).catch(() => { });
    }

    await resource.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

export const updateResource = async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    const { resourceId } = req.params;
    const { isShared } = req.body;

    const resource = await GroupResource.findById(resourceId);
    if (!userId || !resource) return res.status(404).json({ message: "Not found" });

    if (!resource.addedBy.equals(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    resource.isShared = isShared;
    await resource.save();

    res.json({ success: true, data: { resource } });
  } catch (err) {
    res.status(500).json({ message: "Failed to update resource", error: err.message });
  }
};
