import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login, setError } from "./redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function useUserProfile() {
  console.log("useUserProfile hook called");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SOCKET_SERVER}/auth/profile`,
          {
            withCredentials: true,
          }
        );

        dispatch(login(response.data));
      } catch (error) {
        console.error("Error fetching user profile:", error);
        dispatch(setError(error));
        navigate("/login");
      }
    };

    fetchUserProfile();
  }, [dispatch, navigate]);
}

export function useLogin() {
  const dispatch = useDispatch();

  return (userData) => {
    dispatch(
      login({
        token: userData.token,
        userId: userData.userId,
        username: userData.username,
        photoUrl: userData.photoUrl,
        photosUrls: userData.photosUrls,
        bio: userData.bio,
      })
    );
  };
}

export const useUser = () => {
  return useSelector((state) => state.user);
};
