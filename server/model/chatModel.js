const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const ChatSchema = new mongoose.Schema({
  participants: [String],
  messages: [
    {
      content: { type: String, required: true },
      senderId: { type: String, required: true },
      receiverId: { type: String, required: true },
      timestamp: { type: Date, required: true },
    },
  ],
});
const ChatModel = mongoose.model("chats", ChatSchema);

module.exports = { ChatModel };
