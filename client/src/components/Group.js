import React, { useState, useEffect, useRef, useCallback } from "react";
import Modal from "react-modal";

import "react-toastify/dist/ReactToastify.css";
import "./css/Group.css";

function Group({
  username,
  userId,
  group,
  onClose,
  onDelete,
  onLeave,
  msgData,
  chatHistory,
  incomingMessages = [],
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState("");
  const chatWindowRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the chat window whenever messages change
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);
  //----------------------------------------------------------------
  useEffect(() => {
    setMessages(chatHistory);
  }, [chatHistory]);
  //----------------------------------------------------------------
  const sendMessage = (e) => {
    e.preventDefault();

    const message = {
      groupId: group._id,
      senderId: userId,
      senderUsername: username,
      content: input,
      timestamp: new Date().toISOString(),
    };

    //Send message to server (By Groups.js)
    msgData(message);
    setInput("");
  };
  //----------------------------------------------------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage(e);
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
  }, [handleMouseMove, userId]);
  //----------------------------------------------------------------
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
      <Modal
        isOpen={true}
        onRequestClose={() => onClose()}
        overlayClassName="Overlay"
        style={{
          content: {
            height: "70%",
            width: "50%",
            maxWidth: "50%",
            maxHeight: "80%",
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
            onClick={() => onLeave(group._id)}
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
              {incomingMessages.map((message, index) => (
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
          <form className="group-chat-input" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="group-send-button" type="submit">
              Send
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
export default Group;
