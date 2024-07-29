import React from "react";
import Modal from "react-modal";
import "./css/Group.css";

function Group({ group, onClose, onDelete }) {
  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      className="big-modal"
      overlayClassName="Overlay"
    >
      <div className="modal-header">
        <button className="modal-button" onClick={onClose}>
          Close
        </button>
        <button className="modal-button" onClick={() => onDelete(group._id)}>
          Delete
        </button>
      </div>
      <h2>{group.groupName}</h2>
      <ul>
        {group.members.map((member) => (
          <li key={member._id}>{member.username}</li>
        ))}
      </ul>
    </Modal>
  );
}

export default Group;
