import { useUserProfile, useUser } from "../hooks";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Member from "./Member";
import UserDetails from "./UserDetails";
import ChatModal from "./ChatModal";
import axios from "axios";
import "./css/Members.css";
import {
  login,
  sendPrivateMessage,
  onEvent,
  offEvent,
} from "../services/socketServices";

function Members() {
  const { userId, username, photoUrl, bio } = useUser();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [viewedUser, setViewedUser] = useState(null);
  const [senderUser, setSenderUser] = useState(null);
  const [recipientUser, setRecipientUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  useUserProfile();
  const navigate = useNavigate();

  //---------------------------------------------------------
  const fetchChatHistory = async (senderId, receiverId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SOCKET_SERVER}/chat`,
        { senderId, receiverId }
      );
      setChatHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      setChatHistory([]);
    }
  };

  //---------------------------------------------------------
  const handleNotificationClick = (senderId) => {
    setRecipientUser(onlineUsers.find((user) => user.id === senderId));
    fetchChatHistory(userId, senderId);
    setChatModalVisible(true);
  };

  //---------------------------------------------------------
  useEffect(() => {
    const handlePrivateMessage = ({
      senderId,
      recipientId,
      message,
      timestamp,
    }) => {
      // Find the sender's user object from the onlineUsers array
      const senderUser = onlineUsers.find((user) => user.id === senderId);

      const newMessage = {
        content: message,
        senderId,
        receiverId: recipientId,
        timestamp,
      };

      if (
        chatModalVisible &&
        (senderId === recipientUser.id || recipientId === recipientUser.id)
      ) {
        // Update chat history directly with the new message
        setChatHistory((prevHistory) => [...prevHistory, newMessage]);
      } else {
        // Handle notifications as before
        const newNotification = {
          senderId,
          message,
          timestamp,
          isOpen: false,
          username: senderUser ? senderUser.username : "Unknown",
        };
        setNotifications((prev) => [...prev, newNotification]);

        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((notification) => notification !== newNotification)
          );
        }, 3000);
      }
    };

    onEvent("private_message", handlePrivateMessage);

    return () => {
      offEvent("private_message", handlePrivateMessage);
    };
  }, [chatModalVisible, senderUser, recipientUser, onlineUsers]);

  //---------------------------------------------------------
  useEffect(() => {
    const user = {
      id: userId,
      username: username,
      photoUrl: photoUrl,
      bio: bio,
    };
    if (userId && username && photoUrl && bio) {
      login(user);
      setSenderUser(user);
    }

    onEvent("onlineUsers", (users) => {
      const otherUsers = users.filter((u) => u.id !== user.id);
      setOnlineUsers(otherUsers);
    });

    return () => {
      offEvent("onlineUsers");
    };
  }, [userId, username, photoUrl, bio]);
  //---------------------------------------------------------
  const handleMsgData = (data) => {
    sendPrivateMessage(
      senderUser.id,
      recipientUser.id,
      data.content,
      data.timestamp
    );

    // Optimistically update the chat history with the new message
    const newMessage = {
      content: data.content,
      senderId: senderUser.id,
      receiverId: recipientUser.id,
      timestamp: data.timestamp,
    };
    setChatHistory((prevHistory) => [...prevHistory, newMessage]);

    // fetchChatHistory(senderUser.id, recipientUser.id);
  };
  // ---------------------------------------------------------
  const handleMemberClick = (user) => {
    setViewedUser(user);
  };
  // ---------------------------------------------------------
  const handleClose = () => {
    setViewedUser(null);
    setRecipientUser(null);
    setChatModalVisible(false);
  };
  // ---------------------------------------------------------
  const handleChat = (userId) => {
    handleClose();
    const userObject = onlineUsers.find((u) => u.id === userId);
    setRecipientUser(userObject);
    fetchChatHistory(userId, userObject.id);
    setChatModalVisible(true);
  };
  // ---------------------------------------------------------
  const handleCloseChatModal = () => {
    setChatModalVisible(false);
  };
  // ---------------------------------------------------------
  const goToProfile = () => {
    navigate("/profile");
  };

  return (
    <div>
      <div className="user-identification">Logged in as: {username}</div>
      <button className="go-home-button" onClick={() => navigate("/home")}>
        Home
      </button>

      {notifications.map((notification, index) => (
        <div
          key={index}
          onClick={() => handleNotificationClick(notification.senderId)}
          className="notification-popup"
        >
          {`${notification.username}: ${notification.message}`}
        </div>
      ))}

      {chatModalVisible && (
        <ChatModal
          onClose={handleCloseChatModal}
          recipientUser={recipientUser}
          senderUser={senderUser}
          incomingMessages={chatHistory}
          msgData={handleMsgData}
        />
      )}
      <div className="members-container">
        {onlineUsers.map((user) => (
          <Member
            key={user.id}
            {...user}
            onClick={() => handleMemberClick(user)}
          />
        ))}
      </div>
      {viewedUser && (
        <UserDetails
          user={viewedUser}
          onClose={handleClose}
          onChat={handleChat}
          currentUser={{ id: userId, username, photoUrl, bio }}
        />
      )}
    </div>
  );
}

export default Members;
