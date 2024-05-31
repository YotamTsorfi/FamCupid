import io from "socket.io-client";
const socket = io(process.env.REACT_APP_SOCKET_SERVER);

socket.on("connect", () => {
  console.log(socket.connected);
  console.log(socket.id);
  console.log("connected to server");
});

socket.on("connect_error", (err) => {
  console.log("Connection Error", err);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected", reason);
});

socket.on("reconnect_attempt", () => {
  console.log("Attempting to reconnect");
});

socket.on("users", (users) => {
  // Update user list
});

socket.on("private message", ({ sender, message }) => {
  // Display private message
});

function sendPrivateMessage(recipient, message) {
  socket.emit("private message", { recipient, message });
}

export function login(username) {
  socket.emit("login", username);
}

export { socket, sendPrivateMessage };
