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
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./css/Group.css";

function Group({ token, username, userId, group, onClose, onDelete, onLeave }) {
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

  const handleGroupMessage = useCallback(
    (message) => {
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
    },
    [group, setMessages]
  );

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
  }, [group._id, isLeaving, handleGroupMessage, userId]);

  const handleClose = () => {
    setIsLeaving(false);
    onClose();
  };

  const handleLeaveGroup = async () => {
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_SOCKET_SERVER}/groups/${group._id}/leave`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setIsLeaving(true);
        onLeave(group._id);
        onClose();
      } else {
        throw new Error("Failed to leave group");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
    }
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
  }, [handleMouseMove, handleGroupMessage, userId]);

  const getUsernameColor = (username) => {
    // Simple hash function to generate a color from a string
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 50%)`;
    return color;
  };
  //----------------------------------------------------------------
  return (
    <div>
      <ToastContainer />
      <Modal
        isOpen={true}
        onRequestClose={handleClose}
        overlayClassName="Overlay"
        style={{
          content: {
            height: "70%", // Adjusted height to make it smaller
            width: "45%", // Adjusted width to make it smaller
            maxWidth: "90%", // Ensure it doesn't exceed the viewport width
            maxHeight: "90%", // Ensure it doesn't exceed the viewport height
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
          <button
            className="group-modal-button group-delete"
            onClick={() => onDelete(group._id)}
          >
            Delete
          </button>
          <button
            className="group-modal-button group-leave"
            onClick={handleLeaveGroup}
          >
            Leave Group
          </button>
          <h2 className="group-modal-title">{group.groupName}</h2>
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
                    <span
                      className="group-message-username"
                      style={{
                        color: getUsernameColor(message.senderUsername),
                      }}
                    >
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
    </div>
  );
}
export default Group;
