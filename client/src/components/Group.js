import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  sendGroupMessage,
  joinGroup,
  leaveGroup,
  onGroupMessage,
  offGroupMessage,
  setUpdateMessagesCallback,
} from "../services/socketServices";
import Modal from "react-modal";
import "./css/Group.css";

function Group({ username, userId, group, onClose, onDelete }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the chat window whenever messages change
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Join the group when the component mounts
    joinGroup(group._id, userId);

    // Listen for incoming group messages
    onGroupMessage(handleGroupMessage);

    // Set the callback to update messages
    setUpdateMessagesCallback(setMessages);

    // Cleanup on unmount
    return () => {
      if (isLeaving) {
        leaveGroup(group._id, userId);
      }
      offGroupMessage(handleGroupMessage);
      setUpdateMessagesCallback(null);
    };
  }, [group._id, isLeaving]);

  const handleGroupMessage = (message) => {
    console.log("Received message:", message);
    if (message.groupId === group._id) {
      const sender = group.members.find(
        (member) => member._id === message.senderId
      );
      const senderUsername = sender ? sender.username : "Unknown";
      console.log("Sender found:", sender);
      console.log("Sender username:", senderUsername);
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...message, senderUsername },
      ]);
    }
  };

  const handleClose = () => {
    setIsLeaving(false);
    onClose();
  };

  const handleLeaveGroup = () => {
    setIsLeaving(true);
    onClose();
  };

  const handleSendMessage = () => {
    const message = {
      groupId: group._id,
      senderId: userId,
      senderUsername: username,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    sendGroupMessage(message);
    setMessages((prevMessages) => [...prevMessages, message]);
    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  //----------------------------------------------------------------
  // State for draggable functionality
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  const handleMouseDown = (e) => {
    setDragging(true);
    dragRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (dragging) {
        setPosition({
          x: e.clientX - dragRef.current.x,
          y: e.clientY - dragRef.current.y,
        });
      }
    },
    [dragging]
  );

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove]);
  //----------------------------------------------------------------
  return (
    <Modal
      isOpen={true}
      onRequestClose={handleClose}
      overlayClassName="Overlay"
      style={{
        content: {
          height: "80%",
          width: "30%",
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          outline: "none",
          display: "flex",
          flexDirection: "column",
          transform: `translate(${position.x}px, ${position.y}px)`,
        },
      }}
    >
      <div
        className="group-modal-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: "move" }}
      >
        <button className="group-modal-button group-close" onClick={onClose}>
          Close
        </button>
        <h2 className="group-modal-title">{group.groupName}</h2>
        <button
          className="group-modal-button group-delete"
          onClick={() => onDelete(group._id)}
        >
          Delete
        </button>
      </div>
      <div className="group-members">
        {group.members.map((member, index) => (
          <span key={index} className="group-member">
            {member.username}
          </span>
        ))}
      </div>
      <hr className="group-hr" />
      <div className="group-chat-container">
        <div className="group-chat-window" ref={chatWindowRef}>
          <ul className="group-chat-messages">
            {messages.map((message, index) => (
              <li key={index} className="group-chat-message">
                <div className="group-message-header">
                  <span className="group-message-username">
                    {message.senderUsername}
                  </span>
                  <span className="group-message-date">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="group-message-content">{message.content}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="group-chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="group-send-button" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    </Modal>
  );
}
export default Group;
