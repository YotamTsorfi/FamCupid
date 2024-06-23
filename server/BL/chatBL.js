const { ChatModel } = require("../model/chatModel");

const insertOrUpdateChat = async (message) => {
  try {
    const currentTime = new Date();
    const [hours, minutes, seconds] = message.timestamp.split(/[:\s]/);
    currentTime.setHours(hours, minutes, seconds, 0);

    const formattedMessage = {
      content: message.message,
      senderId: message.senderId,
      receiverId: message.recipientId,
      timestamp: currentTime,
    };

    // Step 1: Define a unique identifier for the chat based on participant IDs
    // Assuming senderId and receiverId are always in the same order for a unique chat
    const participantIds = [message.senderId, message.recipientId].sort();

    // Step 2: Check for an existing chat using the sorted participant IDs
    let chat = await ChatModel.findOne({
      participants: { $all: participantIds },
    });

    if (chat) {
      // Step 3a: If chat exists, add message to it
      chat.messages.push(formattedMessage);
    } else {
      // Step 3b: If no chat exists, create a new one
      chat = new ChatModel({
        participants: participantIds,
        messages: [formattedMessage],
      });
    }

    // Step 4: Save or update the chat
    await chat.save();
    return formattedMessage;
  } catch (error) {
    console.error("Error inserting or updating chat:", error);
    throw error; // Rethrow or handle as needed
  }
};

const getChatHistory = async (senderId, receiverId) => {
  try {
    // Sort the participant IDs to match the order in the database
    const participantIds = [senderId, receiverId].sort();

    // Query the database for the chat document
    const chat = await ChatModel.findOne({
      participants: { $all: participantIds },
    });

    // If a chat document is found, return its messages
    if (chat) {
      return chat.messages;
    } else {
      // If no chat document is found, return an empty array or a message
      return []; // or return "No chat history found."
    }
  } catch (error) {
    console.error("Error retrieving chat history:", error);
    throw error; // Rethrow or handle as needed
  }
};

module.exports = {
  insertOrUpdateChat,
  getChatHistory,
};
