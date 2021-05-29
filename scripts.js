function checkCookieExists(){
    const username=localStorage.getItem("username");
    if (username!=""){
        fetch("http://willfarhat.com/incView/checkName.php?username="+username)
        .then(function(req){
            req.text().then(function(text){
                console.log(text)
            })
        })
    }
}

function setName(username){
    localStorage.setItem("username",username);
    checkCookieExists();
}