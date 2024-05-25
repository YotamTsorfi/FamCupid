const express = require("express");
const multer = require("multer");
const router = express.Router();
const userBL = require("../BL/userBL");
const ensureAuthenticated = require("../middleware/authMiddleware");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_BUCKET_REGION,
});

//localhost:3000/upload/
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const user = await userBL.getUserById(req.user.id);

    if (user.imageUrl) {
      const getObjectParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: user.imageUrl,
        // Key: user.imageUrl.split("/").slice(-1)[0],
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 60 });

      user.imageUrl = url;
      res.send(user.imageUrl);
    } else {
      res.status(404).send("User image is not set");
    }
  } catch (err) {
    console.log("Error getting signed URL: ", err);
    res.status(500).send("Error getting signed URL");
  }
});

//localhost:3000/upload/
router.post(
  "/",
  ensureAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("req.body: ", req.body);
      console.log("req.file: ", req.file);

      //resize the image
      const buffer = await sharp(req.file.buffer)
        .resize({ height: 1920, width: 1080, fit: "contain" })
        .toBuffer();

      const { file } = req;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.originalname,
        Body: buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      //const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${file.originalname}`;
      const imageKey = file.originalname;
      await userBL.setUserImage(req.user.id, imageKey);

      res.send("File uploaded successfully");
    } catch (err) {
      console.error("Error in POST /upload: ", err);
      res.status(500).send("Internal server error");
    }
  }
);

//localhost:3000/upload/:id
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userBL.getUserById(id);

    if (user.imageUrl) {
      //const key = user.imageUrl.split("/").slice(-1)[0];
      const key = user.imageUrl;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);
      await s3.send(command);

      await userBL.setUserImage(id, "");
      res.send("File deleted successfully");
    } else {
      res.status(404).send("User image is not set");
    }
  } catch (err) {
    console.error("Error in DELETE /upload/:id: ", err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
