function isEmpty(obj) {
    return (Object.keys(obj).length === 0);
}

function checkCookieExists() {
    const username = localStorage.getItem("username");
    if (username == null) {
        window.location.href = "./login/index.html";
    }
}

function setName(name) {
    localStorage.setItem("username", name)
    window.location.href = "../index.html";
}