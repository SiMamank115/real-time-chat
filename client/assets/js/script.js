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
let roomActive;
document.querySelector(".create-room-button").addEventListener("click", (e) => {
    socket.emit("create");
    document.querySelector(".send-button").removeAttribute("disabled");
    document.querySelector(".message-input").removeAttribute("disabled");
});
// query the available rooms
socket.emit("room_list");
// message event
socket.on("message", (e) => {
    e.client == "systemclient" ? (e.client = "system") : socket.emit("message", e);
    message(e.client, e.text);
});
// create room event
socket.on("created", (e) => {
    window.roomName = e;
    message("system", username + " created this room");
});
// room list event
socket.on("room_list", (e = {}) => {
    let keys = Object.keys(e);
    if (keys.length == 0) return;
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
const sendMessage = (message) => {
    socket.emit("message", { message, roomName });
};
document.querySelector(".send-button").addEventListener("click", (e) => {
    sendMessage(document.querySelector(".message-input").value);
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
