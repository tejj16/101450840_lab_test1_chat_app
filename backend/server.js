require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketio = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

const User = require("./models/User");
const GroupMessage = require("./models/GroupMessage");

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// API Routes
app.use("/api/auth", require("./routes/auth"));

// SOCKET.IO LOGIC
io.on("connection", (socket) => {
    console.log(`🔗 New Client Connected: ${socket.id}`);

    // JOIN ROOM
    socket.on("joinRoom", async ({ username, room }) => {
        socket.join(room);
        console.log(`✅ ${username} joined room ${room}`);
        io.to(room).emit("message", { from: "Admin", message: `${username} has joined the chat` });
    });

    // SEND MESSAGE
    socket.on("chatMessage", async ({ room, message, from }) => {
        console.log(`📨 Message from ${from} in ${room}: ${message}`);

        // Store message in MongoDB
        const newMessage = new GroupMessage({ from_user: from, room, message });
        await newMessage.save();

        // Broadcast message to all clients in the room
        io.to(room).emit("message", { from, message });
    });

    // TYPING INDICATOR
    socket.on("typing", ({ room, username }) => {
        socket.to(room).emit("typing", { username });
    });

    socket.on("stopTyping", ({ room }) => {
        socket.to(room).emit("stopTyping");
    });

    // LEAVE ROOM
    socket.on("leaveRoom", ({ username, room }) => {
        socket.leave(room);
        console.log(`🚪 ${username} left room ${room}`);
        io.to(room).emit("message", { from: "Admin", message: `${username} has left the chat` });
    });

    // DISCONNECT EVENT
    socket.on("disconnect", () => {
        console.log(`❌ Client Disconnected: ${socket.id}`);
    });
});

// START SERVER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server Running on Port ${PORT}`));
