function connect() {
    const ws = new WebSocket('ws://localhost:8000');

    ws.onopen = function () {
        console.log("Connected to server");
        let _data = JSON.stringify({
            header: packetType.clientConnect
        });
        ws.send(_data);
    }
    ws.onmessage = function (event) {
        _data = JSON.parse(event.data); //Parse data as a JS object
        switch (_data.header) {
            case packetType.clientStartViewing:
                if (_data.location != "") {
                    console.log("New room: " + _data.location);

                    const domain = 'meet.jit.si';
                    const options = {
                        roomName: _data.location,
                        parentNode: document.querySelector("#video")
                    };
                    const api = new JitsiMeetExternalAPI(domain, options);
                }
                else {
                    document.querySelector("#video").innerHTML = "";
                }
                break;
            default: break;
        }
    };

    let retry = function (e) {
        setTimeout(function () {
            console.log("Disconnected. Retrying in 3s");
            connect();
        }, 3000);
    }
    ws.onerror = retry;
    ws.onclose = retry;
}
connect();

let sidebarOpened=true;
function setSidebarWidth() {
    const bar=document.querySelector("#sidebar");
    if (sidebarOpened){
        bar.classList.remove("opening");
        bar.classList.add("closing");
        sidebarOpened=false;
    }
    else {
        bar.classList.remove("closing");
        bar.classList.add("opening");
        sidebarOpened=true;
    }
}