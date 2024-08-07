import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/UserDetails.css";

function UserDetails({ user, onClose, onChat, currentUser }) {
  const [signedUrls, setSignedUrls] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SOCKET_SERVER}/user-images/${user.id}`
        );
        setSignedUrls(response.data);
      } catch (error) {
        console.error("Error fetching signed URLs:", error);
      }
    };

    fetchSignedUrls();
  }, [user.id]);

  useEffect(() => {
    const checkIfBlocked = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SOCKET_SERVER}/users/is-blocked/${currentUser.id}/${user.id}`
        );
        setIsBlocked(response.data.isBlocked);
      } catch (error) {
        console.error("Error checking if user is blocked:", error);
      }
    };

    const checkIfBlockedBy = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SOCKET_SERVER}/users/is-blocked-by/${currentUser.id}/${user.id}`
        );
        setIsBlockedBy(response.data.isBlockedBy);
      } catch (error) {
        console.error("Error checking if user is blocked by:", error);
      }
    };

    checkIfBlocked();
    checkIfBlockedBy();
  }, [currentUser.id, user.id]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % signedUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + signedUrls.length) % signedUrls.length
    );
  };

  const toggleImageEnlargement = () => {
    setIsImageEnlarged(!isImageEnlarged);
  };

  const handleBlockUser = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_SOCKET_SERVER}/users/block`, {
        userId: currentUser.id,
        blockUserId: user.id,
      });
      setIsBlocked(true);
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleUnblockUser = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_SOCKET_SERVER}/users/unblock`, {
        userId: currentUser.id,
        unblockUserId: user.id,
      });
      setIsBlocked(false);
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  return (
    <div className="user-details-modal">
      <h2>{user.username}</h2>
      <p>{user.bio}</p>

      <div className="user-photos">
        {signedUrls.length > 0 && (
          <>
            {isImageEnlarged ? (
              <div
                className="enlarged-image-container"
                onClick={toggleImageEnlargement}
              >
                <img
                  src={signedUrls[currentImageIndex]}
                  alt={`${currentImageIndex + 1}`}
                  className="reduce-cursor"
                />
              </div>
            ) : (
              <img
                src={signedUrls[currentImageIndex]}
                alt={`${currentImageIndex + 1}`}
                onClick={toggleImageEnlargement}
                className="enlarge-cursor"
              />
            )}
            <button onClick={prevImage}>&lt;</button>
            <button onClick={nextImage}>&gt;</button>
            <span>{`${currentImageIndex + 1}/${signedUrls.length}`}</span>
          </>
        )}
      </div>
      {!isBlocked && !isBlockedBy && (
        <button onClick={() => onChat(user.id)}>Send a message</button>
      )}
      <br />
      <br />
      {isBlocked ? (
        <button onClick={handleUnblockUser}>Unblock User</button>
      ) : (
        <button onClick={handleBlockUser}>Block User</button>
      )}
      <br />
      <br />
      <button onClick={onClose}>Close Profile</button>
    </div>
  );
}

export default UserDetails;
