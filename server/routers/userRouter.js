const userBL = require("../BL/userBL");
const express = require("express");
const router = express.Router();

//http://localhost:3001/users
router.get("/", async (req, res) => {
  try {
    const users = await userBL.getUsers();
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

//http://localhost:3001/users/1
router.get("/:id", async (req, res) => {
  try {
    const user = await userBL.getUserById(req.params.id);
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

//http://localhost:3001/users/:id/bio
router.put("/:id/bio", async (req, res) => {
  try {
    const user = await userBL.setUserBio(req.params.id, req.body.bio);
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

//http://localhost:3001/users/is-blocked/:userId/:blockedUserId
router.get("/is-blocked/:userId/:blockedUserId", async (req, res) => {
  try {
    const isBlocked = await userBL.isBlocked(
      req.params.userId,
      req.params.blockedUserId
    );
    res.status(200).send({ isBlocked });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error checking if user is blocked", error });
  }
});

//http://localhost:3001/users/is-blocked-by/:userId/:blockedByUserId
router.get("/is-blocked-by/:userId/:blockedByUserId", async (req, res) => {
  try {
    const isBlockedBy = await userBL.isBlockedBy(
      req.params.userId,
      req.params.blockedByUserId
    );
    res.status(200).send({ isBlockedBy });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error checking if user is blocked by", error });
  }
});

//http://localhost:3001/users/block
router.post("/block", async (req, res) => {
  try {
    await userBL.blockUser(req.body.userId, req.body.blockUserId);
    res.status(200).send({ message: "User blocked successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error blocking user", error });
  }
});

//http://localhost:3001/users/unblock
router.post("/unblock", async (req, res) => {
  try {
    await userBL.unblockUser(req.body.userId, req.body.unblockUserId);
    res.status(200).send({ message: "User unblocked successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error unblocking user", error });
  }
});

module.exports = router;
