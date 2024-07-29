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
    // Handle user login
    socket.on("login", (user) => {
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

    function findSocketByUserId(userId) {
      const user = users[userId];
      return user ? io.sockets.sockets.get(user.socketId) : null;
    }
    //---------------------------
    // Handle private message event
    socket.on(
      "private_message",
      ({ senderId, recipientId, message, timestamp }) => {
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
        console.log("Message stored.");
        // console.log("Message stored successfully:", message);
      });
    }
    //---------------------------
    // Handle user disconnect
    socket.on("disconnect", () => {
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
      try {
        const group = await GroupBL.createGroup(groupId, groupName, creatorId);
        io.emit("group_created", group);
      } catch (error) {
        console.error("Error creating group:", error.message);
      }
    });

    // Handle joining a group
    socket.on("join_group", async ({ groupId, userId }) => {
      try {
        const group = await GroupBL.addUserToGroup(groupId, userId);
        io.emit("group_updated", group);
      } catch (error) {
        console.error("Error joining group:", error.message);
      }
    });

    // Handle leaving a group
    socket.on("leave_group", async ({ groupId, userId }) => {
      try {
        const group = await GroupBL.removeUserFromGroup(groupId, userId);
        io.emit("group_updated", group);
      } catch (error) {
        console.error("Error leaving group:", error.message);
      }
    });

    // Handle listing groups
    socket.on("list_groups", async (userId) => {
      try {
        const userGroups = await GroupBL.listGroupsByUserId(userId);
        console.log("Server - user_groups: ", userGroups);
        socket.emit("user_groups", userGroups);
      } catch (error) {
        console.error("Error listing groups:", error.message);
      }
    });

    socket.on("block_user", async ({ userId, blockedUserId }) => {
      try {
        await UserBL.blockUser(userId, blockedUserId);
        socket.emit("user_blocked", { userId, blockedUserId });
      } catch (error) {
        console.error("Error blocking user:", error.message);
      }
    });

    // Handle unblocking a user
    socket.on("unblock_user", async ({ userId, blockedUserId }) => {
      try {
        await UserBL.unblockUser(userId, blockedUserId);
        socket.emit("user_unblocked", { userId, blockedUserId });
      } catch (error) {
        console.error("Error unblocking user:", error.message);
      }
    });

    // Handle fetching chat history
    socket.on("fetch_chat_history", async (userId) => {
      try {
        const chatHistory = await ChatBL.getChatHistory(userId);
        socket.emit("chat_history", chatHistory);
      } catch (error) {
        console.error("Error fetching chat history:", error.message);
      }
    });

    socket.on("fetch_registered_users", async () => {
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
