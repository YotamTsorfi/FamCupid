import socket from "./socket";

export function login(user) {
  socket.emit("login", user);
}

export function sendPrivateMessage(senderId, recipientId, message, timestamp) {
  socket.emit("private_message", { senderId, recipientId, message, timestamp });
}
export function onEvent(event, handler) {
  socket.on(event, handler);
}

export function offEvent(event, handler) {
  socket.off(event, handler);
}
