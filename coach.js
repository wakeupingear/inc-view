let layoutData = {};
const specialRooms = ["libraryF2Bridge"];
const statusColors = ["var(--c_red)", "var(--c_yellow)", "var(--c_green)"];
function positionButtons() {
  const list = document.getElementsByClassName("navButton");
  //const base=document.getElementById("largeVideoWrapper");
  for (let i = 0; i < list.length; i++) {
    const button = list[i];
    button.style.left = button.dataset.x + "%";
    button.style.top = button.dataset.y + "%";
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
  } else {
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
    } else {
      mapFloor.style.width = "0%";
      mapFloor.dataset.active = false;
    }
  }
}
setMap("-1");

let buttonData = {};
let currentLocation = "";
function createButtons() {
  const vid = document.getElementById("videoButtons");
  vid.innerHTML = "";
  Object.entries(buttonData).forEach((element) => {
    vid.innerHTML += element;
  });
}

function generateRooms() {
  const holder = document.getElementById("tempHolder");
  holder.innerHTML = "";
  //const f1 = document.getElementById("layoutF1");
  //const f2 = document.getElementById("layoutF2");
  let i = 0;
  Object.keys(layoutData).forEach((location) => {
    let parent = holder;
    let _color = statusColors[layoutData[location].status] + ";filter:brightness(" + (100 - i * 6) + "%);";
    if (specialRooms.includes(location)) _color = layoutData[location].color;
    /*if ("inactive" in layoutData[location]) _color = "gray";
    if (location.indexOf("F2") !== -1) parent = f2;
    parent.innerHTML +=
      "<div class='mapBox hoverable' style='bottom:" +
      (100 - layoutData[location].top) +
      "%;left:" +
      layoutData[location].left +
      "%;height:" +
      layoutData[location].height +
      "%;width:" +
      layoutData[location].width +
      "%;background-color:" +
      _color +
      ";' data-tool-tip='" +
      layoutData[location].name +
      "' onclick='setRoomChange(\"" +
      location +
      "\");'></div>";*/
    //&&location!==currentLocation
    //for (var k = 0; k < 9; k++) {
      if (!("inactive" in layoutData[location]) && location !== currentLocation) {
        parent.innerHTML += "<div class='mapBoxText hoverable' data-tool-tip='" +
          layoutData[location].name +
          "' style='background-color:" + _color +
          "' onclick='setRoomChange(\"" +
          location +
          "\");'>" + layoutData[location].name + "</div>";
        i++;
      }
    //}
  });
}

function setupButtonList() {
  buttonData = {};
  if (false) {
    Object.keys(layoutData[currentLocation].adjacent).forEach((adj) => {
      if ("inactive" in layoutData[adj]) return;
      buttonData[adj] =
        "<div class='navButton hoverable " +
        layoutData[adj].color +
        "' data-x=" +
        layoutData[currentLocation].adjacent[adj].x +
        " data-y=" +
        layoutData[currentLocation].adjacent[adj].y +
        " onclick='setRoomChange(\"" +
        adj +
        "\")'>" +
        layoutData[adj].name +
        "</div>";
    });
  }
  createButtons();
}

function connect() {
  const socket = io('https://node.hwincview.com', {
    transports: ['websocket'],
    'reconnection': true,
    'reconnectionDelay': 3000,
    'reconnectionDelayMax': 5000,
    'reconnectionAttempts': 50000
  });

  socket.on("connect", function () {
    console.log("Connected to server");
    let _data = JSON.stringify({
      header: packetType.clientConnect,
      name: localStorage.getItem("username"),
    });
    socket.send(_data);
  });

  let jitsiWindow = -1;
  setRoomChange = function (_location) {
    //Bad global variable! Needs socket ref tho so ¯\_(ツ)_/¯
    if (
      _location !== "" &&
      (currentLocation === _location || "inactive" in layoutData[_location])
    ) {
      return;
    }
    const vid = document.getElementById("videoJitsi");
    vid.innerHTML = "";
    currentLocation = _location.replace(/\s/g, "");
    if (currentLocation !== "") {
      console.log("New room: " + currentLocation);

      const myUsername = localStorage.getItem("fullname");
      const domain = "meet.jit.si";
      const options = {
        roomName: currentLocation,
        parentNode: vid,
        userInfo: {
          displayName: myUsername,
        },
        interfaceConfigOverwrite: {
          SHOW_CHROME_EXTENSION_BANNER: false,
        },
        configOverwrite: {
          SHOW_CHROME_EXTENSION_BANNER: false,
        },
      };
      jitsiWindow = new JitsiMeetExternalAPI(domain, options);

      setupButtonList();
      positionButtons();
      generateRooms();
      setMap(currentLocation.match(/\d+/)[0]);
    } else {
      setMap("-1");
    }
  };

  socket.on("message", function (data) {
    _data = JSON.parse(data); //Parse data as a JS object
    switch (_data.header) {
      case packetType.nodeLayout:
        layoutData = _data.data;
        console.log(layoutData);
        generateRooms();
        socket.send(JSON.stringify({ header: packetType.confirmLayout }));
        break;
      case packetType.clientStartViewing:
        setRoomChange(_data.location);
        break;
      case packetType.coachRequested:
        buttonData[_data.room] =
          "<div class='navButton hoverable " +
          layoutData[_data.room].color +
          "' data-x=50 data-y=0 onclick='setRoomChange(\"" +
          _data.room +
          "\")'>" +
          _data.name +
          " is asking for help!</div>";
        createButtons();
        break;
      default:
        break;
    }
  });

  let retry = function (e) {
    //There's an infinite retry bug in here somewhere
    if (currentLocation !== "") {
      setMap("-1");
      document.getElementById("videoJitsi").innerHTML = "";
      currentLocation = "";
    }
  };
  socket.on("error", function () {
    retry();
  });
  socket.on("disconnect", function () {
    retry();
  });
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
  } else {
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
