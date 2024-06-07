import { useUserProfile, useUser } from "../hooks";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/Home.css";

function Home() {
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const navigate = useNavigate();
  const user = useUser();

  useUserProfile();

  if (error) {
    return <div>Error: {error}</div>;
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
      })
      .catch((error) => {
        setError("An error occurred while logging out.");
      });
  };

  const handleProfileRedirect = () => {
    navigate("/profile");
  };

  return (
    <div className="home">
      <h1 className="home__welcome">Welcome, {user.username}!</h1>
      <div className="profile-card">
        <img
          className="profile-card__photo"
          src={user.photoUrl}
          alt={user.username}
        />
        <p className="profile-card__bio">{user.bio}</p>
        <button className="profile-button" onClick={handleProfileRedirect}>
          Profile
        </button>

        <br />

        {isLoggedIn && (
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;
