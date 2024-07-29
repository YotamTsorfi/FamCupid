const mongoose = require("mongoose");
const { GroupModel } = require("../model/groupModel");

const createGroup = async (groupData) => {
  try {
    const { groupName, members } = groupData;

    // Convert member IDs to ObjectIds
    const memberObjectIds = members.map(
      (memberId) => new mongoose.Types.ObjectId(memberId)
    );

    const group = new GroupModel({
      groupName,
      members: memberObjectIds,
    });

    await group.save();

    // Populate members before returning the group
    const populatedGroup = await GroupModel.findById(group._id).populate(
      "members",
      "username"
    );

    return populatedGroup;
  } catch (error) {
    console.error("Error in createGroup function:", error);
    throw new Error(`Error creating group: ${error.message}`);
  }
};

const addUserToGroup = async (groupId, userId) => {
  try {
    const group = await GroupModel.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    return group;
  } catch (error) {
    throw new Error(`Error adding user to group: ${error.message}`);
  }
};

const removeUserFromGroup = async (groupId, userId) => {
  try {
    const group = await GroupModel.findOne({ groupId });
    if (!group) {
      throw new Error("Group not found");
    }
    group.members = group.members.filter((id) => id !== userId);
    await group.save();
    return group;
  } catch (error) {
    throw new Error(`Error removing user from group: ${error.message}`);
  }
};

const listGroupsByUserId = async (userId) => {
  try {
    const groups = await GroupModel.find({ members: userId });
    return groups;
  } catch (error) {
    throw new Error(`Error listing groups: ${error.message}`);
  }
};

const getGroups = async () => {
  try {
    const groups = await GroupModel.find({}).populate("members");
    return groups;
  } catch (error) {
    throw new Error(`Error fetching groups: ${error.message}`);
  }
};

const deleteGroup = async (groupId) => {
  try {
    const result = await GroupModel.findByIdAndDelete(groupId);
    if (!result) {
      throw new Error("Group not found");
    }
    return result;
  } catch (error) {
    console.error("Error in deleteGroup function:", error);
    throw new Error(`Error deleting group: ${error.message}`);
  }
};

const getGroupById = async (groupId) => {
  try {
    const group = await GroupModel.findById(groupId).populate("members");
    return group;
  } catch (error) {
    console.error("Error in getGroupById function:", error);
    throw new Error(`Error fetching group: ${error.message}`);
  }
};

module.exports = {
  createGroup,
  addUserToGroup,
  removeUserFromGroup,
  listGroupsByUserId,
  getGroups,
  deleteGroup,
  getGroupById,
};
