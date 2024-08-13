import React, { useState, useEffect, useCallback } from "react";
import { useUserProfile, useUser } from "../hooks";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
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
  const fetchChatHistory = useCallback(() => {
    socket.emit("fetchGroupHistory", { groupId: selectedGroup._id });
  }, [selectedGroup]);
  //------------------------------------
  useEffect(() => {
    if (selectedGroup) {
      fetchChatHistory();
    }

    socket.on("groupHistoryResponse", (data) => {
      setChatHistory(data);
    });

    socket.on("groupHistoryError", (error) => {
      console.error("Failed to fetch chat history:", error);
      setChatHistory([]);
    });

    return () => {
      socket.off("groupHistoryResponse");
      socket.off("groupHistoryError");
    };
  }, [selectedGroup, fetchChatHistory]);
  //-------------------------
  useEffect(() => {
    const handleGroupMessage = (message) => {
      if (selectedGroup && message.groupId === selectedGroup._id) {
        setChatHistory((prevHistory) => [...prevHistory, message]);
        setIsModalOpen(true);
      }
    };
    socket.on("group_message", handleGroupMessage);
    // Clean up the event listener on component unmount
    return () => {
      socket.off("group_message", handleGroupMessage);
    };
  }, [selectedGroup]);
  //-------------------------
  useEffect(() => {
    const handleLeaveGroup = (data) => {
      if (userId == data.userId) {
        setSelectedGroup(null);
        handleCloseModal();

        setGroups((prevGroups) =>
          prevGroups.filter((group) => group._id !== data.updatedGroup._id)
        );
      }

      if (
        userId != data.userId &&
        selectedGroup &&
        selectedGroup._id == data.updatedGroup._id
      ) {
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group._id === data.updatedGroup._id ? data.updatedGroup : group
          )
        );
        setSelectedGroup(data.updatedGroup);
      }
    };
    socket.on("leave_group", handleLeaveGroup);
    return () => {
      socket.off("leave_group", handleLeaveGroup);
    };
  }, [selectedGroup, userId]);
  //-------------------------
  useEffect(() => {
    const fetchUsers = () => {
      socket.emit("fetchUsers");
    };

    fetchUsers();

    socket.on("usersResponse", (data) => {
      setUsers(data);
    });

    socket.on("usersError", (error) => {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    });

    return () => {
      socket.off("usersResponse");
      socket.off("usersError");
    };
  }, []);
  //-------------------------
  useEffect(() => {
    const fetchGroups = () => {
      socket.emit("fetchGroups");
    };

    fetchGroups();

    socket.on("groupsResponse", (data) => {
      const userGroups = data.filter((group) =>
        group.members.some((member) => member._id === userId)
      );
      setGroups(userGroups);
    });

    socket.on("groupsError", (error) => {
      console.error("Error fetching groups:", error);
      toast.error("Failed to fetch groups");
    });

    return () => {
      socket.off("groupsResponse");
      socket.off("groupsError");
    };
  }, [userId]);
  //-------------------------
  useEffect(() => {
    socket.on("new_group", (newGroup) => {
      setGroups((prevGroups) => {
        // Check if the new group already exists in the list
        if (!prevGroups.some((group) => group._id === newGroup._id)) {
          return [...prevGroups, newGroup];
        }
        return prevGroups;
      });

      toast.success("Group created successfully");
      setGroupName("");
      setSelectedUsers([]);
      setIsModalOpen(false);
    });

    return () => {
      socket.off("new_group");
    };
  }, [userId]);
  //-------------------------
  useEffect(() => {
    socket.on("delete_group", (deletedGroupId) => {
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group._id !== deletedGroupId._id)
      );
      // Close the selected group if it is the one being deleted
      if (selectedGroup && selectedGroup._id === deletedGroupId._id) {
        setSelectedGroup(null);
        handleCloseModal();
        toast.success("Group deleted successfully");
      }
    });

    return () => {
      socket.off("delete_group");
    };
  }, [selectedGroup]);
  //-------------------------
  const handleCreateGroup = async () => {
    try {
      socket.emit("new_group", { groupName, members: selectedUsers });
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
      socket.emit("delete_group", groupId);
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };
  //-------------------------
  const handleLeaveGroup = async (groupId) => {
    try {
      socket.emit("leave_group", { userId, groupId });
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
