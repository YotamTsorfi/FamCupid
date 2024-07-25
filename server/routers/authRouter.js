const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const userBL = require("../BL/userBL");
const bcrypt = require("bcrypt");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_BUCKET_REGION,
});

async function generateSignedUrl(objectKey) {
  try {
    // Remove leading slash if present
    if (objectKey.startsWith("/")) {
      objectKey = objectKey.substring(1);
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: objectKey,
      Expires: 60 * 60, // URL will be valid for 1 hour
    };

    const command = new GetObjectCommand(params);
    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: params.Expires,
    });

    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL", error);
    throw error;
  }
}

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
//-----------------------------------------------------------------------------
//http://localhost:3001/auth/profile
router.get("/profile", async (req, res) => {
  // Get the token from the cookies
  const token = req.cookies.token;

  // If there's no token, return an error
  if (!token) {
    console.error("Token is undefined or not received."); // Additional debugging line
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user's ID from the token
    const userId = decoded.id;

    // Get the user from the database
    const user = await userBL.getUserById(userId);

    // If there's no user, return an error
    if (!user) {
      console.error("User not found in database."); // Additional debugging line
      return res.status(404).json({ message: "User not found" });
    }

    // Check if photoUrl is an S3 object key and generate a signed URL if necessary
    if (user.photoUrl && !user.photoUrl.startsWith("http")) {
      user.photoUrl = await generateSignedUrl(user.photoUrl);
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
    if (error.name === "TokenExpiredError") {
      // Optionally, log the token expiration for debugging
      console.error("Token expired at:", error.expiredAt);
      // Respond with a specific status code or message indicating token expiration
      return res
        .status(401)
        .json({ message: "Token expired", expiredAt: error.expiredAt });
    } else {
      // Handle other errors as before
      console.error("Error verifying token or fetching user:", error);
      return res.status(401).json({ message: "Not authenticated" });
    }
  }
});
//-----------------------------------------------------------------------------
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
//-----------------------------------------------------------------------------
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
//-----------------------------------------------------------------------------
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
//-----------------------------------------------------------------------------
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
//-----------------------------------------------------------------------------
router.get("/facebook", passport.authenticate("facebook"));
//-----------------------------------------------------------------------------
// /facebook/callback",
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
//-----------------------------------------------------------------------------
//localhost:3001/auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Checking for user with email:", email);
    const existingUser = await userBL.getUserByEmail(email);
    console.log("Result from getUserByEmail:", existingUser);

    if (!existingUser) {
      console.log("Hashing password");
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Password hashed:", hashedPassword);

      const username = email.split("@")[0];
      console.log("Creating user with username:", username);

      const user = await userBL.createUser({
        email,
        username: username,
        password: hashedPassword,
        provider: "local",
      });
      console.log("User created:", user);

      const updatedUser = await userBL.setUserProviderId(user._id, user._id);
      console.log("User updated with providerId:", updatedUser);

      return res.status(201).json({ message: "New user created.", user: user });
    } else {
      return res.status(409).json({ message: "User already exists." });
    }
  } catch (error) {
    console.error("Error in registration process:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});
//-----------------------------------------------------------------------------
// localhost:3001/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await userBL.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate tokens
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Store refresh token in the user's object in the DB
    await userBL.setUserRefreshToken(user._id.toString(), refreshToken);

    // Set tokens as HttpOnly cookies
    res.cookie("token", token, { httpOnly: true, sameSite: "strict" });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
    });

    // Send tokens to client directly in response body
    return res.status(200).json({
      message: "Login successful.",
      user: user,
      token: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});
module.exports = router;
