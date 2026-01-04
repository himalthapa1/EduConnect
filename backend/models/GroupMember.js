import mongoose from "mongoose";

const groupMemberSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member"
    }
  },
  { timestamps: true }
);

// DEFAULT EXPORT (THIS FIXES YOUR ERROR)
const GroupMember = mongoose.model("GroupMember", groupMemberSchema);
export default GroupMember;
