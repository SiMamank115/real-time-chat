function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
class ChatRoom {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.savedChat = [];
        this.userList = [];
    }
}
ChatRoom.create = function (name = "", id, socket) {
    socket.join(id);
    return new ChatRoom(name, id);
};
ChatRoom.join = function (name = "", room, socket) {
    socket.join(room.id);
    room.userList.push(name);
    return 1;
};
ChatRoom.left = function (name = "", room, socket) {
    socket.leave(room.id);
    room.userList.splice(
        room.userList.find((e) => e == name),
        1
    );
    return 1;
};

exports.module = {
    ChatRoom,
    sleep,
};
