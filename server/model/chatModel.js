const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }], // Reference to User model
  messages: [
    {
      content: { type: String, required: true },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      }, // Reference to User model
      receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      }, // Reference to User model
      timestamp: { type: Date, required: true },
    },
  ],
});
const ChatModel = mongoose.model("chats", ChatSchema);

module.exports = { ChatModel };
