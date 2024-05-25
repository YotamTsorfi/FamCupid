const userBL = require("../BL/userBL");
const express = require("express");
const router = express.Router();

//http://localhost:3000/users
router.get("/", async (req, res) => {
  try {
    const users = await userBL.getUsers();
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

//http://localhost:3000/users/1
router.get("/:id", async (req, res) => {
  try {
    const user = await userBL.getUserById(req.params.id);
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
