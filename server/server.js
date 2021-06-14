const fs = require("fs");
const http = require("http");
const https = require("https");
const { v4: uuidv4 } = require("uuid");
const readline = require("readline");
const nodemailer = require("nodemailer");
require("../enumsModule.js"); //Load the enum

const buf = Buffer.alloc(512); //Standard data buffer
const bufLarge = Buffer.alloc(4096); //Large data buffer for JSON data

const serverList = {}; //uid => {location, adjacent[], default(OPTIONAL)}
const coachClientList = {}; //uid => {viewingNode, socket, name}
const participantClientList = {}; //uid => { socket, name}
const locationToServer = {};
const layoutData = JSON.parse(fs.readFileSync("./layout.json"));
const participantLocations = JSON.parse(
  fs.readFileSync("./participantLocations.json")
);
Object.keys(layoutData).forEach((location) => {
  layoutData[location].inactive = true;
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  secure: true,
  auth: {
    user: "wfwebsitemanager",
    pass: "potato55",
  },
});

let participantData = {};
let coachData = {};
function loadPeople() {
  let coachPath = "./coaches.json";
  const now = new Date();
  if (now.getMonth() === 6 && now.getDay() > 13 && now.getDay() < 20)
    coachPath = "./coachesDay" + (now.getDay() - 13) + ".json";
  participantData = JSON.parse(fs.readFileSync("./participants.json"));
  let _data = JSON.parse(fs.readFileSync(coachPath));
  coachData = {};
  let list = Object.keys(_data).sort();
  list.forEach((coach) => {
    coachData[coach] = _data[coach];
    if (!("photo" in coachData[coach]))
      coachData[coach].photo = "https://www.gravatar.com/avatar/" + uuidv4();
    if (!("bio" in coachData[coach])) coachData[coach].bio = "Bio goes here";
    if (!("email" in coachData[coach]))
      coachData[coach].email = "willf668@gmail.com";
    if (!("tags" in coachData[coach])) coachData[coach].tags = [];
  });

  let timeUntil = 15 - (now.getMinutes() % 15);
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes() + timeUntil,
    now.getSeconds() // ...at 00:00:00 hours
  );
  setTimeout(function () {
    loadPeople();
  }, tomorrow.getTime() - now.getTime());
}
loadPeople();

/*
async function processLineByLine() {
    const obj = {};
    let list = [];
    const rl = readline.createInterface({
        input: fs.createReadStream('coaches.txt'),
        crlfDelay: Infinity
    });
    for await (const line of rl) {
        const key = "\"" + line.toLowerCase().replace(" ", "") + "\""
        obj[key] = { name: "\"" + line + "\"", email: "", tags: [] };
    }

    console.log(obj)
}
processLineByLine();
*/
//options.key.replace(/\\n/gm, '\n');
//options.cert.replace(/\\n/gm, '\n');
let io = require('socket.io');
secureServer = https.createServer({
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
}, (req, res) => {
    res.writeHead(200, {

    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"

    });
}).listen(8080);
io = io(secureServer, {
    origins: '*'
});


/*https.createServer(options, function (req, res) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
        "Access-Control-Max-Age": 2592000, // 30 days
    };
    const urlParams = new URLSearchParams(req.url);
    const username = urlParams.get("/?username");
    let text = "unknown";
    if (username in participantData) text = "participant:"+participantData[username].name;
    else if (username in coachData) text = "coach:"+coachData[username].name;
    res.writeHead(200, headers);
    res.end(text);
    console.log(text)
}).listen(8443);*/

let defaultServer = "";

