const WebSocket = require('ws');
require("../enumsModule.js");
const ws = new WebSocket('ws://localhost:8000');
const config = require('./config.json'); 

ws.onopen=function(){
    console.log("Connected to server");
    let _data=config;
    _data.header=packetType.serverConnect;
    _data=JSON.stringify(_data);
    ws.send(_data);
}