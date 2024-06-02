import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { login } from "./redux/slices/userSlice";

export function useUserProfile(onSuccess, onFailure) {
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SOCKET_SERVER}/auth/profile`,
          {
            withCredentials: true,
          }
        );

        onSuccess(response);
      } catch (error) {
        onFailure(error);
      }
    };

    fetchUserProfile();
  }, [onSuccess, onFailure]);
}

export function useLogin() {
  const dispatch = useDispatch();

  return (userData) => {
    dispatch(
      login({
        userId: userData.userId,
        username: userData.username,
        photoUrl: userData.photoUrl,
        token: userData.token,
        bio: userData.bio,
      })
    );
  };
}

export const useUser = () => {
  return useSelector((state) => state.user);
};
