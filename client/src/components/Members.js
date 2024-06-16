import { useUserProfile, useUser } from "../hooks";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPrivateMessage } from "../services/socketServices";
import { login } from "../services/socketServices";
import socket from "../services/socket";
import Member from "./Member";
import UserDetails from "./UserDetails";
import ChatModal from "./ChatModal";
import "./css/Members.css";

function Members() {
  const { userId, username, photoUrl, bio } = useUser();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [viewedUser, setViewedUser] = useState(null);
  const [senderUser, setSenderUser] = useState(null);
  const [recipientUser, setRecipientUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [chatModalVisible, setChatModalVisible] = useState(false);

  useUserProfile();
  const navigate = useNavigate();

  const handleNotificationClick = (senderId) => {
    const notification = notifications.find((n) => n.senderId === senderId);
    if (notification) {
      setRecipientUser(onlineUsers.find((user) => user.id === senderId));
      setMessages([
        {
          id: notification.timestamp,
          text: notification.message,
          senderId: senderId,
          username: onlineUsers.find((user) => user.id === senderId).username,
          time: notification.timestamp,
        },
      ]);
      setChatModalVisible(true);
    }
  };

  //---------------------------------------------------------
  useEffect(() => {
    const handlePrivateMessage = ({
      senderId,
      recipientId,
      message,
      timestamp,
    }) => {
      // Add the message to notifications
      const newNotification = { senderId, message, timestamp, isOpen: false };
      setNotifications((prev) => [...prev, newNotification]);

      // console.log(
      //   `Received private message: ${message} from ${senderId} to ${recipientId} at ${timestamp}`
      // );

      // Remove the notification after 5 seconds
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((notification) => notification !== newNotification)
        );
      }, 3000);

      // If the recipient's chat window is open, update the messages directly
      if (chatModalVisible && recipientUser && recipientUser.id === senderId) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: timestamp,
            text: message,
            senderId: senderId,
            username: onlineUsers.find((user) => user.id === senderId)
              ?.username,
            time: timestamp,
          },
        ]);
      }
    };

    socket.on("private_message", handlePrivateMessage);

    return () => {
      socket.off("private_message", handlePrivateMessage);
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

    socket.on("onlineUsers", (users) => {
      const otherUsers = users.filter((u) => u.id !== user.id);
      setOnlineUsers(otherUsers);
    });

    return () => {
      socket.off("onlineUsers");
    };
  }, [userId, username, photoUrl, bio]);
  //---------------------------------------------------------
  const handleMsgData = (data) => {
    sendPrivateMessage(
      senderUser.id,
      recipientUser.id,
      data.text,
      data.timestamp
    );
  };

  const handleMemberClick = (user) => {
    setViewedUser(user);
  };

  const handleClose = () => {
    setViewedUser(null);
    setRecipientUser(null);
    setChatModalVisible(false);
  };

  const handleChat = (userId) => {
    handleClose();
    const userObject = onlineUsers.find((u) => u.id === userId);
    setRecipientUser(userObject);
    setChatModalVisible(true);
  };

  const handleCloseChatModal = () => {
    setChatModalVisible(false);
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  return (
    <div>
      <button className="go-profile-button" onClick={goToProfile}>
        Profile
      </button>

      {notifications.map((notification, index) => {
        const senderUsername =
          onlineUsers.find((user) => user.id === notification.senderId)
            ?.username || "Unknown";
        const displayMessage =
          notification.message.length > 30
            ? `${notification.message.substring(0, 30)}...`
            : notification.message;

        return (
          <div
            key={index}
            onClick={() => handleNotificationClick(notification.senderId)}
            className="notification-popup"
          >
            {`${senderUsername}: ${displayMessage}`}
          </div>
        );
      })}

      {chatModalVisible && (
        <ChatModal
          onClose={handleCloseChatModal}
          recipientUser={recipientUser}
          senderUser={senderUser}
          incomingMessages={messages}
          msgData={handleMsgData}
        />
      )}

      <h1>Online Users</h1>
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
        />
      )}
    </div>
  );
}

export default Members;
