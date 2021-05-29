const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const enumFile = require("../enums.js");
const packetType = Object.freeze(
    {
        "serverConnect": 1,
        "clientConnect": 2,

        "heartbeat": 10
    });

const wss = new WebSocket.Server({ port: 8000 });
const buf = Buffer.alloc(512); //Standard data buffer
const bufLarge = Buffer.alloc(4096); //Large data buffer for JSON data

const serverList = {};
const locationToServer = {};

function readBufString(str, ind, end) { //Sanitize a string to remove headers and characters
    return str.toString("utf-8", ind, end).replace(/\0/g, '').replace("\u0005", "");
}
function disconnect(socket) {
    console.log("Disconnect");
    if (socket.isNode) {
        delete locationToServer[serverList[socket.uid].location];
        delete serverList[socket.uid];
    }
}
wss.on('connection', function (socket) {
    console.log("Connection");
    socket.uid = uuidv4();
    socket.isNode = false;
    socket.on('message', function (data, req) {
        data=JSON.parse(data);
        switch (data.header) {
            case packetType.serverConnect:
                console.log("Node added");
                socket.isNode = true;
                const _data = JSON.parse(readBufString(data, 1));
                _data.socket = socket;
                serverList[socket.uid] = _data;
                locationToServer[_data.location] = socket.uid;
                break;
            case packetType.clientConnect:
                console.log("Client connected");
                Object.keys(serverList).forEach(server => {
                    
                });
                break;
            default:
                break;
        }
    });

    socket.on("close", function () { disconnect(socket); });
    socket.on("error", function () { disconnect(socket); });
});
console.log("Server has started");