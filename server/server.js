const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
require("../enumsModule.js"); //Load the enum

const wss = new WebSocket.Server({ port: 8000 }); //Start server
const buf = Buffer.alloc(512); //Standard data buffer
const bufLarge = Buffer.alloc(4096); //Large data buffer for JSON data

const serverList = {}; //uid => {location, adjacent[], default(OPTIONAL)}
const clientList = {}; //uid => {viewingNode, socket}
const locationToServer = {};
const locationToName={
    kutler2FBridge: "Kutler Bridge" 
};
let defaultServer = "";

function setClientViewing(socket, node) {  //Assign a client to a specific node
    clientList[socket.uid].viewingNode = node;
    console.log("setting view")
    const data = JSON.stringify({
        "header": packetType.clientStartViewing,
        "location": serverList[node].location,
        "name": locationToName[serverList[node].location]
    });
    socket.send(data);
}
function disconnect(socket) { //Socket disconnects
    console.log("Disconnect");
    if (socket.isNode) { //Node
        const _location = serverList[socket.uid].location;
        if (defaultServer === _location) defaultServer = ""; //Reset defaultServer
        Object.keys(clientList).forEach(client => { //Disconnect clients from this node
            if (clientList[client.uid].viewingNode === _location) {
                setClientViewing(clientList[client.uid].socket, "");
            }
        });

        delete locationToServer[_location];
        delete serverList[socket.uid];
    }
    else if (socket.isClient) { //Client
        delete clientList[socket.uid];
    }
}
wss.on('connection', function (socket) {
    console.log("Connection");
    socket.uid = uuidv4(); //Unique socket id
    socket.isNode = false;
    socket.isClient = false;
    socket.on('message', function (data, req) {
        data = JSON.parse(data); //Parse data as a JS object
        switch (data.header) {
            case packetType.serverConnect: //Node connects
                console.log("Node added");
                socket.isNode = true;
                data.socket = socket;
                delete data.header;
                serverList[socket.uid] = data;
                locationToServer[data.location] = socket.uid;
                if ("default" in data) {
                    defaultServer = socket.uid;
                    Object.keys(clientList).forEach(client => {
                        if (clientList[client].viewingNode === "") {
                            setClientViewing(clientList[client].socket, defaultServer);
                        }
                    });
                }
                console.log("Server: "+defaultServer)
                break;
            case packetType.clientConnect: //Client connects
                console.log("Client connected");
                socket.isClient = true;
                clientList[socket.uid] = {
                    viewingNode: "",
                    socket: socket
                }
                if (defaultServer != "") { //Assign viewing to defaultServer
                    setClientViewing(socket, defaultServer);
                }
                break;
            default:
                break;
        }
    });

    socket.on("close", function () { disconnect(socket); }); //Handle disconnect possibilities
    socket.on("error", function () { disconnect(socket); });
});
console.log("Server has started");