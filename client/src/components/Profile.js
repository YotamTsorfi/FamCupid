import { useUserProfile, useUser } from "../hooks";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import Modal from "react-modal";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./css/Profile.css";

Modal.setAppElement("#root");

function Profile() {
  const { userId, username, photoUrl, bio, token } = useUser();
  useUserProfile();

  const [selectedFile, setSelectedFile] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [key, setKey] = useState("details");
  const [userBio, setUserBio] = useState(bio || "");
  const [userPhotoUrl, setUserPhotoUrl] = useState(photoUrl);

  const navigate = useNavigate();

  useEffect(() => {
    // Update userPhotoUrl if photoUrl changes
    setUserPhotoUrl(photoUrl);
  }, [photoUrl]);

  useEffect(() => {
    setUserBio(bio || "");
  }, [bio]);

  useEffect(() => {
    const savedTabKey = localStorage.getItem("activeTabKey");
    if (savedTabKey) {
      setKey(savedTabKey);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      axios
        .get(`${process.env.REACT_APP_SOCKET_SERVER}/user-images/${userId}`)
        .then((response) => {
          setImages(response.data);
        })
        .catch((error) => {
          console.error(error);
          toast.error("Failed to fetch user images");
        });
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
        toast.success("Bio saved successfully");
      } else {
        throw new Error("Failed to save bio");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save bio");
    }
  };

  const goHome = () => {
    navigate("/home");
  };

  const handleSelect = (k) => {
    setKey(k);
    localStorage.setItem("activeTabKey", k);
  };

  const renderTabContent = () => {
    switch (key) {
      case "details":
        return (
          <div className="fade-in" key={key}>
            <h2>Bio</h2>
            <textarea
              className="textarea-fixed"
              placeholder="Here you can write your bio"
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
            />
            <br />
            <button className="update-button" onClick={handleBioSave}>
              Update
            </button>
          </div>
        );
      case "photos":
        return (
          <div className="fade-in" key={key}>
            <h3>Uploaded photos</h3>
            <div className="photos-container">
              {images.map((image, index) => (
                <div key={index} className="uploaded-photo-container">
                  <button
                    className="set-profile-photo-btn"
                    onClick={() => setAsProfilePhoto(image)}
                  >
                    Set as Profile Photo
                  </button>
                  <img
                    src={image}
                    alt="Uploaded"
                    className="profile-photo"
                    onClick={() => {
                      setSelectedImage(image);
                      setIsModalOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>

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
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file.size > 1048576) {
                    toast.error("File size should be less than 1MB");
                  } else {
                    handleFileSelection(file);
                  }
                }}
              />
              <br />
              <button onClick={handleFileUpload}>Upload</button>
            </div>

            <br />
          </div>
        );
      default:
        return null;
    }
  };

  const setAsProfilePhoto = async (imageUrl) => {
    try {
      const photoKey = imageUrl
        .split(process.env.REACT_APP_S3_BUCKET_BASE_URL)[1]
        .split("?")[0];

      const response = await axios.put(
        `${process.env.REACT_APP_SOCKET_SERVER}/user-images/${userId}/profile-photo`,
        { photoKey: photoKey },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Profile photo updated successfully");
        setUserPhotoUrl(imageUrl);
      } else {
        throw new Error("Failed to update profile photo");
      }
    } catch (error) {
      console.error("Error setting profile photo: ", error);
      toast.error("Failed to set profile photo");
    }
  };

  const handleFileDelete = async (imageUrl) => {
    try {
      const imageKey = imageUrl.split("/").pop().split("?")[0];

      const response = await axios.delete(
        `${process.env.REACT_APP_SOCKET_SERVER}/user-images/${userId}/${imageKey}`,
        // `http://localhost:3001/user-images/${userId}/${imageKey}`,
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

      setImages(images.filter((image) => image !== imageUrl));
      setIsModalOpen(false);
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete image");
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

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const imageUrl = URL.createObjectURL(selectedFile);
      setImages((prevImages) => [...prevImages, imageUrl]);

      // console.log(response.data);
      toast.success("Image successfully uploaded");
    } catch (error) {
      console.error("Error uploading file: ", error);
      toast.error("Failed to upload image");
    }
  };

  const handleFileSelection = (file) => {
    setSelectedFile(file);
  };

  return (
    <div>
      <ToastContainer />
      <button className="go-home-button" onClick={goHome}>
        Home
      </button>
      <button className="members-button" onClick={() => navigate("/members")}>
        Chat Online Members
      </button>
      <h1>Profile</h1>
      <img className="profile-photo" src={userPhotoUrl} alt={username} />
      <Tabs
        id="controlled-tab-example"
        activeKey={key}
        onSelect={handleSelect}
        className="my-custom-tabs nav-item"
      >
        <Tab eventKey="details" title="Details" className="nav-link" />
        <Tab eventKey="photos" title="Photos" className="nav-link" />
      </Tabs>
      {renderTabContent()}
    </div>
  );
}
export default Profile;
