document.addEventListener("DOMContentLoaded", () => {
    const socket = io("http://localhost:3000"); // Connect to backend
    const user = JSON.parse(localStorage.getItem("user"));
    let room = "news"; // Default room

    if (!user) {
        window.location.href = "login.html"; // Redirect if no user is found
    } else {
        $("#roomName").text(room);
        socket.emit("joinRoom", { username: user.username, room });
    }

    // Update user list
    socket.on("roomUsers", ({ room, users }) => {
        $("#userList").text(users.map(user => user.username).join(", "));
    });

    // Send Message
    $("#sendMessage").click(() => {
        let message = $("#message").val().trim();
        if (message) {
            socket.emit("chatMessage", { room, message, from: user.username });
            $("#message").val('');
        }
    });

    // Display Incoming Messages
    socket.on("message", (data) => {
        $("#messages").append(`<p><strong>${data.from}:</strong> ${data.message}</p>`);
        $(".chat-box").scrollTop($(".chat-box")[0].scrollHeight);
    });

    // Typing Indicator
    $("#message").on("keydown", () => {
        socket.emit("typing", { room, username: user.username });
    });

    socket.on("typing", (data) => {
        $("#typingIndicator").text(`${data.username} is typing...`);
    });

    socket.on("stopTyping", () => {
        $("#typingIndicator").text('');
    });

    $("#message").on("keyup", () => {
        setTimeout(() => socket.emit("stopTyping", { room, username: user.username }), 1000);
    });

    // Leave Room
    $("#leaveRoom").click(() => {
        socket.emit("leaveRoom", { username: user.username, room });
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
});
