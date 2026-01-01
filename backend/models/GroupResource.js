import mongoose from "mongoose";

const groupResourceSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    url: {
      type: String
    },
    file: {
      type: String // file path or URL
    },
    resourceType: {
      type: String,
      enum: ["pdf", "video", "article", "link", "file", "resource", "note"],
      default: "link"
    },
    isShared: {
      type: Boolean,
      default: false // false = private upload, true = shared with group
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("GroupResource", groupResourceSchema);
