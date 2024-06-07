import React, { useState, useEffect } from "react";
import "./css/ChatModal.css";

const ChatModal = ({ onClose, user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([
        ...messages,
        { id: Date.now(), text: input, sender: "user" },
      ]);
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

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - startPosition.x;
      const newY = e.clientY - startPosition.y;
      setPosition({ x: newX, y: newY });
    }
  };

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
  }, [isDragging, startPosition.x, startPosition.y]);

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
        {user.photoUrl && (
          <img src={user.photoUrl} alt="User" className="user-photo" />
        )}
        <h3 className="user-name">{user.username}</h3>
      </div>
      <button className="close-chat" onClick={onClose}>
        Close
      </button>
      <div className="messages-area">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
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
