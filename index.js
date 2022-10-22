const Server = require("socket.io").Server,
    // express
    express = require("express"),
    app = express(),
    // socket io
    http = require("http").Server(app),
    io = require("socket.io")(http),
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
    rooms = {};

let username;

app.set("view engine", "ejs");
app.set("views", "client/views");
app.use("/assets", express.static("client/assets"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

io.on("connection", (socket) => {
    socket.on("logged_in", (e) => {
        username = e.name;
        console.log(username + " has been logged in");
    });
    socket.on("create", (e) => {
        let roomName = uniqid.process(undefined, "-" + username),
            userId = socket.id;
        console.log(username + ' has been created the "' + roomName + '" room');
        rooms[roomName] = ChatRoom.create(username, roomName, socket);
        io.to(userId).emit("created", true);
    });
    socket.on("room_list", () => {
        let userId = socket.id;
        io.to(userId).emit("room_list",rooms);
    });
    socket.on("disconnect", () => {});
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

http.listen(port, () => {
    console.log("listening to " + port + " port");
});
