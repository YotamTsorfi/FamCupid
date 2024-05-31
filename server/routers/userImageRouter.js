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

//localhost:3001/user-images/:userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await userBL.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const images = await Promise.all(
      user.photosUrls.map(async (imageUrl) => {
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: imageUrl,
          Expires: 60 * 60, // URL will be valid for 1 hour
        };

        const command = new GetObjectCommand(params);
        const url = await getSignedUrl(s3, command, {
          expiresIn: params.Expires,
        });
        return url;
      })
    );

    res.status(200).send(images);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

//localhost:3001/user-images
router.post(
  "/",
  ensureAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("req.body: ", req.body);
      console.log("req.file: ", req.file);
      console.log("req.user.id: ", req.user.id);

      //resize the image
      const buffer = await sharp(req.file.buffer)
        .resize({ height: 1920, width: 1080, fit: "contain" })
        .toBuffer();

      const { file } = req;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${req.user.id}/${file.originalname}`,
        Body: buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      const user = await userBL.getUserById(req.user.id);
      user.photosUrls.push(params.Key);
      await user.save();

      const urlParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: params.Key,
        Expires: 60 * 60, // URL valid for 1 hour
      };

      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand(urlParams),
        { expiresIn: urlParams.Expires }
      );

      res.send({ message: "File uploaded successfully", imageUrl: signedUrl });

      //res.send("File uploaded successfully");
    } catch (err) {
      console.error("Error in POST /upload: ", err);
      res.status(500).send("Internal server error");
    }
  }
);

//localhost:3001/user-images/:id
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
