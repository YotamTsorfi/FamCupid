import React, { useState, useEffect } from "react";
import { useUserProfile, useUser } from "../hooks";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Group from "./Group";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import "./css/Groups.css";

Modal.setAppElement("#root");

function Groups() {
  useUserProfile();
  const { token, username, userId } = useUser();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    // Fetch all users from the database
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SOCKET_SERVER}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      }
    };

    fetchUsers();
  }, [token]);

  useEffect(() => {
    // Fetch all groups from the database
    const fetchGroups = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SOCKET_SERVER}/groups`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setGroups(response.data);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast.error("Failed to fetch groups");
      }
    };

    fetchGroups();
  }, [token]);

  const handleCreateGroup = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SOCKET_SERVER}/groups`,
        { groupName, members: selectedUsers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        toast.success("Group created successfully");
        setGroupName("");
        setSelectedUsers([]);
        setIsModalOpen(false);
        setGroups([...groups, response.data]);
      } else {
        throw new Error("Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(userId)
        ? prevSelectedUsers.filter((id) => id !== userId)
        : [...prevSelectedUsers, userId]
    );
  };

  const openGroupModal = (group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_SOCKET_SERVER}/groups/${groupId}`
      );
      setGroups(groups.filter((group) => group._id !== groupId));
      setSelectedGroup(null);
      handleCloseModal();
      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  return (
    <div>
      <div className="userName">Logged in as: {username}</div>
      <button className="profile-button" onClick={() => navigate("/profile")}>
        Profile
      </button>
      <ToastContainer />
      <h1>Groups</h1>
      <button
        className="create-group-button"
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
        Create Group
      </button>
      {selectedGroup ? (
        <Group
          username={username}
          userId={userId}
          group={selectedGroup}
          onClose={handleCloseModal}
          onDelete={handleDeleteGroup}
        />
      ) : (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          contentLabel="Group Chat"
          className={"small-modal"}
        >
          <div>
            <h2 className="modal-title">Create a Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <h3>Select Users</h3>
            <div className="user-list">
              {users.map((user) => (
                <div key={user._id}>
                  <label>
                    <input
                      type="checkbox"
                      id={user._id}
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleUserSelection(user._id)}
                    />
                    {user.username}
                  </label>
                </div>
              ))}
            </div>
            <button onClick={handleCreateGroup}>Create Group</button>
            <button onClick={handleCloseModal}>Close</button>
          </div>
        </Modal>
      )}
      <h2>Group List</h2>
      <div className="group-list">
        {groups.map((group) => (
          <div key={group._id} className="group-item">
            <button
              onClick={() => openGroupModal(group)}
              className="group-button"
            >
              {group.groupName}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
  //-------------------------
}

export default Groups;
