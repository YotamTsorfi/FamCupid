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

module.exports = router;
