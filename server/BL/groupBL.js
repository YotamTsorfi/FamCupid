const mongoose = require("mongoose");
const { GroupModel } = require("../model/groupModel");
//-------------------------------------------------------------------------
const getGroupMessages = async (groupId) => {
  try {
    // Validate input parameter
    if (!groupId) {
      throw new Error("Missing required parameter: groupId");
    }

    // Find the group by groupId and populate the members field
    const group = await GroupModel.findById(groupId).populate("members");
    if (!group) {
      throw new Error("Group not found");
    }

    return group.messages; // Return the group's messages array
  } catch (error) {
    console.error("Error in getGroupMessages function:", error);
    throw new Error(`Error fetching group messages: ${error.message}`);
  }
};
//-------------------------------------------------------------------------
const insertGroupMessage = async (messageWrapper) => {
  try {
    // console.log("insertGroupMessage: ", messageWrapper);

    // Extract the nested message object
    const { message } = messageWrapper;

    // Validate input parameters
    const { groupId, senderId, senderUsername, content, timestamp } = message;
    if (!groupId || !senderId || !content || !timestamp || !senderUsername) {
      throw new Error("Missing required parameters");
    }

    // Find the group by groupId
    const group = await GroupModel.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Create a new message object
    const newMessage = {
      senderId,
      senderUsername,
      content,
      timestamp,
    };

    // Push the new message to the group's messages array
    group.messages.push(newMessage);

    // Save the updated group document
    await group.save();

    return group;
  } catch (error) {
    console.error("Error in insertGroupMessage function:", error);
    throw new Error(`Error inserting group message: ${error.message}`);
  }
};
//-------------------------------------------------------------------------
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
//-------------------------------------------------------------------------
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
//-------------------------------------------------------------------------
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
//-------------------------------------------------------------------------
const listGroupsByUserId = async (userId) => {
  try {
    const groups = await GroupModel.find({ members: userId });
    return groups;
  } catch (error) {
    throw new Error(`Error listing groups: ${error.message}`);
  }
};
//-------------------------------------------------------------------------
const getGroups = async () => {
  try {
    const groups = await GroupModel.find({}).populate("members");
    return groups;
  } catch (error) {
    throw new Error(`Error fetching groups: ${error.message}`);
  }
};
//-------------------------------------------------------------------------
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

//-------------------------------------------------------------------------
const getGroupById = async (groupId) => {
  try {
    const group = await GroupModel.findById(groupId).populate("members");
    return group;
  } catch (error) {
    console.error("Error in getGroupById function:", error);
    throw new Error(`Error fetching group: ${error.message}`);
  }
};

//-------------------------------------------------------------------------
async function getGroupByIdWithMessagesPopulated(groupId) {
  return await GroupModel.findById(groupId).populate({
    path: "messages.senderId",
    model: "users",
    select: "username",
  });
}

//-------------------------------------------------------------------------
const leaveGroup = async (groupId, userId) => {
  try {
    const group = await GroupModel.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId
    );

    const updatedGroup = await group.save();
    return updatedGroup;
  } catch (error) {
    console.error("Error in BL while leaving group:", error);
    throw error;
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
  insertGroupMessage,
  getGroupMessages,
  getGroupByIdWithMessagesPopulated,
  leaveGroup,
};
