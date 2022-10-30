const socket = io();
let roomActive, allRoom;
// create room
document.querySelector(".create-room-button").addEventListener("click", async (e) => {
    socket.emit("create");
    document.querySelector(".send-button").removeAttribute("disabled");
    document.querySelector(".message-input").removeAttribute("disabled");
    await toggleLeaveButton();
});
// enter and leave room
document.querySelector(".enter-room-button").addEventListener("click", async (e) => {
    if (document.querySelector(".enter-room-button").children[1].classList.contains("d-none")) {
        // create
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
        document.querySelector(".send-button").removeAttribute("disabled");
        document.querySelector(".message-input").removeAttribute("disabled");
        await toggleLeaveButton();
    } else {
        // leave
        socket.emit("leave");
        document.querySelector("section#chat").innerHTML = "";
        await toggleLeaveButton(false);
    }
});
// query the available rooms
socket.emit("room_list");
// message event
socket.on("message", (e) => {
    !e.noSend && socket.emit("message", e);
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
    document.querySelector(":root").style.setProperty("--under-nav", window.innerHeight - document.querySelector("nav").clientHeight + "px");
    allRoom = e;
    let keys = Object.keys(e);
    // document.querySelector("section#rooms>div").innerHTML = "";
    if (keys.length == 0) return;
    keys.forEach((x) => {
        roomList(e[x]);
    });
    Array.from(document.querySelectorAll("section#rooms>.list-group>*")).forEach((el) => {
        el.addEventListener("click", (e) => {
            if (el == roomActive) {
                console.log(1);
                roomActive.classList.remove("active");
                roomActive = undefined;
                return;
            }
            roomActive && roomActive.classList.remove("active");
            roomActive = el;
            el.classList.add("active");
        });
    });
});

document.querySelector(".send-button").addEventListener("click", (e) => {
    sendMessage(document.querySelector(".message-input").value, true);
    message(username, document.querySelector(".message-input").value);
    document.querySelector(".message-input").value = "";
    document.querySelector(".message-input").focus();
});
document.querySelector(".logout-button").addEventListener("click", async (e) => {
    (await (await fetch("/logout")).json()).status && window.location.reload();
});
const sendMessage = (message, client) => {
        socket.emit("directmessage", message);
        socket.emit("message", { message, client });
    },
    roomList = (room) => {
        let btn = document.createElement("button"),
            check = room.userList.find((e) => e === username) ? `<i class="bi bi-patch-check-fill chat-check"></i>` : "";
        btn.setAttribute("type", "button");
        btn.classList.add(..."d-flex justify-content-between list-group-item list-group-item-action border border-dark".split(" "));
        btn.innerHTML = `
        <div class="fw-500">${room.name}</div>
        ${check}
        <div class="user-list pe-3 d-flex align-items-center">
            <div>${room.userList.length}</div>
            <i class="bi-person-fill"></i>
        </div>`;
        document.querySelector("section#rooms>div").appendChild(btn);
    },
    toggleLeaveButton = async (leave = true) => {
        let btn = document.querySelector(".enter-room-button");
        if (btn.children[leave ? 0 : 1].classList.contains("d-none")) return false;
        btn.children[leave ? 0 : 1].classList.add("opacity-0");
        await sleep(150);
        btn.children[leave ? 0 : 1].classList.add("d-none");
        btn.children[leave ? 1 : 0].classList.remove("d-none");
        await sleep(50);
        btn.children[leave ? 1 : 0].classList.remove("opacity-0");
        return true;
    },
    toggleChatRoom = async (chat = true) => {
        let section = document.querySelector("section#" + (chat ? "chat" : "rooms")),
            disappear = document.querySelector("section#" + (chat ? "rooms" : "chat"));
        console.log(chat ? 100 : 0);
        document.querySelector(":root").style.setProperty("--chat-wd", (chat ? 100 : 0) + "%");
        disappear.classList.add("opacity-0");
        document.querySelector("footer").classList[!chat?"add":"remove"]("opacity-0");
        await sleep(150);
        disappear.classList.add("d-none");
        section.classList.remove("d-none");
        await sleep(50);
        section.classList.remove("opacity-0");
    },
    sleep = (ms) => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },
    message = (client = true, text) => {
        let system = !1,
            sender;
        if (client == "system") {
            system = true;
        } else if (client == username) {
            sender = "You";
            client = !0;
        } else if (typeof client == "string" && client != username) {
            sender = client;
            client = !1;
        } else {
            return;
        }
        let chat = document.createElement("div"),
            tooltip = !system ? ` data-bs-toggle="tooltip" data-bs-title="${sender}" data-bs-custom-class="custom-tooltip"` : "";
        chat.classList.add(..."col-12 d-flex px-5 pt-3 message-container".split(" "));
        chat.innerHTML = `
        <div ${tooltip} class="message ${system ? "system" : client ? "user" : "other-user"}-message">
            <div class="messagetext">
                <p>
                    ${text}
                </p>
            </div>
        </div>`;
        document.querySelector("section#chat").appendChild(chat);
        let tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]'),
            tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));
    };
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
window.matchMedia("(max-width: 768px)").addEventListener("change", (e) => {
    if(e.matches) {

    }
});
