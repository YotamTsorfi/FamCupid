const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const userBL = require("../BL/userBL");

//http://localhost:3001/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async function (req, res) {
    // Successful authentication, redirect home.
    const token = jwt.sign(
      {
        id: req.user.id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        id: req.user.id.toString(),
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    await userBL.setUserRefreshToken(req.user.id, refreshToken);

    // Set tokens as HttpOnly cookies
    res.cookie("token", token, { httpOnly: true, sameSite: "strict" });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
    });

    // Redirect to the home page in the client
    res.redirect(`${process.env.CLIENT_URL}/home`);
  }
);

//http://localhost:3001/auth/profile
router.get("/profile", async (req, res) => {
  // Get the token from the cookies
  const token = req.cookies.token;

  // If there's no token, return an error
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user's ID from the token
    const userId = decoded.id;

    // Get the user from the database
    const user = await userBL.getUserById(userId);

    // If there's no user, return an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user's profile
    res.json({
      userId: user._id,
      username: user.username,
      photoUrl: user.photoUrl,
      photosUrls: user.photosUrls,
      token: token,
      bio: user.bio,
    });
  } catch (error) {
    // If the token is invalid, return an error
    res.status(401).json({ message: "Not authenticated" });
  }
});

//localhost:3001/auth/google
// For development, use the following line
router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

// For production, use the following line
// router.get(
//   "/google",
//   passport.authenticate("google", {
//     scope: ["profile"],
//     prompt: "select_account", //force login
//   })
// );

//localhost:3001/auth/
router.get(
  "/",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async function (req, res) {
    // Successful authentication, redirect home.
    const token = jwt.sign(
      {
        id: req.user.id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        id: req.user.id.toString(),
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    await userBL.setUserRefreshToken(req.user.id, refreshToken);

    // Redirect to the home page with the token in the URL
    res.json({ token: token, refreshToken: refreshToken, userId: req.user.id });
  }
);

router.get("/logout", async (req, res) => {
  console.log("Logging out...");

  if (req.user) {
    console.log("User ID:", req.user.id);

    try {
      // Remove the refresh token from the user's record in the database
      console.log("Before setUserRefreshToken");
      await userBL.setUserRefreshToken(req.user.id, "");
      console.log("After setUserRefreshToken");
    } catch (e) {
      console.error("Error setting user refresh token:", e);
    }

    // Delete the req.user property
    delete req.user;
  }

  // Destroy the session
  req.session.destroy(function (err) {
    if (err) {
      console.log("Error destroying session:", err);
    } else {
      console.log("Session destroyed successfully");
    }

    // Clear the tokens from the client side
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    // Send a response
    res.status(200).json({ message: "Logged out" });
  });
});

//localhost:3001/auth/token
router.post("/token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.sendStatus(401); // Unauthorized
  }

  const user = await userBL.getUserByRefreshToken(refreshToken);

  if (!user) {
    return res.sendStatus(403);
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      const newToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const newRefreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );

      await userBL.setUserRefreshToken(user.id, newRefreshToken);

      res.json({ token: newToken, refreshToken: newRefreshToken });
    }
  );
});

router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async function (req, res) {
    // Successful authentication, redirect home.
    const token = jwt.sign(
      {
        id: req.user.id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        id: req.user.id.toString(),
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    await userBL.setUserRefreshToken(req.user.id, refreshToken);

    // Set tokens as HttpOnly cookies
    res.cookie("token", token, { httpOnly: true, sameSite: "strict" });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
    });

    // Redirect to the home page in the client
    res.redirect(`${process.env.CLIENT_URL}/home`);
  }
);

module.exports = router;
