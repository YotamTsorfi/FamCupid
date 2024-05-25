import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUserId,
  selectUsername,
  selectPhotoUrl,
  login,
} from "../redux/slices/userSlice";
import "./css/Home.css";

import { socket, sendPrivateMessage } from "../services/socket.js";

//    TODO: use .env for the URL's

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const username = useSelector(selectUsername);
  const photoUrl = useSelector(selectPhotoUrl);
  const userId = useSelector(selectUserId);

  const [users, setUsers] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    socket.on("users", (users) => {
      setUsers(users);
    });

    socket.on("connect_error", (err) => {
      setConnectionError(err);
    });

    socket.on("private message", ({ senderId, message }) => {
      console.log(`Received private message from ${senderId}: ${message}`);
    });

    socket.emit("login", username);

    // Assuming recipient and message are defined
    const recipient = userId;
    const message = "Hello, this is a private message";

    // Call the function
    sendPrivateMessage(recipient, message);

    // Make sure to clean up event listeners on unmount
    return () => {
      socket.off("users");
      socket.off("connect_error");
      socket.off("private message");
    };
  }, [username]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    axios
      .get(`${process.env.REACT_APP_SOCKET_SERVER}/auth/profile`, {
        withCredentials: true,
      })
      .then((response) => {
        dispatch(
          login({
            userId: response.data.userId,
            username: response.data.username,
            photoUrl: response.data.photoUrl,
          })
        );
        setLoading(false);
      })
      .catch((error) => {
        setIsLoggedIn(false);
        navigate("/login");
      });
  }, [navigate, isLoggedIn, dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    axios
      .get(`${process.env.REACT_APP_SOCKET_SERVER}/auth/logout`, {
        withCredentials: true,
      })
      .then((response) => {
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        setIsLoggedIn(false);
        navigate("/login");
      });
  };

  return (
    <div>
      {isLoggedIn && (
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      )}
      <h1>Welcome, {username}!</h1>
      <p>User ID: {userId}</p>
      {isLoggedIn && <img src={photoUrl} alt="Profile" />}
      <br />

      {/* Display users */}
      {users.map((user, index) => (
        <div key={index}>{user.username}</div>
      ))}

      {/* Display connection error */}
      {connectionError && <div>Error: {connectionError}</div>}

      {/* Send private message on button click */}
      {/* <button onClick={() => sendPrivateMessage("recipientId", "Hello!")}>
        Send Message
      </button> */}
    </div>
  );
}

export default Home;
