const socketIO = require("socket.io");
const users = {};

function socketController(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("send_nice_message", (data) => {
      socket.broadcast.emit("received_message", data);
    });

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

    // Handle private message event
    socket.on("private message", ({ senderId, recipientId, message }) => {
      // Find recipient's socket
      const recipientSocket = findSocketByUserId(recipientId);
      if (recipientSocket) {
        // Emit private message to recipient
        recipientSocket.emit("private message", { senderId, message });
      }
    });

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
  });
}

module.exports = socketController;
