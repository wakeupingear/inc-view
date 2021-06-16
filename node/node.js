let locationStr = localStorage.getItem("location");
function setLocation(newLocation) {
    if (newLocation===undefined||newLocation===null) return;
    locationStr = newLocation;
    localStorage.setItem("location", locationStr);
    location.reload();
}
if (locationStr===undefined||locationStr===null) setLocation(Math.random().toString(36).substring(7));

function connect() {
    const socket = io('http://localhost:8080', {
        transports: ['websocket'],
        'reconnection': true,
        'reconnectionDelay': 3000,
        'reconnectionDelayMax': 5000,
        'reconnectionAttempts': 50000
    });
    //const socket = io('https://node.hwincview.com', { transports: ['websocket'] });

    socket.on("connect", function () {
        console.log("Connected to server");
        const _data = {
            header: packetType.serverConnect,
            location: locationStr
        }
        socket.send(JSON.stringify(_data));
        document.getElementById("videoLocation").innerHTML = "<object type='text/html' class='content' data='./meeting.html'></object>";
        document.getElementById("loading").style.display = "none";
    });

    let retry = function (e) {
        document.getElementById("loading").style.display = "flex";
        document.getElementById("videoLocation").innerHTML = "";
    }
    socket.on("error", function () {
        retry();
    });
    socket.on("disconnect", function () {
        retry();
    });
}

connect();