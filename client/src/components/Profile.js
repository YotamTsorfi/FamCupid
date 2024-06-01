import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Tabs, Tab } from "react-bootstrap";
import axios from "axios";
import Modal from "react-modal";

import {
  selectUserId,
  selectUsername,
  selectPhotoUrl,
  selectToken,
  selectBio,
  login,
} from "../redux/slices/userSlice";
import "./css/Profile.css";

Modal.setAppElement("#root");

const Profile = React.memo(function Profile() {
  const userId = useSelector(selectUserId);
  const username = useSelector(selectUsername);
  const photoUrl = useSelector(selectPhotoUrl);
  const token = useSelector(selectToken);
  const bio = useSelector(selectBio);

  const [selectedFile, setSelectedFile] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [key, setKey] = useState("details");
  const [userBio, setUserBio] = useState(bio || "");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
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
      })
      .catch((error) => {
        navigate("/login");
      });
  }, [dispatch, navigate]);

  useEffect(() => {
    if (userId) {
      axios
        .get(`${process.env.REACT_APP_SOCKET_SERVER}/user-images/${userId}`)
        .then((response) => {
          setImages(response.data);
        })
        .catch(console.error);
    }
  }, [userId]);

  const handleBioSave = async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SOCKET_SERVER}/users/${userId}/bio`,
        { bio: userBio },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        alert("Bio saved successfully");
      } else {
        throw new Error("Failed to save bio");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save bio");
    }
  };

  const goHome = () => {
    navigate("/home");
  };

  const handleSelect = (k) => {
    setKey(k);
  };

  const renderTabContent = () => {
    switch (key) {
      case "details":
        return (
          <>
            <h1>{username}</h1>
            <p>User ID: {userId}</p>

            <div>
              <h2>Bio</h2>
              <textarea
                value={bio || userBio}
                onChange={(e) => setUserBio(e.target.value)}
              />
              <br />
              <button onClick={handleBioSave}>Update</button>
            </div>
          </>
        );
      case "photos":
        return (
          <>
            <h2>User Photos</h2>

            <h3>Profile photo</h3>
            <img className="profile-photo" src={photoUrl} alt={username} />

            <h3>Uploaded photo</h3>
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt="Uploaded"
                className="profile-photo"
                onClick={() => {
                  setSelectedImage(image);
                  setIsModalOpen(true);
                }}
              />
            ))}

            <Modal
              isOpen={isModalOpen}
              onRequestClose={() => setIsModalOpen(false)}
              contentLabel="Selected Image"
            >
              <img src={selectedImage} alt="Selected" />
              <button onClick={() => setIsModalOpen(false)}>Close</button>
              <button onClick={() => handleFileDelete(selectedImage)}>
                Delete
              </button>
            </Modal>

            <div>
              <input
                type="file"
                onChange={(e) => handleFileSelection(e.target.files[0])}
              />
              <br />
              <button onClick={handleFileUpload}>Upload</button>
            </div>

            <br />
          </>
        );
      default:
        return null;
    }
  };

  const handleFileDelete = async (imageUrl) => {
    try {
      const imageKey = imageUrl.split("/").pop().split("?")[0];

      const response = await axios.delete(
        `http://localhost:3001/user-images/${userId}/${imageKey}`,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setImages(images.filter((image) => image.url !== imageUrl));
      alert("Image deleted successfully");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SOCKET_SERVER}/user-images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error uploading file: ", error);
    }
  };

  const handleFileSelection = (file) => {
    setSelectedFile(file);
  };

  return (
    <div>
      <h1>Profile</h1>
      <button onClick={goHome}>Go Back to Home</button>
      <Tabs
        id="controlled-tab-example"
        activeKey={key}
        onSelect={handleSelect}
        className="my-custom-tabs nav-item"
      >
        <Tab eventKey="details" title="Details" className="nav-link" />
        <Tab eventKey="photos" title="Photos" className="nav-link" />
        {/* Add more tabs as needed */}
      </Tabs>
      {renderTabContent()}
    </div>
  );
});
export default Profile;
