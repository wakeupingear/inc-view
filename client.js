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
            console.log("New room: " + _data.location);

            const domain = 'meet.jit.si';
            const options = {
                roomName: _data.location,
                parentNode: document.querySelector('#video')
            };
            const api = new JitsiMeetExternalAPI(domain, options);
            break;
        default: break;
    }
};