import React, { useState, useEffect, useCallback } from "react";
import { useUserProfile, useUser } from "../hooks";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Group from "./Group";
import Modal from "react-modal";
import socket from "../services/socket";
import "react-toastify/dist/ReactToastify.css";
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
  const [chatHistory, setChatHistory] = useState([]);
  //-------------------------
  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SOCKET_SERVER}/groups/groupHistory`,
        { groupId: selectedGroup._id }
      );
      setChatHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      setChatHistory([]);
    }
  }, [selectedGroup]);
  //-------------------------

  useEffect(() => {
    if (selectedGroup) {
      fetchChatHistory();
    }
  }, [selectedGroup, fetchChatHistory]);

  //-------------------------
  useEffect(() => {
    const handleGroupMessage = (message) => {
      // console.log("Received group message From Server:", message);

      if (selectedGroup && message.groupId === selectedGroup._id) {
        setChatHistory((prevHistory) => [...prevHistory, message]);
        setIsModalOpen(true); // Open the modal when a message is received
      }
    };

    socket.on("group_message", handleGroupMessage);

    // Clean up the event listener on component unmount
    return () => {
      socket.off("group_message", handleGroupMessage);
    };
  }, [selectedGroup]); // Add selectedGroup to the dependency array

  //-------------------------
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
  //-------------------------
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

        // Filter groups to only include those the user is a member of
        const userGroups = response.data.filter((group) =>
          group.members.some((member) => member._id === userId)
        );
        setGroups(userGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast.error("Failed to fetch groups");
      }
    };

    fetchGroups();
  }, [token, userId]);
  //-------------------------
  useEffect(() => {
    socket.on("new_group", (newGroup) => {
      if (newGroup.members.some((member) => member._id === userId)) {
        setGroups((prevGroups) => {
          if (!prevGroups.some((group) => group._id === newGroup._id)) {
            return [...prevGroups, newGroup];
          }
          return prevGroups;
        });
      }
    });

    return () => {
      socket.off("new_group");
    };
  }, [userId]);
  //-------------------------
  useEffect(() => {
    socket.on("delete_group", (deletedGroupId) => {
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group._id !== deletedGroupId)
      );

      // Close the selected group if it is the one being deleted
      if (selectedGroup && selectedGroup._id === deletedGroupId) {
        handleCloseModal();
      }
    });

    return () => {
      socket.off("delete_group");
    };
  }, [selectedGroup]);
  //-------------------------
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

        // Emit the new group event
        socket.emit("new_group", response.data);
      } else {
        throw new Error("Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
  };
  //-------------------------
  const handleUserSelection = (userId) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(userId)
        ? prevSelectedUsers.filter((id) => id !== userId)
        : [...prevSelectedUsers, userId]
    );
  };
  //-------------------------
  const openGroupModal = (group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };
  //-------------------------
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };
  //-------------------------
  const handleDeleteGroup = async (groupId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_SOCKET_SERVER}/groups/${groupId}`
      );
      setGroups(groups.filter((group) => group._id !== groupId));
      setSelectedGroup(null);
      handleCloseModal();
      toast.success("Group deleted successfully");

      // Emit the delete group event
      socket.emit("delete_group", groupId);
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };
  //-------------------------
  const handleLeaveGroup = async (groupId) => {
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_SOCKET_SERVER}/groups/${groupId}/leave`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setSelectedGroup(null);
        handleCloseModal();
        setGroups(groups.filter((group) => group._id !== groupId));
      } else {
        throw new Error("Failed to leave group");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
    }
  };

  //-------------------------
  const handleMsgData = (data) => {
    const message = {
      groupId: selectedGroup._id,
      senderId: userId,
      senderUsername: username,
      content: data.content,
      timestamp: new Date().toISOString(),
    };

    socket.emit("group_message", message);
  };
  //-------------------------
  return (
    <div>
      <div className="userName">Logged in as: {username}</div>
      <div className="header-container">
        <button className="go-home-button" onClick={() => navigate("/home")}>
          Home
        </button>
      </div>
      <h1>Groups</h1>
      <ToastContainer />
      {selectedGroup ? (
        <Group
          token={token}
          username={username}
          userId={userId}
          group={selectedGroup}
          incomingMessages={chatHistory}
          onClose={handleCloseModal}
          onDelete={handleDeleteGroup}
          onLeave={handleLeaveGroup}
          msgData={handleMsgData}
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
      <button
        className="create-group-button"
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
        Create Group
      </button>
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
