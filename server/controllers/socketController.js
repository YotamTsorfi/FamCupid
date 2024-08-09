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

    //------------------------------------------------------------------------
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
        // console.log("Received private message:", {
        //   senderId,
        //   recipientId,
        //   message,
        //   timestamp,
        // });

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
    // Store private message in database
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

    //---------------------------Group Chat

    // Handle new group event
    socket.on("new_group", (newGroup) => {
      console.log("New group created:", newGroup);
      // Broadcast the new group to all connected clients
      io.emit("new_group", newGroup);
    });

    socket.on("delete_group", (groupId) => {
      console.log("Group deleted:", groupId);
      // Broadcast the deleted group ID to all connected clients
      io.emit("delete_group", groupId);
    });

    //Handle group message event
    socket.on("group_message", async (message) => {
      const { groupId } = message;

      try {
        await GroupBL.insertGroupMessage({ message });
        console.log("Message stored in database");

        // Emit the message to all members of the group
        console.log("Emitting group message to group:", groupId);
        io.emit("group_message", message);
      } catch (error) {
        console.error("Error handling group message:", error.message);
      }
    });

    //------------------------------------------------------------
  });
}
module.exports = socketController;
