const ChatBL = require("../BL/chatBL");
const GroupBL = require("../BL/groupBL");
const UserBL = require("../BL/userBL");
const socketIO = require("socket.io");
const users = {};

function socketController(server) {
  // Create socket server
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  //---------------------------
  // Handle socket connection
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    //-----------------------------------------Group Chat
    socket.on("group_message", async (message) => {
      const { groupId, senderId, content, timestamp, senderUsername } = message;
      console.log("Received group message:", message);

      try {
        // Store message in database
        await GroupBL.insertGroupMessage(
          groupId,
          senderId,
          content,
          timestamp,
          senderUsername
        );
        console.log("Message stored in database");

        // Fetch group with populated sender's username in messages
        const group = await GroupBL.getGroupByIdWithMessagesPopulated(groupId);
        console.log("Group fetched with populated messages:", group);

        group.members.forEach((member) => {
          const memberSocket = findSocketByUserId(member._id);
          if (memberSocket) {
            const messageWithUsername = {
              ...message,
              groupId,
              senderUsername: group.messages.find(
                (msg) => msg.senderId._id.toString() === senderId
              ).senderId.username,
            };
            console.log(
              "Emitting message to member:",
              member._id,
              messageWithUsername
            );
            memberSocket.emit("group_message", messageWithUsername);
          }
        });
      } catch (error) {
        console.error("Error handling group message:", error.message);
      }
    });

    // Handle user login
    socket.on("login", (user) => {
      console.log("User logged in:", user.username);
      // Check that the user object contains all the necessary properties
      if (user && user.id && user.username && user.photoUrl && user.bio) {
        // Add user to online users list
        users[user.id] = { socketId: socket.id, ...user };

        // Emit updated online users list
        io.emit("onlineUsers", Object.values(users));
      } else {
        console.log("Received incomplete user object:", user);
      }
    });

    //---------------------------
    function findSocketByUserId(userId) {
      const user = users[userId];
      return user ? io.sockets.sockets.get(user.socketId) : null;
    }
    //---------------------------
    // Handle private message event
    socket.on(
      "private_message",
      ({ senderId, recipientId, message, timestamp }) => {
        console.log("Received private message:", {
          senderId,
          recipientId,
          message,
          timestamp,
        });

        // Find recipient's socket
        const recipientSocket = findSocketByUserId(recipientId);
        if (recipientSocket) {
          //store message in database
          storeMessage(senderId, recipientId, message, timestamp);

          // Emit private message to recipient
          recipientSocket.emit("private_message", {
            senderId,
            recipientId,
            message,
            timestamp,
          });
        }
      }
    );
    //---------------------------
    // Store message in database
    function storeMessage(senderId, recipientId, message, timestamp) {
      const messageObj = {
        senderId,
        recipientId,
        message,
        timestamp,
      };

      ChatBL.insertOrUpdateChat(messageObj).then((message) => {
        console.log("Message stored successfully:", message);
        // console.log("Message stored successfully:", message);
      });
    }
    //---------------------------
    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      // Find user associated with the socket and remove them from online users list
      const userId = Object.keys(users).find(
        (key) => users[key].socketId === socket.id
      );
      if (userId) delete users[userId];

      // Emit updated online users list
      io.emit("onlineUsers", Object.values(users));
    });
    //---------------------------Group Chat
    // Handle group creation
    socket.on("create_group", async ({ groupId, groupName, creatorId }) => {
      console.log("Creating group:", { groupId, groupName, creatorId });
      try {
        const group = await GroupBL.createGroup(groupId, groupName, creatorId);
        io.emit("group_created", group);
      } catch (error) {
        console.error("Error creating group:", error.message);
      }
    });

    // Handle join group event
    socket.on("join_group", async (data) => {
      console.log("Joining group:", data);

      try {
        // Extract groupId from the data object
        const { groupId } = data;

        // Fetch group messages
        const messages = await GroupBL.getGroupMessages(groupId);

        // Emit messages to the client
        socket.emit("group_messages", messages);
      } catch (error) {
        console.error("Error fetching group messages:", error.message);
      }
    });

    // Handle leaving a group
    socket.on("leave_group", async ({ groupId, userId }) => {
      console.log("Leaving group:", { groupId, userId });
      try {
        const group = await GroupBL.removeUserFromGroup(groupId, userId);
        io.emit("group_updated", group);
      } catch (error) {
        console.error("Error leaving group:", error.message);
      }
    });

    // Handle listing groups
    socket.on("list_groups", async (userId) => {
      console.log("Listing groups for user:", userId);
      try {
        const userGroups = await GroupBL.listGroupsByUserId(userId);
        console.log("Server - user_groups: ", userGroups);
        socket.emit("user_groups", userGroups);
      } catch (error) {
        console.error("Error listing groups:", error.message);
      }
    });

    socket.on("block_user", async ({ userId, blockedUserId }) => {
      console.log("Blocking user:", { userId, blockedUserId });
      try {
        await UserBL.blockUser(userId, blockedUserId);
        socket.emit("user_blocked", { userId, blockedUserId });
      } catch (error) {
        console.error("Error blocking user:", error.message);
      }
    });

    // Handle unblocking a user
    socket.on("unblock_user", async ({ userId, blockedUserId }) => {
      console.log("Unblocking user:", { userId, blockedUserId });
      try {
        await UserBL.unblockUser(userId, blockedUserId);
        socket.emit("user_unblocked", { userId, blockedUserId });
      } catch (error) {
        console.error("Error unblocking user:", error.message);
      }
    });

    // Handle fetching chat history
    socket.on("fetch_chat_history", async (userId) => {
      console.log("Fetching chat history for user:", userId);
      try {
        const chatHistory = await ChatBL.getChatHistory(userId);
        socket.emit("chat_history", chatHistory);
      } catch (error) {
        console.error("Error fetching chat history:", error.message);
      }
    });

    socket.on("fetch_registered_users", async () => {
      console.log("Fetching registered users");
      try {
        const users = await UserBL.getUsers();
        socket.emit("registered_users", users);
      } catch (error) {
        console.error("Error fetching registered users:", error.message);
      }
    });
    //------------------------------------------------------------
  });
}
module.exports = socketController;