function setClientViewing(socket, location) {
  //Assign a client to a specific node
  coachClientList[socket.uid].viewingNode = location;
  let data = -1;
  if (location != "") {
    data = serverList[locationToServer[location]];
    data.header = packetType.clientStartViewing;
    delete data.socket;
  } else {
    data = {
      header: packetType.clientStartViewing,
      location: "",
    };
  }
  socket.send(JSON.stringify(data));
}
function sendLayout() {
  const _data = JSON.stringify({
    header: packetType.nodeLayout,
    data: layoutData,
  });
  Object.keys(coachClientList).forEach((client) => {
    coachClientList[client].socket.send(_data);
  });
}
function disconnect(socket) {
  //Socket disconnects
  console.log("Disconnect");
  if (socket.isNode) {
    //Node
    const _location = serverList[socket.uid].location;
    layoutData[_location].inactive = true;
    sendLayout();
    if (defaultServer === _location) defaultServer = ""; //Reset defaultServer
    Object.keys(coachClientList).forEach((client) => {
      //Disconnect clients from this node
      if (coachClientList[client].viewingNode === _location) {
        setClientViewing(coachClientList[client].socket, "");
      }
    });

    delete locationToServer[_location];
    delete serverList[socket.uid];
  } else if (socket.clientType === 1) {
    //Coach
    delete coachClientList[socket.uid];
  } else if (socket.clientType === 2) {
    //Participant
    delete participantClientList[socket.uid];
  }
}
io.on("connection", function (socket) {
  console.log("Connection");
  socket.uid = uuidv4(); //Unique socket id
  socket.isNode = false;
  socket.clientType = 0; //0: server, 1: coach, 2: participant
  socket.on("message", function (data) {
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
          socket: socket,
        };
        locationToServer[data.location] = socket.uid;
        delete layoutData[data.location].inactive;
        sendLayout();
        if ("default" in layoutData[data.location] || defaultServer === "") {
          defaultServer = data.location;
          setTimeout(function () {
            Object.keys(coachClientList).forEach((client) => {
              if (coachClientList[client].viewingNode === "") {
                setClientViewing(coachClientList[client].socket, defaultServer);
              }
            });
          }, 1000);
        }
        console.log("Server: " + defaultServer);
        break;
      case packetType.clientConnect: //Client connects
        console.log("Coach connected");
        socket.clientType = 1;
        coachClientList[socket.uid] = {
          viewingNode: "",
          socket: socket,
          name: data.name,
        };
        data = {
          header: packetType.nodeLayout,
          data: layoutData,
        };
        socket.send(JSON.stringify(data));
        setClientViewing(socket, defaultServer);
        break;
      case packetType.participantConnect:
        console.log("Participant connected");
        socket.clientType = 2;
        participantClientList[socket.uid] = {
          socket: socket,
          name: data.name,
        };
        data = {
          header: packetType.participantGetCoaches,
          data: coachData,
        };
        socket.send(JSON.stringify(data));
        break;
      case packetType.participantRequestCoach:
        const room = participantLocations[data.name];
        const mailOptions = {
          from: "wfwebsitemanager@gmail.com",
          to: "willf668@gmail.com",
          //cc: 'zach@tinyheadedkingdom.com',
          subject: "HW Inc View - " + data.name + " is asking for help!",
          text: "Hello,\n\n" + data.name + "'s team has requested your help!",
        };
        if (data.msg !== "") mailOptions.text += "\n\n'" + data.msg + "'";
        mailOptions.text +=
          "\n\nTo join, click here: http://incview.com?room=" + room;
        mailOptions.text += "\n\nThanks!\n-The Inc Team";

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });

        Object.values(coachClientList).forEach((coach) => {
          if (
            room !== coach.viewingNode &&
            coach.name === data.coachName.toLowerCase().replace(/\s/g, "")
          ) {
            console.log("sending buton");
            coach.socket.send(
              JSON.stringify({
                header: packetType.coachRequested,
                room: room,
                name: data.name,
              })
            );
          }
        });
        break;
      default:
        break;
    }
  });

  socket.on("close", function () {
    disconnect(socket);
  }); //Handle disconnect possibilities
  socket.on("error", function () {
    disconnect(socket);
  });
});

console.log("Server has started");
