const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const GroupSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, auto: true },
  groupName: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }], // Reference to User model
});

const GroupModel = mongoose.model("groups", GroupSchema);

module.exports = { GroupModel };
