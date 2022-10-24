const socket = io(),
    message = (client = true, text) => {
        let system = false;
        if (client == "system") {
            system = true;
        } else if (typeof client == "string") {
            text = client;
            client = true;
        }
        let chat = document.createElement("div");
        chat.classList.add(..."col-12 d-flex px-5 pt-3 message-container".split(" "));
        chat.innerHTML = `<div class="message ${system ? "system" : client ? "user" : "other-user"}-message"><div class="messagetext"><p>
        ${text}
        </p></div></div>`;
        document.querySelector("section#chat").appendChild(chat);
    };
let roomActive, allRoom;
document.querySelector(".create-room-button").addEventListener("click", (e) => {
    socket.emit("create");
    document.querySelector(".send-button").removeAttribute("disabled");
    document.querySelector(".message-input").removeAttribute("disabled");
});
document.querySelector(".enter-room-button").addEventListener("click", (e) => {
    let rm = document.querySelectorAll("section#rooms>.list-group>*"),
        active;
    rm.forEach((e, x) => {
        e.classList.contains("active") && (active = x);
    });
    if (active == undefined) return;
    let roomKey = Object.keys(allRoom),
        room = allRoom[roomKey[active]];
    socket.emit("enter", room);
    socket.emit("room_list");
});
// query the available rooms
socket.emit("room_list");
// message event
socket.on("message", (e) => {
    e.noSend && socket.emit("message", e);
    console.log(e);
    message(e.client, e.text);
});
// create room event
socket.on("created", (e) => {
    window.roomName = e;
    socket.emit("message", { roomName, client: "system", message: username + " created this room" });
    message("system", username + " created this room");
});
// room list event
socket.on("room_list", (e = {}) => {
    allRoom = e;
    let keys = Object.keys(e);
    if (keys.length == 0) return;
    document.querySelector("section#rooms>div").innerHTML = "";
    keys.forEach((x) => {
        roomList(e[x]);
    });
    Array.from(document.querySelectorAll("section#rooms>.list-group>*")).forEach((e) => {
        e.onclick = (el) => {
            if (e == roomActive) return;
            roomActive && roomActive.classList.remove("active");
            roomActive = e;
            e.classList.add("active");
        };
    });
});
if (document.querySelector("input[name=login]")) {
    Swal.fire({
        title: "Tulis nama mu",
        input: "text",
        showCancelButton: false,
        confirmButtonText: "Mulai chatting!",
        showLoaderOnConfirm: true,
        inputValidator: (value) => {
            if (!value) {
                let errorText = ["Halo?", "...", "Apa kamu disini?", "Namamu?", "Bangun!"];
                return errorText[Math.round(Math.random() * errorText.length)];
            }
        },
        preConfirm: (login) => {
            let body = {
                name: login,
            };
            return fetch(`/login`, {
                method: "POST",
                redirect: "follow",
                body: JSON.stringify(body, undefined, 2),
                headers: { "Content-Type": "application/json" },
            })
                .then(async (e) => {
                    return [await e.json(), e.ok];
                })
                .then((e) => {
                    if (!e[1]) {
                        throw new Error(e[0].desc);
                    }
                    window.username = e[0].name;
                    socket.emit("logged_in", {
                        name: username,
                        id: socket.id,
                    });
                    Swal.fire({
                        icon: "success",
                        title: "Selamat Datang!",
                        text: "kamu bisa mulai dengan membuat ruangan / bergabung bersama orang lain di ruangan yang telah tersedia. klik tombol diatas!",
                        buttonsStyling: false,
                        customClass: {
                            confirmButton: "btn px-4 py-2 rounded-1 btn-primary",
                        },
                    });
                })
                .catch((error) => {
                    Swal.showValidationMessage(`${error.message}`);
                });
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
    });
} else if (document.querySelector("input[name=username]")) {
    window.username = document.querySelector("input[name=username]").value;
    socket.emit("logged_in", {
        name: username,
        id: socket.id,
    });
}
const sendMessage = (message, client) => {
    socket.emit("message", { message, client });
};
document.querySelector(".send-button").addEventListener("click", (e) => {
    sendMessage(document.querySelector(".message-input").value, true);
    message(true, document.querySelector(".message-input").value);
    document.querySelector(".message-input").value = "";
    document.querySelector(".message-input").focus();
});

{
    /*  <button type="button" class="d-flex justify-content-between list-group-item list-group-item-action border border-dark">
            <div class="fw-500">username</div>
            <div class="user-list pe-3 d-flex align-items-center">
            <div>12</div>
            <i class="bi-person-fill"></i>
            </div>
        </button> */
}
const roomList = (room) => {
    let btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.classList.add(..."d-flex justify-content-between list-group-item list-group-item-action border border-dark".split(" "));
    btn.innerHTML = `<div class="fw-500">${room.name}</div><div class="user-list pe-3 d-flex align-items-center"><div>${room.userList.length}</div><i class="bi-person-fill"></i></div>`;
    document.querySelector("section#rooms>div").appendChild(btn);
};
