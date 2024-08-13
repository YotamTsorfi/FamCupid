const ChatBL = require("../BL/chatBL");
const GroupBL = require("../BL/groupBL");
const UserBL = require("../BL/userBL");
const socketIO = require("socket.io");
const users = {};

const sharp = require("sharp");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_BUCKET_REGION,
});
//------------------------------------------------------------
function socketController(server) {
  // Create socket server
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  //------------------------------------------------------------
  // Handle socket connection
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    //------------------------------------------------------------
    // Handle user login
    socket.on("login", (user) => {
      console.log("User logged in:", user.username);
      // Check that the user object contains all the necessary properties
      if (user && user.id && user.username && user.photoUrl && user.bio) {
        // Add user to online users list
        users[user.id] = { socketId: socket.id, ...user };

        // Emit updated online users list
        io.emit("onlineUsers", Object.values(users));
      } else {
        console.log("Received incomplete user object:", user);
      }
    });

    //------------------------------------------------------------
    function findSocketByUserId(userId) {
      const user = users[userId];
      return user ? io.sockets.sockets.get(user.socketId) : null;
    }
    //------------------------------------------------------------
    // Handle private message event
    socket.on(
      "private_message",
      ({ senderId, recipientId, message, timestamp }) => {
        // console.log("Received private message:", {
        //   senderId,
        //   recipientId,
        //   message,
        //   timestamp,
        // });

        // Find recipient's socket
        const recipientSocket = findSocketByUserId(recipientId);
        if (recipientSocket) {
          //store message in database
          storeMessage(senderId, recipientId, message, timestamp);

          // Emit private message to recipient
          recipientSocket.emit("private_message", {
            senderId,
            recipientId,
            message,
            timestamp,
          });
        }
      }
    );
    //------------------------------------------------------------
    // Store private message in database
    function storeMessage(senderId, recipientId, message, timestamp) {
      const messageObj = {
        senderId,
        recipientId,
        message,
        timestamp,
      };

      ChatBL.insertOrUpdateChat(messageObj).then((message) => {
        console.log("Message stored successfully:", message);
        // console.log("Message stored successfully:", message);
      });
    }
    //------------------------------------------------------------
    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      // Find user associated with the socket and remove them from online users list
      const userId = Object.keys(users).find(
        (key) => users[key].socketId === socket.id
      );
      if (userId) delete users[userId];

      // Emit updated online users list
      io.emit("onlineUsers", Object.values(users));
    });
    //------------------------------------------------------------
    socket.on("block_user", async ({ userId, blockedUserId }) => {
      // console.log("Server: Blocking user:", { userId, blockedUserId });
      try {
        await UserBL.blockUser(userId, blockedUserId);
        io.emit("user_blocked", { userId, blockedUserId });
      } catch (error) {
        console.error("Server: Error blocking user:", error.message);
      }
    });
    //------------------------------------------------------------
    socket.on("unblock_user", async ({ userId, blockedUserId }) => {
      // console.log("Server: Unblocking user:", { userId, blockedUserId });
      try {
        await UserBL.unblockUser(userId, blockedUserId);
        io.emit("user_unblocked", { userId, blockedUserId });
      } catch (error) {
        console.error("Server: Error unblocking user:", error.message);
      }
    });

    //---------------------------Group Chat

    // Handle new group event
    socket.on("new_group", async (newGroup) => {
      const createdGroup = await GroupBL.createGroup(newGroup);
      console.log("New group created:", newGroup);
      // Broadcast the new group to all connected clients
      io.emit("new_group", createdGroup);
    });

    socket.on("delete_group", async (groupId) => {
      const deletedGroup = await GroupBL.deleteGroup(groupId);
      console.log("Group deleted:", groupId);

      // Broadcast the deleted group ID to all connected clients
      io.emit("delete_group", deletedGroup);
    });
    //------------------------------------------------------------
    //Handle group message event
    socket.on("group_message", async (message) => {
      const { groupId } = message;

      try {
        await GroupBL.insertGroupMessage({ message });
        console.log("Message stored in database");

        // Emit the message to all members of the group
        console.log("Emitting group message to group:", groupId);
        io.emit("group_message", message);
      } catch (error) {
        console.error("Error handling group message:", error.message);
      }
    });
    //------------------------------------------------------------
    // Handle Leave Group event
    socket.on("leave_group", async ({ groupId, userId }) => {
      try {
        const updatedGroup = await GroupBL.leaveGroup(groupId, userId);
        console.log("User left group:", { groupId, userId });

        // Emit updated group to all members
        io.emit("leave_group", { updatedGroup, userId });
      } catch (error) {
        console.error("Error leaving group:", error.message);
      }
    });
    //------------------------------------------------------------
    // Handle fetching group chat history
    socket.on("fetchGroupHistory", async ({ groupId }) => {
      try {
        const chatHistory = await GroupBL.getGroupMessages(groupId);
        socket.emit("groupHistoryResponse", chatHistory);
      } catch (error) {
        console.error("Server: Error fetching group history:", error.message);
        socket.emit("groupHistoryError", {
          message: "Failed to fetch chat history",
        });
      }
    });
    //------------------------------------------------------------
    // Handle fetching groups
    socket.on("fetchGroups", async () => {
      try {
        // Fetch groups from the database
        const groups = await GroupBL.getGroups();

        socket.emit("groupsResponse", groups);
      } catch (error) {
        console.error("Server: Error fetching groups:", error.message);
        socket.emit("groupsError", { message: "Failed to fetch groups" });
      }
    });
    //------------------------------------------------------------
    // Handle fetching users
    socket.on("fetchUsers", async () => {
      try {
        // Fetch users from the database
        const users = await UserBL.getUsers();

        socket.emit("usersResponse", users);
      } catch (error) {
        console.error("Server: Error fetching users:", error.message);
        socket.emit("usersError", { message: "Failed to fetch users" });
      }
    });
    //------------------------------------------------------------
    // Handle getSignedUrls event
    socket.on("getSignedUrls", async ({ userId }) => {
      try {
        // Fetch signed URLs from the business logic layer
        // const signedUrls = await UserBL.getSignedUrls(userId);

        const user = await UserBL.getUserById(userId);
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

        // Emit the signed URLs back to the client
        socket.emit("signedUrls", { urls: images });
      } catch (error) {
        console.error("Server: Error fetching signed URLs:", error.message);
        socket.emit("error", { message: "Failed to fetch signed URLs" });
      }
    });
    //------------------------------------------------------------
    // Handle saveUserBio event
    socket.on("saveUserBio", async ({ userId, bio }) => {
      try {
        const user = await UserBL.getUserById(userId);
        if (!user) {
          return socket.emit("error", { message: "User not found" });
        }

        user.bio = bio;
        await user.save();

        // Emit success response back to the client
        socket.emit("bioSaved", { status: 200 });
      } catch (error) {
        console.error("Server: Error saving user bio:", error.message);
        socket.emit("error", { message: "Failed to save user bio" });
      }
    });
    //------------------------------------------------------------
    // Handle getChatHistory event
    socket.on("getChatHistory", async ({ senderId, receiverId }) => {
      try {
        const messages = await ChatBL.getChatHistory(senderId, receiverId);
        socket.emit("chatHistory", messages);
      } catch (error) {
        console.error("Server: Failed to fetch chat history:", error.message);
        socket.emit("error", { message: "Failed to fetch chat history" });
      }
    });
    //------------------------------------------------------------
    // Handle delete image event
    socket.on("deleteImage", async ({ userId, imageKey, token }) => {
      try {
        //TODO:  Verify the token and user authorization here if needed

        const fullImageKey = `${userId}/${imageKey}`;
        const user = await UserBL.getUserById(userId);

        if (!user) {
          return socket.emit("deleteImageError", "User not found");
        }

        if (user.photosUrls.includes(fullImageKey)) {
          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fullImageKey,
          };

          const command = new DeleteObjectCommand(params);
          await s3.send(command);

          // Remove the image URL from the user's photosUrls array
          user.photosUrls = user.photosUrls.filter(
            (url) => url !== fullImageKey
          );
          await user.save();

          socket.emit("deleteImageSuccess");
        } else {
          socket.emit("deleteImageError", "Image not found");
        }
      } catch (err) {
        console.error("Error in deleteImage event: ", err);
        socket.emit("deleteImageError", "Internal server error");
      }
    });
    //------------------------------------------------------------
    // Handle uploadImage event
    socket.on(
      "uploadImage",
      async ({ file, fileName, fileType, userId, token }) => {
        try {
          //TODO:  Verify the token and user authorization here if needed

          const userRecord = await UserBL.getUserById(userId);

          if (!userRecord) {
            return socket.emit("uploadImageError", "User not found");
          }

          // Resize the image
          const buffer = await sharp(Buffer.from(file))
            .resize({ height: 1920, width: 1080, fit: "contain" })
            .toBuffer();

          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${userRecord.id}/${fileName}`,
            Body: buffer,
            ContentType: fileType,
          };

          const command = new PutObjectCommand(params);
          await s3.send(command);

          userRecord.photosUrls.push(params.Key);
          await userRecord.save();

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

          socket.emit("uploadImageSuccess", {
            message: "File uploaded successfully",
            imageUrl: signedUrl,
          });
        } catch (err) {
          console.error("Error in uploadImage event: ", err);
          socket.emit("uploadImageError", "Internal server error");
        }
      }
    );
    //------------------------------------------------------------
    // Handle setProfilePhoto event
    socket.on("setProfilePhoto", async ({ userId, photoKey, token }) => {
      try {
        //TODO:  Verify the token and user authorization here if needed

        // Validate user
        const userRecord = await UserBL.getUserById(userId);
        if (!userRecord) {
          return socket.emit("setProfilePhotoError", "User not found");
        }

        // Update the user's profile photo URL
        userRecord.photoUrl = photoKey;
        await userRecord.save();

        socket.emit("setProfilePhotoSuccess", {
          message: "Profile photo updated successfully",
        });
      } catch (err) {
        console.error("Error in setProfilePhoto event: ", err);
        socket.emit("setProfilePhotoError", "Internal server error");
      }
    });
    //------------------------------------------------------------
  });
}
module.exports = socketController;
