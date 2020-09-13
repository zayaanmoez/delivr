function init() {
    let button = document.getElementsByName("auth")[0];
    button.onclick = authenticate;
}


// Onclick handler to update restaurant info
function authenticate() {
    let req = new XMLHttpRequest();
    req.onreadystatechange= function() {
        if(this.readyState == 4) {
            if (this.status == 401) {
                let err = req.responseText;
                alert(err);
            } else {
                window.location.replace("/");
            }
        } 
    }

    let username = String(document.getElementsByName("username")[0].value);
    let password = String(document.getElementsByName("password")[0].value);
    if(!username || !password) {
        alert("Username and password can not be blank!")
    }
    let url;
    if(document.getElementById("script").getAttribute("auth") == "Login") url = "/login";
    if(document.getElementById("script").getAttribute("auth") == "Register") url = "/register";

    req.open("POST", url);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({"username": username, "password": password}));
}