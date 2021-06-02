let layoutData = {};

function positionButtons() {
    const list = document.getElementsByClassName("navButton");
    //const base=document.getElementById("largeVideoWrapper");
    for (let i = 0; i < list.length; i++) {
        const button = list[i];
        button.style.left = (button.dataset.x) + "%";
        button.style.top = (button.dataset.y) + "%";
    }
}
window.onresize = positionButtons;

function setMap(location) {
    const loading = document.getElementById("loading");
    const closeButton = document.getElementById("closeButton");
    const mapHolder = document.getElementById("mapHolder");
    if (location === "-1") {
        closeButton.style.display = "none";
        mapHolder.style.display = "none";
        loading.style.display = "flex";
    }
    else {
        closeButton.style.display = "flex";
        mapHolder.style.display = "flex";
        loading.style.display = "none";
    }

    const list = document.getElementsByClassName("map");
    for (let i = 0; i < list.length; i++) {
        const mapFloor = list[i];
        if (mapFloor.id.includes(location)) {
            mapFloor.style.width = "100%";
            mapFloor.dataset.active = true;
        }
        else {
            mapFloor.style.width = "0%";
            mapFloor.dataset.active = false;
        }
    }
}
setMap("-1");

let buttonData = {};
let adjacentData = {};
let currentLocation = "";
function createButtons() {
    const vid = document.getElementById("videoButtons");
    vid.innerHTML = "";
    Object.entries(buttonData).forEach(element => {
        vid.innerHTML += element;
    });
}

function setupButtonList() {
    buttonData = {};
    Object.keys(adjacentData).forEach(adj => {
        if ("inactive" in layoutData[adj]) return;
        buttonData[adj] = "<div class='navButton " + layoutData[adj].color + "' data-x=" + adjacentData[adj].x + " data-y=" + adjacentData[adj].y + " onclick='requestRoomChange(\"" + adj + "\")'>" + layoutData[adj].name + "</div>";
    });
    createButtons();
}

function connect() {
    const ws = new WebSocket('ws://52.35.162.61:8000');

    ws.onopen = function () {
        console.log("Connected to server");
        let _data = JSON.stringify({
            header: packetType.clientConnect,
            name: localStorage.getItem("username")
        });
        ws.send(_data);
    }

    requestRoomChange = function (location) { //Bad global variable! Needs ws ref tho so ¯\_(ツ)_/¯
        if (location === currentLocation) return;
        const data = {
            header: packetType.clientRequestViewing,
            location: location
        }
        ws.send(JSON.stringify(data));
    }

    let jitsiWindow = -1;
    ws.onmessage = function (event) {
        _data = JSON.parse(event.data); //Parse data as a JS object
        switch (_data.header) {
            case packetType.clientStartViewing:
                const vid = document.getElementById("videoJitsi");
                vid.innerHTML = "";
                currentLocation = _data.location;
                if (currentLocation != "") {
                    console.log("New room: " + currentLocation);

                    const myUsername = localStorage.getItem("username");
                    const domain = 'meet.jit.si';
                    const options = {
                        roomName: currentLocation,
                        parentNode: vid,
                        userInfo: {
                            displayName: myUsername
                        }
                    };
                    jitsiWindow = new JitsiMeetExternalAPI(domain, options);

                    adjacentData = _data.adjacent;
                    setupButtonList();
                    positionButtons();
                    setMap(currentLocation.match(/\d+/)[0]);
                }
                else {
                    setMap("-1");
                    document.getElementById("videoJitsi").innerHTML = "";
                }
                break;
            case packetType.nodeLayout:
                layoutData = _data.data;
                console.log(layoutData)
                const f1 = document.getElementById("layoutF1");
                const f2 = document.getElementById("layoutF2");
                Object.keys(layoutData).forEach(location => {
                    let parent = f1;
                    let _color = layoutData[location].color;
                    if ("inactive" in layoutData[location]) _color = "gray";
                    if (location.indexOf("F2") !== -1) parent = f2;
                    parent.innerHTML += "<div class='mapBox' style='top:" + layoutData[location].top + ";left:" + layoutData[location].left + ";height:" + layoutData[location].height + ";width:" + layoutData[location].width + ";background-color:" + _color + ";' onclick='requestRoomChange(\"" + location + "\");'><div class='tooltip'><span class='tooltiptext'>" + location + "</span></div></div>";
                });
                ws.send(JSON.stringify({ header: packetType.confirmLayout }));
                break;
            default: break;
        }
    };

    let retry = function (e) { //There's an infinite retry bug in here somewhere
        if (currentLocation !== "") {
            setMap("-1");
            document.getElementById("videoJitsi").innerHTML = "";
            currentLocation = "";
        }
        setTimeout(function () {
            console.log("Disconnected. Retrying in 3s");
            connect();
        }, 3000);
    }
    ws.onclose = retry;
}
connect();

const bar = document.getElementById("sidebar");
new ResizeObserver(() => positionButtons()).observe(bar);
let sidebarOpened = true;
function setSidebarWidth() {
    const closeButton = document.getElementById("closeButton");
    const mapList = document.getElementsByClassName("map");
    if (sidebarOpened) {
        bar.classList.remove("opening");
        bar.classList.add("closing");
        closeButton.classList.remove("gradient-opening");
        closeButton.classList.add("gradient-closing");
        for (let i = 0; i < mapList.length; i++) {
            const mapFloor = mapList[i];
            if (mapFloor.dataset.active === "true") {
                mapFloor.classList.remove("map-opening");
                mapFloor.classList.add("map-closing");
            }
        }
        sidebarOpened = false;
    }
    else {
        bar.classList.remove("closing");
        bar.classList.add("opening");
        closeButton.classList.remove("gradient-closing");
        closeButton.classList.add("gradient-opening");
        for (let i = 0; i < mapList.length; i++) {
            const mapFloor = mapList[i];
            if (mapFloor.dataset.active === "true") {
                mapFloor.classList.remove("map-closing");
                mapFloor.classList.add("map-opening");
            }
        }
        sidebarOpened = true;
    }
}