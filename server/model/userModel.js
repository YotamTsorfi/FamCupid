const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String },
  provider: { type: String, required: true }, // 'local', 'google', or 'facebook'
  providerId: { type: String, unique: true }, // unique ID from the provider
  photoUrl: { type: String },
  photosUrls: [String],
  bio: { type: String },
  likes: [String],
  dislikes: [String],
  matches: [String],
  imageUrl: { type: String },
  refreshToken: { type: String },
  email: { type: String },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  blockedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const UserModel = mongoose.model("users", UserSchema);

module.exports = {
  UserModel,
};
