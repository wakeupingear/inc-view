const ws = new WebSocket('ws://localhost:8000');

ws.onopen=function(){
    console.log("Connected to server");
    const _data=JSON.stringify({
        header:packetType.clientConnect
    });
    ws.send(_data);
}