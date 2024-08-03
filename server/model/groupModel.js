const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const GroupSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, auto: true },
  groupName: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }], // Reference to User model
  messages: [
    {
      senderUsername: { type: String, required: true },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      content: { type: String, required: true },
      timestamp: { type: Date, required: true },
    },
  ],
});
const GroupModel = mongoose.model("groups", GroupSchema);

module.exports = { GroupModel };
