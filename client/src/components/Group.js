import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import "./css/Group.css";

function Group({ group, onClose, onDelete }) {
  // State for draggable functionality
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  const handleMouseDown = (e) => {
    setDragging(true);
    dragRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({
        x: e.clientX - dragRef.current.x,
        y: e.clientY - dragRef.current.y,
      });
    }
  };

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
  }, [dragging]);
  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      overlayClassName="Overlay"
      style={{
        content: {
          width: "50%",
          maxWidth: "600px",
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
        className="modal-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: "move" }}
      >
        <button className="modal-button close" onClick={onClose}>
          Close
        </button>
        <h2 className="modal-title">{group.groupName}</h2>
        <button
          className="modal-button delete"
          onClick={() => onDelete(group._id)}
        >
          Delete
        </button>
      </div>
      <hr />
      <div className="chat-container">
        <div className="chat-window"></div>
        <div className="chat-input">
          <input type="text" placeholder="Type a message..." />
          <button className="send-button">Send</button>
        </div>
      </div>
    </Modal>
  );
}
export default Group;
