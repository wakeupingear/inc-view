let locationStr = localStorage.getItem("location");
function setLocation(newLocation) {
    locationStr = newLocation;
    localStorage.setItem("location", locationStr);
}
if (locationStr === null) setLocation("libraryF2Bridge");

function connect() {
    const socket = io('https://node.hwincview.com', { transports: ['websocket'] });

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
        setTimeout(function () {
            connect();
        }, 3000);
    }
    socket.on("error", function () {
        retry();
    });
    socket.on("disconnect", function () {
        retry();
    });
}

connect();