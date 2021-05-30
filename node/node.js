const open = require('open');
const liveServer = require("live-server");
require("../enumsModule.js");

function openMeeting() {
    const params = {
        port: 8181, // Set the server port. Defaults to 8080.
        open: false, // When false, it won't load your browser by default.
        wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
        mount: [['/components', './node_modules']], // Mount a directory to a route.
        cors: true
    };
    liveServer.start(params);
    open("./index.html");
}

function connect() {
    const config = require('./config.json');
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://24.205.76.29:8000');

    ws.onopen = function () {
        console.log("Connected to server");
        let _data = config;
        _data.header = packetType.serverConnect;
        _data = JSON.stringify(_data);
        ws.send(_data);
        openMeeting();
    }

    let retry = function (e) {
        setTimeout(function () {
            connect();
        }, 3000);
    }
    ws.onerror = retry;
    ws.onclose = retry;
}

connect();