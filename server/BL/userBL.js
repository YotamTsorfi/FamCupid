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

const blockUser = async (userId, blockUserId) => {
  await UserModel.findByIdAndUpdate(userId, {
    $addToSet: { blockedUsers: blockUserId },
  });
  await UserModel.findByIdAndUpdate(blockUserId, {
    $addToSet: { blockedByUsers: userId },
  });
};

const unblockUser = async (userId, unblockUserId) => {
  await UserModel.findByIdAndUpdate(userId, {
    $pull: { blockedUsers: unblockUserId },
  });
  await UserModel.findByIdAndUpdate(unblockUserId, {
    $pull: { blockedByUsers: userId },
  });
};

const isBlocked = async (userId, blockedUserId) => {
  const user = await UserModel.findById(userId);
  return user.blockedUsers.includes(blockedUserId);
};

const isBlockedBy = async (userId, blockedByUserId) => {
  const user = await UserModel.findById(userId);
  return user.blockedByUsers.includes(blockedByUserId);
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
  blockUser,
  unblockUser,
  isBlocked,
  isBlockedBy,
};
