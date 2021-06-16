let coachData = {};
const tagData = {
    "tech": {
        name: "Tech",
        color: "purple"
    },
    "education": {
        name: "Education",
        color: "green"
    },
    "food": {
        name: "Food",
        color: "blue"
    },
    "entertainment": {
        name: "Entertainment",
        color: "pink"
    },
    "vc": {
        name: "Venture Capital",
        color: "orange"
    },
    "consulting": {
        name: "Consulting",
        color: "aqua"
    },
    "mm": {
        name: "Mass Media",
        color: "gold"
    },
    "sports": {
        name: "Sports",
        color: "magenta"
    },
    "finance": {
        name: "Finance",
        color: "turquoise"
    },
    "real estate": {
        name: "Real Estate",
        color: "yellow"
    },
}

const panel = document.getElementById("coachInfoPanel");
let panelOpened = "";
function setPanelWidth(coachName) {
    if (panelOpened == coachName) {
        panel.classList.remove("coach-opening");
        panel.classList.add("coach-closing");
        panelOpened = "";
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
        document.getElementById("coachName").innerHTML = "<h1>" + coachData[coachName].name + "</h1>";
        let photo = document.getElementById("coachPhoto");
        photo.innerHTML = "<img src='" + coachData[coachName].photo + "'>";
        window.scrollTo(0, 0);
        //let text = document.getElementById("coachText");
        //text.innerHTML = coachData[coachName].bio;
    }
}

let filterApplied = false;
function filterCoaches(filter) {
    event.stopPropagation();
    let coachList = document.getElementsByClassName("coachBox");
    const reset = document.getElementById("resetFilter");
    filterApplied = (filter !== "");
    if (filterApplied) {
        reset.style.display = "inline";
    }
    else {
        reset.style.display = "none";
    }

    for (let i = 0; i < coachList.length; i++) {
        const coachBox = coachList[i];
        if (coachBox.innerHTML.indexOf(filter) === -1) {
            coachBox.style.display = "none";
        }
        else {
            coachBox.style.display = "flex";
        }
    }
}

const coachTimes=[
    [],
    ["mikemcginley","evanhamilton","jondamico","tylerkim","zachschwartz","natashacase","justinpark","kalikayap","evankeare","cocokaleel","zachgoren","zaakirahdaniels","lucasgelfond"],
    ["evanhamilton","jondamico","tylerkim","justinpark","kalikayap","nickabouzeid","evankeare","cocokaleel","zaakirahdaniels","lucasgelfond"],
    ["mikemcginley","evanhamilton","tylerkim","zachschwartz","justinpark","jondamico","zaakirahdaniels","erinlessin","walterwang","cameronschiller"],
    ["evanhamilton","justinpark","tylerkim","jondamico","nickabouzeid","cocokaleel","zachgoren","erinlessin","cameronschiller"],
    ["mikemcginley","evanhamilton","justinpark","tylerkim","zachschwartz","jondamico","nickabouzeid","cocokaleel","zaakirahdaniels","lucasgelfond","cameronschiller","mattglick","mollieberger","annabarber","spencerrascoff"],
    ["mikemcginley","evanhamilton","tylerkim","justinpark","zachgoren","jondamico","austinkatz"],
    ["evanhamilton","justinpark","tylerkim","nickabouzeid","cocokaleel","erinlessin","jondamico","mattglick","annabarber"],
    ["mikemcginley","evanhamilton","zachschwartz","justinpark","tylerkim","cocokaleel","alexpopof","tarlinray","walterwang","jondamico","mattglick","mollieberger","annabarber"]
]
function checkCoach(coach,d){
    let num=0;
    console.log(d.getDay())
    if (d.getDay()===2&&d.getHours()>=14&&d.getHours()<=16) num=1;
    else if (d.getDay()===3&&d.getHours()>=13&&d.getHours()<=15) num=2;
    else if (d.getDay()===4&&d.getHours()>=10&&d.getHours()<=11) num=3;
    else if (d.getDay()===4&&d.getHours()>=13&&d.getHours()<=14) num=4;
    else if (d.getDay()===4&&d.getHours()>=15&&d.getHours()<=15) num=5;
    else if (d.getDay()===5&&d.getHours()>=9&&d.getHours()<=12) num=6;
    else if (d.getDay()===5&&d.getHours()>=13&&d.getHours()<=17) num=7;
    else if (d.getDay()===6&&d.getHours()>=10&&d.getHours()<=12) num=8;
    return coachTimes[num].includes(coach);
}

const swearRX = new RegExp("\\b(fuck|shit|piss|nigg|hell|cunt|fag)\\b", "i");
const coachListDiv = document.getElementById("coachList");
let requestCoach = -1;
let retry = -1;
function connect() {
    const socket = io('https://node.hwincview.com', {
        transports: ['websocket'],
        'reconnection': true,
        'reconnectionDelay': 3000,
        'reconnectionDelayMax': 5000,
        'reconnectionAttempts': 50000
    });
    //const socket = io('https://node.hwincview.com', { transports: ['websocket'] });

    socket.on("connect", function () {
        console.log("Connected to server");
        let _data = JSON.stringify({
            header: packetType.participantConnect,
            name: localStorage.getItem("username")
        });
        socket.send(_data);
    });

    socket.on("message", function (data) {
        _data = JSON.parse(data); //Parse data as a JS object
        switch (_data.header) {
            case packetType.participantGetCoaches:
                coachData = _data.data;
                coachListDiv.innerHTML = "";
                let currentDate = new Date();
                Object.keys(coachData).forEach(coach => {
                    console.log(coach)
                    if (coachData[coach].tags.length>0&&checkCoach(coach,currentDate)) {
                        let str = "<div class='coachBox hoverable' onclick='openCoachPanel(\"" + coach + "\")'";
                        str += ">" + coachData[coach].name;
                        coachData[coach].tags.forEach(function (tag) {
                            str += "<div class='coachBoxTag hoverable " + tagData[tag].color + "' ";
                            //str+="data-tag='"+tag+"' ";
                            str += "onclick='filterCoaches(\"" + tagData[tag].name + "\")' ";
                            str += "><div>" + tagData[tag].name + "</div></div>";
                        });
                        str += "</div>";
                        coachListDiv.innerHTML += str;
                    }
                });
                break;
            default: break;
        }
    });

    requestCoach = function (msg) {
        if (msg == null) return;
        if (swearRX.test(msg)) {
            alert("Please don't use foul language. These coaches have volunteered their time to help you out, so please respect that.");
        }
        else socket.send(JSON.stringify({
            header: packetType.participantRequestCoach,
            name: localStorage.getItem("username"),
            fullname: localStorage.getItem("fullname"),
            coachName: panelOpened,
            msg: msg
        }));
    }
}
connect();