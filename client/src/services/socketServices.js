import socket from "./socket";

export function sendPrivateMessage(senderId, recipientId, message) {
  socket.emit("private message", { senderId, recipientId, message });
}

export function login(user) {
  socket.emit("login", user);
}
