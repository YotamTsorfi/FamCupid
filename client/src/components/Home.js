import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUsername,
  selectPhotoUrl,
  login,
} from "../redux/slices/userSlice";
import "./css/Home.css";

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const username = useSelector(selectUsername);
  const photoUrl = useSelector(selectPhotoUrl);

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
            token: response.data.token,
            bio: response.data.bio,
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

  // Logout function
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

  const handleProfileRedirect = () => {
    navigate("/profile");
  };

  return (
    <div className="home">
      <h1 className="home__welcome">Welcome, {username}!</h1>
      <div className="profile-card">
        <img className="profile-card__photo" src={photoUrl} alt={username} />
        <h2 className="profile-card__name">{username}</h2>
        <p className="profile-card__bio">Bio goes here...</p>
        <button className="button" onClick={handleProfileRedirect}>
          View Profile
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
