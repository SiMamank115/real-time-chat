const Server = require("socket.io").Server,
    // express
    express = require("express"),
    app = express(),
    // socket io
    http = require("http"),
    httpServer = http.Server(app),
    io = require("socket.io")(httpServer),
    // express middleware and ext
    ejs = require("ejs"),
    cookieParser = require("cookie-parser"),
    bodyParser = require("body-parser"),
    port = process.env.PORT || 3000,
    // utils
    uniqid = require("uniqid"),
    utility = require("./utility"),
    ChatRoom = utility.module.ChatRoom,
    sleep = utility.module.sleep,
    rooms = {},
    takenName = [],
    https = require("https");

app.set("view engine", "ejs");
app.set("views", "client/views");
app.use("/assets", express.static("client/assets"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
let telegramurl = "https://api.telegram.org/bot5780797435:AAFSpM9QgJo7-225ighnSFjcDei-T4e8ewk/sendMessage?chat_id=@faiz_logs&parse_mode=HTML&text=";
io.on("connection", (socket) => {
    socket.on("logged_in", (e) => {
        takenName.push(e.name);
        socket.username = e.name;
        // https.get(telegramurl + socket.username + " has been logged in");
        console.log(socket.username + " has been logged in");
        io.to(socket.id).emit("message", {
            noSend: true,
            client: "system",
            text: "Welcome !",
        });
    });
    socket.on("enter", (e) => {
        socket.roomName = e.id;
        ChatRoom.join(socket.username, rooms[socket.roomName], socket);
        rooms[socket.roomName].savedChat.forEach((e) => {
            io.to(socket.id).emit("message", {
                noSend: true,
                client: e.client,
                text: e.text,
            });
        });
    });
    socket.on("create", (e) => {
        socket.roomName = uniqid.process(undefined, "-" + socket.username);
        rooms[socket.roomName] = ChatRoom.create(socket.username, socket.roomName, socket);
        rooms[socket.roomName].userList.push(socket.username);
        console.log(socket.username + ' has been created the "' + socket.roomName + '" room');
        io.to(socket.id).emit("created", socket.roomName);
    });
    socket.on("room_list", () => {
        io.to(socket.id).emit("room_list", rooms);
    });
    socket.on("message", (e) => {
        if (!socket.roomName) return false;
        rooms[socket.roomName].savedChat.push({ client: e.client == "system"?"system":socket.username, text: e.message });
        return true;
    });
    socket.on("disconnect", () => {
        socket.username && socket.roomName && ChatRoom.left(socket.username, rooms[socket.roomName], socket);
        console.log((socket.username || "some user") + " has been disconnected");
    });
    socket.on("directmessage", async (e) => {
        if (!socket.roomName) return false;
        socket.to(socket.roomName).emit("message", {
            noSend: true,
            client: socket.username,
            text: e,
        });
    });
});

app.get("/", (req, res) => {
    if (req.cookies.logged) {
        res.render("index", {
            title: req.cookies.username,
            login: false,
            name: req.cookies.username,
        });
    } else {
        res.render("index", {
            title: "Welcome",
            login: true,
        });
    }
});
app.post("/login", async (req, res) => {
    if (req.body.name.search(/\W/i) > -1) {
        let errorText = ["Nama kamu kok aneh ya? coba dicek lagi!", "Coba hilangkan spasi dan simbol!", "Nama kamu tidak diterima disini!", "Pastikan nama kamu tidak ada spasi nya!", "Pastikan nama kamu tidak ada simbol nya!"];
        res.status(500).json({
            desc: errorText[Math.round(Math.random() * errorText.length)],
        });
    } else if(takenName.map(e=>e == req.body.name).findIndex(e=>e==1) > -1) {
        let errorText = ["Nama kamu telah dipakai!","Nama kamu sedang dipakai!","Coba nama lain!","Nama kamu pasaran!","Pakai nama asli kamu dong!","Nama kamu diambil user lain!","Nama kamu dipakai user lain!"];
        res.status(500).json({
            desc: errorText[Math.round(Math.random() * errorText.length)],
        });
    } else {
        await sleep(500);
        res.cookie("logged", true, { maxAge: 360000000000 });
        res.cookie("username", req.body.name, { maxAge: 360000000000 });
        res.status(200).json({
            logged: true,
            name: req.body.name,
        });
    }
});
app.get("*", (req, res) => {
    res.status(404).render("errors/404");
});

httpServer.listen(port, async () => {
    console.log("listening to " + port + " port");
});
