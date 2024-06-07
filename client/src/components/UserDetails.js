import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/UserDetails.css";

function UserDetails({ user, onClose, onChat }) {
  const [signedUrls, setSignedUrls] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

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
                  alt={`Photo ${currentImageIndex + 1}`}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            ) : (
              <img
                src={signedUrls[currentImageIndex]}
                alt={`Photo ${currentImageIndex + 1}`}
                style={{ maxWidth: "200px", maxHeight: "220px" }}
                onClick={toggleImageEnlargement}
              />
            )}
            <button onClick={prevImage}>&lt;</button>
            <button onClick={nextImage}>&gt;</button>
            <span>{`${currentImageIndex + 1}/${signedUrls.length}`}</span>
          </>
        )}
      </div>
      <button onClick={() => onChat(user.id)}>Send a message</button>
      <br />
      <br />
      <button onClick={onClose}>Close Profile</button>
    </div>
  );
}

export default UserDetails;
