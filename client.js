function positionButtons() {
    const list = document.getElementsByClassName("navButton");
    //const base=document.getElementById("largeVideoWrapper");
    for (let i = 0; i < list.length; i++) {
        const button = list[i];
        button.style.left = (button.dataset.x) + "%";
        button.style.top = (button.dataset.y) + "%";
    }
}
window.onresize = positionButtons;

function setMap(location) {
    const list = document.getElementsByClassName("map");
    for (let i = 0; i < list.length; i++) {
        const mapFloor = list[i];
        if (mapFloor.id.includes(location)) {
            mapFloor.style.width = "100%";
            mapFloor.dataset.active = true;
        }
        else {
            mapFloor.style.width = "0%";
            mapFloor.dataset.active = false;
        }
    }
}
setMap("-1");

function connect() {
    const ws = new WebSocket('ws://24.205.76.29:8000');

    ws.onopen = function () {
        console.log("Connected to server");
        let _data = JSON.stringify({
            header: packetType.clientConnect
        });
        ws.send(_data);
    }

    requestRoomChange = function (location) { //Bad global variable! Needs ws ref tho
        const data = {
            header: packetType.clientRequestViewing,
            location: location
        }
        ws.send(JSON.stringify(data));
    }

    let jitsiWindow = -1;
    ws.onmessage = function (event) {
        _data = JSON.parse(event.data); //Parse data as a JS object
        switch (_data.header) {
            case packetType.clientStartViewing:
                const vid = document.getElementById("video");
                vid.innerHTML = "";
                if (_data.location != "") {
                    console.log("New room: " + _data.location);

                    const myUsername = localStorage.getItem("username");
                    const domain = 'meet.jit.si';
                    const options = {
                        roomName: _data.location,
                        parentNode: vid,
                        userInfo: {
                            displayName: myUsername
                        }
                    };
                    jitsiWindow = new JitsiMeetExternalAPI(domain, options);

                    Object.keys(_data.adjacent).forEach(adj => {
                        vid.innerHTML += "<div class='navButton' data-x=" + _data.adjacent[adj].x + " data-y=" + _data.adjacent[adj].y + " onclick='requestRoomChange(\"" + adj + "\")'>" + _data.adjacent[adj].name + "</div>"
                    });
                    positionButtons();
                    setMap(_data.location.match(/\d+/)[0]);
                }
                else {
                    setMap("-1");
                }
                break;
            default: break;
        }
    };

    let retry = function (e) { //There's an infinite retry bug in here somewhere
        setTimeout(function () {
            console.log("Disconnected. Retrying in 3s");
            connect();
        }, 3000);
    }
    ws.onclose = retry;
}
connect();

const bar = document.getElementById("sidebar");
new ResizeObserver(() => positionButtons()).observe(bar);
let sidebarOpened = true;
function setSidebarWidth() {
    const closeButton = document.getElementById("closeButton");
    const mapList = document.getElementsByClassName("map");
    console.log(closeButton.classList);
    if (sidebarOpened) {
        bar.classList.remove("opening");
        bar.classList.add("closing");
        closeButton.classList.remove("gradient-opening");
        closeButton.classList.add("gradient-closing");
        for (let i = 0; i < mapList.length; i++) {
            const mapFloor = mapList[i];
            if (mapFloor.dataset.active==="true") {
                mapFloor.classList.remove("map-opening");
                mapFloor.classList.add("map-closing");
            }
        }
        sidebarOpened = false;
    }
    else {
        bar.classList.remove("closing");
        bar.classList.add("opening");
        closeButton.classList.remove("gradient-closing");
        closeButton.classList.add("gradient-opening");
        for (let i = 0; i < mapList.length; i++) {
            const mapFloor = mapList[i];
            if (mapFloor.dataset.active==="true") {
                mapFloor.classList.remove("map-closing");
                mapFloor.classList.add("map-opening");
            }
        }
        sidebarOpened = true;
    }
}