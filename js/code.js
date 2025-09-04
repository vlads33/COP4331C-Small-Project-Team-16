const urlBase = "http://cop-team16.xyz/API";
const extension = "php";

let userID = 0;
let firstName = "";
let lastName = "";

function resetDefaults() {
    userID = 0;
    firstName = "";
    lastName = "";
}

function doLogin() { // reads username and password
    resetDefaults();
    
    // save login data
    let login = document.getElementByID("loginName").value;
    let password = document.getElementByID("loginPassword").value;
    // let hash = md5( document.getElementByID("loginPassword").value );
    
    document.getElementById("loginResult").innerHTML = ""; // reset result field
    
    let loginfunc = function(jsonObject) {
        userID = jsonObject.id;
        
        // if invalid userID returned, login incorrect
        if (userID < 1) {
            document.getElementByID("loginResult").innerHTML = "User/Password Combination Incorrect!";
            return;
        }
        
        // save JSON result info
        firstName = jsonObject.firstName;
        lastName = jsonObject.lastName;
        saveCookie();
        
        window.location.href = "contacts.html"; // link to contacts page
    };
    
    // if error, print to login result
    let printerr = function(err) {
        document.getElementByID("loginResult").innerHTML = err.message;
    };
    
    // call API, call login on result, and printerr if an error happens
    callAPI("Login", { login:login, password:password }, login, printerr);
    
    
/*
    // create JSON payload from login credentials
    let tmp = { login:login, password:password };
    let jsonPayload = JSON.stringify(tmp);
    
    let url = urlBase + "/Login." + extension; // construct API url
    
    // create request
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    
    try {
        xhr.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let jsonObject = JSON.parse(xhr.responseText);
                userID = jsonObject.id;
                
                // if invalid userID returned, login incorrect
                if (userID < 1) {
                    document.getElementByID("loginResult").innerHTML = "User/Password Combination Incorrect!";
                    return;
                }
                
                // save JSON result info
                firstName = jsonObject.firstName;
                lastName = jsonObject.lastName;
                saveCookie();
                
                window.location.href = "contacts.html"; // link to contacts page
            }
        };
        xhr.send(jsonPayload);
    }
    
    // if error, print to login result
    catch (err) {
        document.getElementByID("loginResult").innerHTML = err.message;
    }*/
}

function saveCookie() {
    let minutes = 20;
    let date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    
    document.cookie = 'firstName=${firstName},lastname=${lastName},userID=${userID};expires=${date.toGMTString()}';
}

// needs API name, parameters as a dictionary, a function taking one string parameter (JSON API output), and a function taking an error
function callAPI(name, params, func, errfunc) { 
    let jsonPayload = JSON.stringify(params);
    
    let url = '${urlBase}/${name}.${extension}'; // construct API url
    
    // construct request
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    
    try {
        xhr.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let jsonObject = JSON.parse(xhr.responseText);
                
                func(jsonObject);
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err) {
        errfunc(err);
    }
}
