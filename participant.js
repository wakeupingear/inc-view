let coachData = {};
const tagData = {
    "aero": {
        name: "Aerospace",
        color: "purple"
    },
    "crypto": {
        name: "Cryptocurrency",
        color: "pink"
    },
    "cs": {
        name: "Computer Science",
        color: "blue"
    },
    "game design": {
        name: "Game Design",
        color: "orange"
    },
}

const panel = document.getElementById("coachInfoPanel");
let panelOpened = "";
function setPanelWidth(coachName) {
    if (panelOpened==coachName) {
        panel.classList.remove("coach-opening");
        panel.classList.add("coach-closing");
        panelOpened="";
        return false;
    }
    else {
        panel.classList.remove("coach-closing");
        panel.classList.add("coach-opening");
        panelOpened = coachName;
        return true;
    }
}

function openCoachPanel(coachName) {
    if (setPanelWidth(coachName)) {
        document.getElementById("coachName").innerHTML="<h1>"+coachName+"</h1>";
        let photo=document.getElementById("coachPhoto");
        photo.innerHTML="<img src='"+coachData[coachName].photo+"'>";
        let text=document.getElementById("coachText");
        text.innerHTML=coachData[coachName].bio;
    }
}

let filterApplied=false;
function filterCoaches(filter) {
    event.stopPropagation();
    let coachList = document.getElementsByClassName("coachBox");
    const reset=document.getElementById("resetFilter");
    filterApplied=(filter!=="");
    if (filterApplied){
        reset.style.display="inline";
    }
    else {
        reset.style.display="none";
    }

    for (let i = 0; i < coachList.length; i++) {
        const coachBox = coachList[i];
        if (coachBox.innerHTML.indexOf(filter)===-1){
            coachBox.style.display="none";
        }
        else {
            coachBox.style.display="flex";
        }
    }
}

const coachListDiv = document.getElementById("coachList");
function connect() {
    const ws = new WebSocket('ws://24.205.76.29:8000');

    ws.onopen = function () {
        console.log("Connected to server");
        let _data = JSON.stringify({
            header: packetType.participantConnect,
            name: localStorage.getItem("username")
        });
        ws.send(_data);
    }

    ws.onmessage = function (event) {
        _data = JSON.parse(event.data); //Parse data as a JS object
        switch (_data.header) {
            case packetType.participantGetCoaches:
                coachData = _data.data;
                coachListDiv.innerHTML = "";
                Object.keys(coachData).forEach(coach => {
                    let str = "<div class='coachBox' onclick='openCoachPanel(\"" + coach + "\")'";
                    str += ">" + coach;
                    coachData[coach].tags.forEach(function (tag) {
                        str += "<div class='coachBoxTag " + tagData[tag].color + "' ";
                        //str+="data-tag='"+tag+"' ";
                        str+="onclick='filterCoaches(\""+tagData[tag].name+"\")' ";
                        str+="><div>" + tagData[tag].name + "</div></div>";
                    });
                    str += "</div>";
                    coachListDiv.innerHTML += str;
                });
                break;
            default: break;
        }
    };

    let retry = function (e) { //There's an infinite retry bug in here somewhere
        setTimeout(function () {
            console.log("Disconnected. Retrying in 3s");
            connect();
        }, 3000);
    }
    ws.onclose = retry;
}
connect();