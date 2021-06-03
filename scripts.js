function checkCookieExists() {
    let myUsername = localStorage.getItem("username");
    const setButton=document.getElementById("setStorage");
    setButton.style.display="none";
    if (myUsername != "") {
        fetch("http://willfarhat.com/inc-view/server/checkName.php?username=" + myUsername)
            .then(function (req) {
                req.text().then(function (text) {
                    console.log(text)
                    if (text == "coach") {
                        console.log("Coach");
                        document.getElementById("contentView").innerHTML = "<object type='text/html' class='content' data='coach.html'></object>";
                        setButton.style.display="flex";
                        document.title="Inc View - Coach";
                    }
                    else if (text == "participant") {
                        console.log("Participant");
                        document.getElementById("contentView").innerHTML = "<object type='text/html' class='content' data='participant.html'></object>";
                        setButton.style.display="flex";
                        document.title="Inc View - Participant";
                    }
                    else console.log("Access denied");
                })
            })
    }
}

function setName(username) {
    username = username.toLowerCase().replace(/\s/g, '');
    localStorage.setItem("username", username);
    checkCookieExists();
}

function requestCoach(coach) {
    fetch("http://willfarhat.com/incView/requestCoach.php?coach=" + coach + "&name=" + localStorage.getItem("username")).then(response => response.json())
        .then(function (data) {
            console.log("Email sent");
        })
        .catch(function (e) {
            console.log("Error - email not sent");
        });
}