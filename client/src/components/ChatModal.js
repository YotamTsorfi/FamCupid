import React, { useState, useEffect, useCallback } from "react";
import "./css/ChatModal.css";

const ChatModal = ({
  onClose,
  recipientUser,
  senderUser,
  msgData,
  incomingMessages = [],
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Merge incomingMessages with existing messages, avoiding duplicates
    setMessages((currentMessages) => {
      const incomingUnique = incomingMessages.filter(
        (incoming) =>
          !currentMessages.some((current) => current.id === incoming.id)
      );
      return [...currentMessages, ...incomingUnique];
    });
  }, [incomingMessages]);

  const sendMessage = (e) => {
    e.preventDefault();

    if (input.trim()) {
      const timestamp = Date.now();

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: timestamp,
          text: input,
          senderId: senderUser.id,
          username: senderUser.username,
          time: new Date(timestamp).toLocaleTimeString(),
        },
      ]);

      const inputObject = {
        text: input,
        timestamp: new Date(timestamp).toLocaleTimeString(),
      };

      //Send message to server (By Members.js)
      msgData(inputObject);
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
              message.senderId === senderUser.id ? "sent" : "received"
            }`}
          >
            <strong>
              {message.senderId === senderUser.id
                ? senderUser.username
                : recipientUser.username}
              :
            </strong>{" "}
            {message.text}
            <div className="message-timestamp">{message.time}</div>
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
