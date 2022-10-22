const socket = io();
document.querySelector(".create-room-button").addEventListener("click", (e) => {
    socket.emit("join");
});
socket.on("message", e => {
    console.log(e);
})
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
    });
}
