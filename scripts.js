function checkCookieExists() {
    let myUsername = localStorage.getItem("username");
    const setButton = document.getElementById("setStorage");
    setButton.style.display = "none";
    if (myUsername !== "" && myUsername !== null) {
        //fetch("http://localhost:8080?username=" + myUsername)
        fetch("https://www.willfarhat.com/inc-view/server/checkName.php?username=" + myUsername)
        //fetch("https://24.205.76.29:8443?username=" + myUsername)
            .then(function (req) {
                req.text().then(function (text) {
                    if (text.includes("coach:")) {
                        console.log("Coach");
                        text=text.replace("coach:","");
                        document.getElementById("contentView").innerHTML = "<object type='text/html' class='content' data='coach.html'></object>";
                        setButton.style.display = "flex";
                        document.title = "Inc View - Coach";
                        localStorage.setItem("fullname", text);
                    }
                    else if (text.includes("participant:")) {
                        console.log("Participant");
                        text=text.replace("participant:","");
                        document.getElementById("contentView").innerHTML = "<object type='text/html' class='content' data='participant.html'></object>";
                        setButton.style.display = "flex";
                        document.title = "Inc View - Participant";
                        localStorage.setItem("fullname", text);
                    }
                    else console.log("Access denied");
                })
            })
    }
}

function setName(username) {
    if (username===undefined||username===null) return;
    username = username.toLowerCase().replace(/\s/g, '');
    localStorage.setItem("username", username);
    checkCookieExists();
}