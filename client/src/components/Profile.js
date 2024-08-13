import { useUserProfile, useUser } from "../hooks";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import Modal from "react-modal";
import socket from "../services/socket";
import "react-toastify/dist/ReactToastify.css";
import "./css/Profile.css";

Modal.setAppElement("#root");

function Profile() {
  const { userId, username, photoUrl, bio, token, email } = useUser();
  useUserProfile();

  const [selectedFile, setSelectedFile] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [key, setKey] = useState("details");
  const [userBio, setUserBio] = useState(bio || "");
  const [userPhotoUrl, setUserPhotoUrl] = useState(photoUrl);

  const navigate = useNavigate();
  //---------------------------------
  useEffect(() => {
    // Update userPhotoUrl if photoUrl changes
    setUserPhotoUrl(photoUrl);
  }, [photoUrl]);
  //---------------------------------
  useEffect(() => {
    setUserBio(bio || "");
  }, [bio]);
  //---------------------------------
  useEffect(() => {
    const savedTabKey = localStorage.getItem("activeTabKey");
    if (savedTabKey) {
      setKey(savedTabKey);
    }
  }, []);
  //----------------------------------------
  useEffect(() => {
    if (userId) {
      const handleSignedUrls = (data) => {
        setImages(data.urls);
      };

      socket.emit("getSignedUrls", { userId: userId });

      socket.on("signedUrls", handleSignedUrls);

      socket.on("error", (error) => {
        console.error("Socket.io error:", error);
      });

      return () => {
        socket.off("signedUrls", handleSignedUrls);
        socket.off("error");
      };
    }
  }, [userId]);

  //----------------------------------------
  const handleBioSave = async () => {
    try {
      socket.emit("saveUserBio", { userId, bio: userBio, token });

      socket.on("bioSaved", (response) => {
        if (response.status === 200) {
          toast.success("Bio saved successfully");
        } else {
          throw new Error("Failed to save bio");
        }
      });

      socket.on("error", (error) => {
        console.error("Socket.io error:", error);
        toast.error("Failed to save bio");
      });

      return () => {
        socket.off("bioSaved");
        socket.off("error");
      };
    } catch (error) {
      console.error(error);
      toast.error("Failed to save bio");
    }
  };
  //----------------------------------------
  const goHome = () => {
    navigate("/home");
  };

  const handleSelect = (k) => {
    setKey(k);
    localStorage.setItem("activeTabKey", k);
  };
  //---------------------------------
  const renderTabContent = () => {
    switch (key) {
      case "details":
        return (
          <div className="fade-in" key={key}>
            <p>Email: {email}</p>
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
  //---------------------------------
  const setAsProfilePhoto = async (imageUrl) => {
    try {
      if (!imageUrl) {
        throw new Error("Image URL is undefined");
      }

      if (!process.env.REACT_APP_S3_BUCKET_BASE_URL) {
        throw new Error("S3 Bucket Base URL is undefined");
      }

      let photoKey;
      if (imageUrl.startsWith("blob:")) {
        // Handle blob URL case
        photoKey = imageUrl; // You might need to handle blob URLs differently
      } else if (imageUrl.includes(process.env.REACT_APP_S3_BUCKET_BASE_URL)) {
        // Handle S3 URL case
        photoKey = imageUrl
          .split(process.env.REACT_APP_S3_BUCKET_BASE_URL)[1]
          .split("?")[0];
      } else {
        throw new Error("Image URL does not contain the S3 Bucket Base URL");
      }

      // Emit the event to set the profile photo
      socket.emit("setProfilePhoto", { userId, photoKey, token });

      // Listen for the success event
      socket.once("setProfilePhotoSuccess", (data) => {
        toast.success("Profile photo updated successfully");
        setUserPhotoUrl(imageUrl);
      });

      // Listen for the error event
      socket.once("setProfilePhotoError", (error) => {
        console.error("Error setting profile photo: ", error);
        toast.error("Failed to set profile photo");
      });
    } catch (error) {
      console.error("Error setting profile photo: ", error);
      toast.error("Failed to set profile photo");
    }
  };
  //---------------------------------
  const handleFileDelete = (imageUrl) => {
    const imageKey = imageUrl.split("/").pop().split("?")[0];

    socket.emit("deleteImage", { userId, imageKey, token });

    socket.once("deleteImageSuccess", () => {
      setImages(images.filter((image) => image !== imageUrl));
      setIsModalOpen(false);
      toast.success("Image deleted successfully");
    });

    socket.once("deleteImageError", (error) => {
      console.error("Error:", error);
      toast.error("Failed to delete image");
    });

    return () => {
      socket.off("deleteImageSuccess");
      socket.off("deleteImageError");
    };
  };
  //---------------------------------
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("userId", userId);

    try {
      const file = selectedFile;
      const userId = formData.get("userId");

      // Read the file as an ArrayBuffer
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        const fileBuffer = reader.result;

        // Emit the file upload event with the file buffer and other data
        socket.emit("uploadImage", {
          file: fileBuffer,
          fileName: file.name,
          fileType: file.type,
          userId,
          token,
        });

        // Listen for the success event
        socket.once("uploadImageSuccess", (data) => {
          const imageUrl = URL.createObjectURL(file);
          setImages((prevImages) => [...prevImages, imageUrl]);
          toast.success("Image successfully uploaded");
        });

        // Listen for the error event
        socket.once("uploadImageError", (error) => {
          console.error("Error uploading file: ", error);
          toast.error("Failed to upload image");
        });
      };
    } catch (error) {
      console.error("Error uploading file: ", error);
      toast.error("Failed to upload image");
    }
  };
  //---------------------------------
  const handleFileSelection = (file) => {
    setSelectedFile(file);
  };

  return (
    <div>
      <ToastContainer />
      <button className="go-home-button" onClick={goHome}>
        Home
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
