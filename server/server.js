const WebSocket = require('ws');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { send } = require('process');
require("../enumsModule.js"); //Load the enum

const wss = new WebSocket.Server({ port: 8000 }); //Start server
const buf = Buffer.alloc(512); //Standard data buffer
const bufLarge = Buffer.alloc(4096); //Large data buffer for JSON data

const serverList = {}; //uid => {location, adjacent[], default(OPTIONAL)}
const coachClientList = {}; //uid => {viewingNode, socket}
const participantClientList = {}; //uid => {viewingNode, socket, name}
const locationToServer = {};
const layoutData = JSON.parse(fs.readFileSync("./layout.json"));
Object.keys(layoutData).forEach(location => {
    layoutData[location].inactive = true;
});

let coachData = {};
function loadCoaches() {
    let coachPath = "./coachesTest.json";
    const now = new Date();
    if (now.getMonth() === 6 && now.getDay() > 13 && now.getDay() < 20) coachPath = "./coachesDay" + (now.getDay() - 13) + ".json";
    let _data=JSON.parse(fs.readFileSync(coachPath));
    coachData={};
    let list=Object.keys(_data).sort();
    list.forEach(coach => {
        coachData[coach]=_data[coach];
        if (!("photo" in coachData[coach])) coachData[coach].photo="https://www.gravatar.com/avatar/"+uuidv4();
        if (!("bio" in coachData[coach])) coachData[coach].bio="Bio goes here";
    });

    let timeUntil = 15 - (now.getMinutes() % 15);
    const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(), now.getMinutes() + timeUntil, now.getSeconds() // ...at 00:00:00 hours
    );
    setTimeout(function () {
        loadCoaches();
    }, tomorrow.getTime() - now.getTime());
}
loadCoaches();

let defaultServer = "";

function setClientViewing(socket, location) {  //Assign a client to a specific node
    coachClientList[socket.uid].viewingNode = location;
    console.log("setting view");
    let data = -1;
    if (location != "") {
        data = serverList[locationToServer[location]];
        data.header = packetType.clientStartViewing;
        delete data.socket;
    }
    else {
        data = {
            header: packetType.clientStartViewing,
            location: ""
        }
    }
    socket.send(JSON.stringify(data));
}
function sendLayout() {
    const data = JSON.stringify(layoutData);
    Object.keys(coachClientList).forEach(client => {
        coachClientList[client].socket.send(data);
    });
}
function disconnect(socket) { //Socket disconnects
    console.log("Disconnect");
    if (socket.isNode) { //Node
        const _location = serverList[socket.uid].location;
        layoutData[_location].inactive = true;
        sendLayout();
        if (defaultServer === _location) defaultServer = ""; //Reset defaultServer
        Object.keys(coachClientList).forEach(client => { //Disconnect clients from this node
            if (coachClientList[client].viewingNode === _location) {
                setClientViewing(coachClientList[client].socket, "");
            }
        });

        delete locationToServer[_location];
        delete serverList[socket.uid];
    }
    else if (socket.clientType===1) { //Coach
        delete coachClientList[socket.uid];
    }
    else if (socket.clientType===2) { //Participant
        delete participantClientList[socket.uid];
    }
}
wss.on('connection', function (socket) {
    console.log("Connection");
    socket.uid = uuidv4(); //Unique socket id
    socket.isNode = false;
    socket.clientType = 0; //0: server, 1: coach, 2: participant
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
                if ("default" in data || defaultServer === "") {
                    defaultServer = data.location;
                    Object.keys(coachClientList).forEach(client => {
                        if (coachClientList[client].viewingNode === "") {
                            setClientViewing(coachClientList[client].socket, defaultServer);
                        }
                    });
                }
                console.log("Server: " + defaultServer)
                break;
            case packetType.clientConnect: //Client connects
                console.log("Coach connected");
                socket.clientType = 1;
                coachClientList[socket.uid] = {
                    viewingNode: "",
                    socket: socket,
                    name: data.name
                }
                data = {
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
                if (data.location in locationToServer) {
                    setClientViewing(socket, data.location);
                }
                else {

                }
                break;
            case packetType.participantConnect:
                console.log("Participant connected");
                socket.clientType = 2;
                participantClientList[socket.uid] = {
                    socket: socket,
                    name: data.name
                }
                data = {
                    header: packetType.participantGetCoaches,
                    data: coachData
                }
                socket.send(JSON.stringify(data));
                break;
            default:
                break;
        }
    });

    socket.on("close", function () { disconnect(socket); }); //Handle disconnect possibilities
    socket.on("error", function () { disconnect(socket); });
});
console.log("Server has started");