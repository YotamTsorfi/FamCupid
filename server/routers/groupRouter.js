const GroupBL = require("../BL/groupBL");
const express = require("express");
const router = express.Router();

// Endpoint to fetch all groups
router.get("/", async (req, res) => {
  try {
    const groups = await GroupBL.getGroups();
    res.status(200).send(groups);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Endpoint to create a group
router.post("/", async (req, res) => {
  try {
    const groupData = req.body;
    const newGroup = await GroupBL.createGroup(groupData);
    res.status(201).send(newGroup);
  } catch (error) {
    console.error("Error in router while creating group:", error);
    res.status(500).send(error.message);
  }
});

router.delete("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const deletedGroup = await GroupBL.deleteGroup(groupId);
    res.status(200).send(deletedGroup);
  } catch (error) {
    console.error("Error in router while deleting group:", error);
    res.status(500).send(error.message);
  }
});

// Endpoint to leave a group
router.patch("/:groupId/leave", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const updatedGroup = await GroupBL.leaveGroup(groupId, userId);
    res.status(200).send(updatedGroup);
  } catch (error) {
    console.error("Error in router while leaving group:", error);
    res.status(500).send(error.message);
  }
});

// Endpoint to fetch group messages
router.post("/groupHistory", async (req, res) => {
  const { groupId } = req.body;
  try {
    const messages = await GroupBL.getGroupMessages(groupId);
    res.json(messages);
  } catch (error) {
    console.error("Error in getChatHistory route:", error);
    res.status(500).send("Server error while retrieving chat history.");
  }
});
module.exports = router;
