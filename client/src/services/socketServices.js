import socket from "./socket";

// New functions to handle socket events
export function onEvent(event, handler) {
  socket.on(event, handler);
}

export function offEvent(event, handler) {
  socket.off(event, handler);
}

export function sendPrivateMessage(senderId, recipientId, message, timestamp) {
  socket.emit("private_message", { senderId, recipientId, message, timestamp });
}

export function login(user) {
  socket.emit("login", user);
}

// New group management functions

export function fetchRegisteredUsers(callback) {
  socket.emit("fetch_registered_users");
  socket.on("registered_users", callback);
}

// Function to create a group
export function createGroup(groupId, groupName, creatorId) {
  socket.emit("create_group", { groupId, groupName, creatorId });
}

// Function to join a group
export function joinGroup(groupId, userId) {
  socket.emit("join_group", { groupId, userId });
}

// Function to leave a group
export function leaveGroup(groupId, userId) {
  socket.emit("leave_group", { groupId, userId });
}

// Function to list groups for a user
export function listGroups(userId) {
  socket.emit("list_groups", userId);
}

// New functions for blocking/unblocking users
export function blockUser(userId, blockedUserId) {
  socket.emit("block_user", { userId, blockedUserId });
}

export function unblockUser(userId, blockedUserId) {
  socket.emit("unblock_user", { userId, blockedUserId });
}

// Function to fetch chat history
export function fetchChatHistory(userId, callback) {
  socket.emit("fetch_chat_history", userId);
  socket.on("chat_history", callback);
}

// Event handlers
export function handleGroupCreated(group) {
  console.log("Group created:", group);
  // Update your UI accordingly
}

export function handleGroupUpdated(group) {
  console.log("Group updated:", group);
  // Update your UI accordingly
}

export function handleUserGroups(groups) {
  console.log("User groups:", groups);
  // Update your UI accordingly
}

// Attach event handlers to the socket
socket.on("group_created", handleGroupCreated);
socket.on("group_updated", handleGroupUpdated);
socket.on("user_groups", handleUserGroups);
