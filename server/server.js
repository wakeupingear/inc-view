const WebSocket = require('ws');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { send } = require('process');
require("../enumsModule.js"); //Load the enum

const wss = new WebSocket.Server({ port: 8000 }); //Start server
const buf = Buffer.alloc(512); //Standard data buffer
const bufLarge = Buffer.alloc(4096); //Large data buffer for JSON data

const serverList = {}; //uid => {location, adjacent[], default(OPTIONAL)}
const clientList = {}; //uid => {viewingNode, socket}
const locationToServer = {};
const layoutData=JSON.parse(fs.readFileSync('./layout.json'));
Object.keys(layoutData).forEach(location => {
    layoutData[location].inactive=true;
});
let defaultServer = "";

function setClientViewing(socket, location) {  //Assign a client to a specific node
    clientList[socket.uid].viewingNode = location;
    console.log("setting view");
    let data=-1;
    if (location!=""){
        data=serverList[locationToServer[location]];
        data.header=packetType.clientStartViewing;
        delete data.socket;
    }
    else {
        data={
            header:packetType.clientStartViewing,
            location:""
        }
    }
    socket.send(JSON.stringify(data));
}
function sendLayout(){
    const data=JSON.stringify(layoutData);
    Object.keys(clientList).forEach(client => {
        clientList[client].socket.send(data);
    });
}
function disconnect(socket) { //Socket disconnects
    console.log("Disconnect");
    if (socket.isNode) { //Node
        const _location = serverList[socket.uid].location;
        layoutData[_location].inactive=true;
        sendLayout();
        if (defaultServer === _location) defaultServer = ""; //Reset defaultServer
        Object.keys(clientList).forEach(client => { //Disconnect clients from this node
            if (clientList[client].viewingNode === _location) {
                setClientViewing(clientList[client].socket, "");
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
    socket.on('message', function (data) {
        data = JSON.parse(data); //Parse data as a JS object
        switch (data.header) {
            case packetType.serverConnect: //Node connects
                console.log("Node added");
                socket.isNode = true;
                data.socket = socket;
                delete data.header;
                serverList[socket.uid] = data;
                locationToServer[data.location] = socket.uid;
                delete layoutData[data.location].inactive;
                sendLayout();
                if ("default" in data||defaultServer==="") {
                    defaultServer = data.location;
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
                data={
                    header: packetType.nodeLayout,
                    data: layoutData
                }
                socket.send(JSON.stringify(data));
                break;
            case packetType.confirmLayout:
                if (defaultServer != "") { //Assign viewing to defaultServer
                    setClientViewing(socket, defaultServer);
                }
                break;
            case packetType.clientRequestViewing:
                if (data.location in locationToServer){
                    setClientViewing(socket,data.location);
                }
                else {

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