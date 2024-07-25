const { UserModel } = require("../model/userModel");

const getUsers = () => {
  return UserModel.find();
};

const getUserByProviderId = (providerId) => {
  return UserModel.findOne({ providerId: providerId });
};

const getUserById = (id) => {
  return UserModel.findById(id).exec();
};

const createUser = (userData) => {
  const newUser = new UserModel(userData);
  return newUser.save();
};

const setUserRefreshToken = (id, refreshToken) => {
  return UserModel.findByIdAndUpdate(id, { refreshToken: refreshToken });
};

const setUserProviderId = (id, providerId) => {
  return UserModel.findByIdAndUpdate(id, { providerId: providerId });
};

const getUserByRefreshToken = (refreshToken) => {
  return UserModel.findOne({ refreshToken: refreshToken });
};

const setUserImage = (id, imageUrl) => {
  return UserModel.findByIdAndUpdate(id, { imageUrl: imageUrl });
};

const setUserBio = (id, bio) => {
  return UserModel.findByIdAndUpdate(id, { bio: bio });
};

const getUserByEmail = (email) => {
  return UserModel.findOne({ email: email });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  getUserByProviderId,
  setUserRefreshToken,
  getUserByRefreshToken,
  setUserImage,
  setUserBio,
  getUserByEmail,
  setUserProviderId,
};
