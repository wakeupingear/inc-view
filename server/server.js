const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { send } = require('process');
const nodemailer = require("nodemailer");
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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: true,
    auth: {
        user: 'wfwebsitemanager',
        pass: 'potato55'
    }
});

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write("whoa there bucko. this isn't your typical website, so how 'bout we all take a step back and forget any of this happened?");
    res.end();
}).listen(8080);

let coachData = {};
function loadCoaches() {
    let coachPath = "./coachesTest.json";
    const now = new Date();
    if (now.getMonth() === 6 && now.getDay() > 13 && now.getDay() < 20) coachPath = "./coachesDay" + (now.getDay() - 13) + ".json";
    let _data = JSON.parse(fs.readFileSync(coachPath));
    coachData = {};
    let list = Object.keys(_data).sort();
    list.forEach(coach => {
        coachData[coach] = _data[coach];
        if (!("photo" in coachData[coach])) coachData[coach].photo = "https://www.gravatar.com/avatar/" + uuidv4();
        if (!("bio" in coachData[coach])) coachData[coach].bio = "Bio goes here";
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
    const _data = JSON.stringify({
        header: packetType.nodeLayout,
        data: layoutData
    });
    Object.keys(coachClientList).forEach(client => {
        coachClientList[client].socket.send(_data);
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
    else if (socket.clientType === 1) { //Coach
        delete coachClientList[socket.uid];
    }
    else if (socket.clientType === 2) { //Participant
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
                if (socket.uid in serverList) {
                    layoutData[serverList[socket.uid].location].inactive = true;
                    delete locationToServer[serverList[socket.uid].location];
                    delete serverList[socket.uid];
                }
                serverList[socket.uid] = {
                    location: data.location,
                    socket: socket
                };
                locationToServer[data.location] = socket.uid;
                delete layoutData[data.location].inactive;
                sendLayout();
                if ("default" in layoutData[data.location] || defaultServer === "") {
                    defaultServer = data.location;
                    setTimeout(function () {
                        Object.keys(coachClientList).forEach(client => {
                            if (coachClientList[client].viewingNode === "") {
                                setClientViewing(coachClientList[client].socket, defaultServer);
                            }
                        });
                    }, 1000)
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
                setClientViewing(socket, defaultServer);
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
            case packetType.participantRequestCoach:
                var mailOptions = {
                    from: 'wfwebsitemanager@gmail.com',
                    to: 'willf668@gmail.com',
                    //cc: 'zach@tinyheadedkingdom.com',
                    subject: 'HW Inc View - ' + data.name + " is asking for help!",
                    text:  "Hello,\n\n"+data.name+"'s team has requested your help!"
                };
                if (data.msg!=="") mailOptions.text+="\n\n'"+data.msg+"'";
                mailOptions.text+="\n\nTo join, click here: http://incview.com/";
                mailOptions.text+="\n\nThanks!\n-The Inc Team";

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
                break;
            default:
                break;
        }
    });

    socket.on("close", function () { disconnect(socket); }); //Handle disconnect possibilities
    socket.on("error", function () { disconnect(socket); });
});
console.log("Server has started");