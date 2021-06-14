let locationStr=localStorage.getItem("location");
function setLocation(newLocation){
    locationStr=newLocation;
    localStorage.setItem("location",locationStr);
}
if (locationStr===null) setLocation("libraryF2Bridge");

function connect() {
    //const socket = io('https://52.35.162.61:8000');
    const socket = io('https://24.205.76.29:8080');
    //const ws = new WebSocket('wss://24.205.76.29:8000');

    socket.onopen = function () {
        console.log("Connected to server");
        const _data = {
            header: packetType.serverConnect,
            location: locationStr
        }
        socketsend(JSON.stringify(_data));
        document.getElementById("videoLocation").innerHTML="<object type='text/html' class='content' data='./meeting.html'></object>";
        document.getElementById("loading").style.display="none";
    }

    let retry = function (e) {
        document.getElementById("loading").style.display="flex";
        document.getElementById("videoLocation").innerHTML="";
        setTimeout(function () {
            connect();
        }, 3000);
    }
    socketonerror = retry;
    socketonclose = retry;
}

connect();