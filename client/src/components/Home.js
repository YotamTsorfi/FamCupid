import { useUserProfile, useLogin, useUser } from "../hooks";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./css/Home.css";

function Home() {
  const navigate = useNavigate();
  const loginUser = useLogin();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const { username, photoUrl, bio } = useUser();

  useUserProfile(
    (response) => {
      if (!isLoggedIn) {
        return;
      }
      loginUser(response.data);
      setLoading(false);
    },
    (error) => {
      setIsLoggedIn(false);
      navigate("/login");
    }
  );

  if (error) {
    return <div>Error: {error}</div>;
  }

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
      <h1 className="home__welcome">Welcome, {username}!</h1>
      <div className="profile-card">
        <img className="profile-card__photo" src={photoUrl} alt={username} />
        <p className="profile-card__bio">{bio}</p>
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
