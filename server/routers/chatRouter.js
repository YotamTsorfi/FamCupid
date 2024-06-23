const chatBL = require("../BL/chatBL");
const express = require("express");
const router = express.Router();

//http://localhost:3000/chat/
router.post("/", async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    const messages = await chatBL.getChatHistory(senderId, receiverId);
    res.json(messages);
  } catch (error) {
    console.error("Error in getChatHistory route:", error);
    res.status(500).send("Server error while retrieving chat history.");
  }
});

module.exports = router;
