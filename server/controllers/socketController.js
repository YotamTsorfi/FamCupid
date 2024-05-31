/**
 * Socket controller module that handles socket.io connections and events.
 * @module socketController
 * @param {Object} server - The HTTP server object.
 */
const socketIO = require("socket.io");
let users = {};

/**
 * Finds the socket associated with a given user ID.
 * @param {string} userId - The ID of the user.
 * @returns {Socket} The socket associated with the user ID, or undefined if not found.
 */
function findSocketByUserId(userId) {
  // Implement this function based on how you're storing the user-socket associations
  return users[userId];
}

/**
 * Initializes the socket controller and sets up socket.io connections and events.
 * @param {Object} server - The HTTP server object.
 */
function socketController(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Handle socket.io connection event
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("send_nice_message", (data) => {
      //console.log(`Received message: ${data.message}`);
      socket.broadcast.emit("received_message", data);
    });

    // Uncomment and implement the following event handlers as needed

    // socket.on("login", (user) => {
    //   // Handle login event
    // });

    // socket.on("private message", ({ senderId, recipientId, message }) => {
    //   // Handle private message event
    // });

    // socket.on("disconnect", () => {
    //   // Handle disconnect event
    // });
  });
}

module.exports = socketController;
