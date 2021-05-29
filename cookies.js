function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

function checkCookieExists() {
    const storage = new CrossStorageClient("http://localhost:3000/hub.html");
    storage.onConnect().then(function() {
        username=storage.get("username");
        console.log(username)
        if (username==null){
            window.location.href = "./login/index.html";
        }
    });
}

function setName(name) {
  localStorage.setItem("username", name);
  //window.location.href = "../index.html";
}
