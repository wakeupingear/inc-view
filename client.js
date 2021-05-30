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

function connect() {
    const ws = new WebSocket('ws://localhost:8000');

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

    ws.onmessage = function (event) {
        _data = JSON.parse(event.data); //Parse data as a JS object
        switch (_data.header) {
            case packetType.clientStartViewing:
                const vid = document.getElementById("video");
                if (_data.location != "") {
                    console.log("New room: " + _data.location);

                    const domain = 'meet.jit.si';
                    const options = {
                        roomName: _data.location,
                        parentNode: vid
                    };
                    const api = new JitsiMeetExternalAPI(domain, options);

                    Object.keys(_data.adjacent).forEach(adj => {
                        vid.innerHTML += "<div class='navButton' data-x=" + _data.adjacent[adj].x + " data-y=" + _data.adjacent[adj].y + " onclick='requestRoomChange(\"" + adj + "\")'>" + _data.adjacent[adj].name + "</div>"
                    });
                    positionButtons();
                }
                else {
                    vid.innerHTML = "";
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
    if (sidebarOpened) {
        bar.classList.remove("opening");
        bar.classList.add("closing");
        sidebarOpened = false;
    }
    else {
        bar.classList.remove("closing");
        bar.classList.add("opening");
        sidebarOpened = true;
    }
}