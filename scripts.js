function checkCookieExists(){
    const username=localStorage.getItem("username");
    if (username!=""){
        fetch("http://willfarhat.com/incView/checkName.php?username="+username)
        .then(function(req){
            req.text().then(function(text){
                if (text=="coach"||true){
                    console.log("Coach");
                    document.getElementById("content").innerHTML="<object type='text/html' data='coach.html'></object>";
                }
                else if (text=="participant"){
                    console.log("Participant");
                    document.getElementById("content").innerHTML="<object type='text/html' data='participant.html'></object>";
                }
                else console.log("Access denied");
            })
        })
    }
}

function setName(username){
    username=username.toLowerCase().replace(/\s/g, '');
    localStorage.setItem("username",username);
    checkCookieExists();
}