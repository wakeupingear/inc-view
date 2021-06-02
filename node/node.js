let locationStr=localStorage.getItem("location");
function setLocation(newLocation){
    locationStr=newLocation;
    localStorage.setItem("location",locationStr);
}
if (locationStr===null) setLocation("libraryF2Bridge");

function connect() {
    const ws = new WebSocket('ws://52.35.162.61:8000');
    //const ws = new WebSocket('ws://24.205.76.29:8000');

    ws.onopen = function () {
        console.log("Connected to server");
        const _data = {
            header: packetType.serverConnect,
            location: locationStr
        }
        ws.send(JSON.stringify(_data));
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
    ws.onerror = retry;
    ws.onclose = retry;
}

connect();