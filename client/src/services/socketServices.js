import socket from "./socket";

export function sendPrivateMessage(recipientId, message) {
  socket.emit("private message", { recipientId, message });
}

export function login(user) {
  socket.emit("login", user);
}
