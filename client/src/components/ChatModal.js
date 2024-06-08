import React, { useState, useEffect, useCallback } from "react";
import { sendPrivateMessage } from "../services/socketServices";
import socket from "../services/socket";
import "./css/ChatModal.css";

const ChatModal = ({ onClose, recipientUser, senderUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Function to handle an incoming private message
    const handlePrivateMessage = ({ senderId, message }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: Date.now(), text: message, sender: senderId },
      ]);
    };

    // Register the event listener for private messages
    socket.on("private message", handlePrivateMessage);

    // Cleanup function to remove the event listener
    return () => {
      socket.off("private message", handlePrivateMessage);
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const recipientId = recipientUser.id;
      const senderId = senderUser.id;

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: Date.now(), text: input, sender: senderId },
      ]);

      sendPrivateMessage(senderId, recipientId, input);

      setInput("");
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPosition({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        const newX = e.clientX - startPosition.x;
        const newY = e.clientY - startPosition.y;
        setPosition({ x: newX, y: newY });
      }
    },
    [isDragging, startPosition.x, startPosition.y]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  return (
    <div
      className="chat-window"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        position: "absolute",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="user-info" style={{ borderBottom: "1px solid #ccc" }}>
        {" "}
        {recipientUser.photoUrl && (
          <img src={recipientUser.photoUrl} alt="User" className="user-photo" />
        )}
        <h3 className="user-name">{recipientUser.username}</h3>
      </div>
      <button className="close-chat" onClick={onClose}>
        Close
      </button>
      <div className="messages-area">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.sender === senderUser.id ? "sent" : "received"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <form className="input-area" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatModal;
