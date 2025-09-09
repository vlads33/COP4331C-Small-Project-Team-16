const urlBase = "http://cop-team16.xyz/LAMPAPI";
const extension = "php";

let userID = 0;
let firstName = "";
let lastName = "";
let justRegistered = false;

function registered() {
    // set justRegistered to cookie value, parsed as boolean
    let data = readCookie("justRegistered");
    justRegistered = (data["justRegistered"] === 'true');

    // acknowledge if user just registered and remove new account link
    if ((window.location.pathname == "/" || window.location.pathname == "/index.html") && justRegistered === true) {
        document.getElementById("loginResult").innerHTML = "Account Created Successfully!";
        document.getElementById("registerLink").innerHTML = "";
    }
}

function resetDefaults() {
    userID = 0;
    firstName = "";
    lastName = "";
}

function doLogin() { // reads username and password
    resetDefaults();
    
    // save login data
    let login = document.getElementById("loginName").value;
    //let password = document.getElementById("loginPassword").value;
    let hash = md5( document.getElementById("loginPassword").value );
    
    document.getElementById("loginResult").innerHTML = ""; // reset result field

    
    let loginfunc = function(jsonObject) {
        userID = jsonObject.id;
        
        // if invalid userID returned, login incorrect
        if (userID < 1) {
            document.getElementById("loginResult").innerHTML = "User/Password Combination Incorrect!";
            return;
        }
        
        // save JSON result info
        firstName = jsonObject.firstName;
        lastName = jsonObject.lastName;
        saveCookie({ "firstName":firstName, "lastName":lastName, "userID":userID }, 20);
        
        window.location.href = "contacts.html"; // link to contacts page
    };
    
    // if error, print to login result
    let printerr = function(err) {
        document.getElementById("loginResult").innerHTML = err.message;
    };
    
    // call API, call loginfunc on result, and printerr if an error happens
    callAPI("Login", { "login":login, "password":hash }, loginfunc, printerr);
}

function doRegister() { // reads firstname, lastname, username, and password
    // save registration data
    let first = document.getElementById("firstName").value;
    let last = document.getElementById("lastName").value;
    let login = document.getElementById("loginName").value;
    let hash = md5( document.getElementById("loginPassword").value );
    
    document.getElementById("registerResult").innerHTML = ""; // reset result field

    
    // if registered, redirect to login page and display message
    let registerfunc = function(jsonObject) {
        saveCookie({ "justRegistered":true }, 1);
        window.location.href = "index.html"; // link to login page
    };
    
    // if error, print to register result
    let printerr = function(err) {
        document.getElementById("registerResult").innerHTML = err.message;
    };
    
    // call API, call registerfunc on result, and printerr if an error happens
    callAPI("Register", { "firstName":first, "lastName":last, "login":login, "password":hash }, registerfunc, printerr);
}

function readAccount() {
    // read account cookie
    let data = readCookie("firstName");

    userID = data[userID]; // try to read userID

    if (typeof(userID) != undefined) {
        // if successful, set variable values
        userID = parseInt(userID.trim());
        firstName = data["firstName"];
        lastName = data["lastName"];
    }
    else {
        // otherwise, return to login
        window.location.href = "index.html";
    }
}

function saveCookie(params, duration) {
    // construct date duration minutes ahead of present
    let date = new Date();
    date.setTime(date.getTime() + (duration * 60 * 1000));
    
    // construct cookie body from params
    let text = ``;
    for (const key in params) {
        text += `${key}=${params[key]},`;
    }
    
    // drop comma from last parameter and add expiration date
    text = text.substring(0, text.length - 1) + `;expires=${date.toGMTString()}`;
    
    
    // set cookie to text, expires on constructed date
    document.cookie = text;
}

function readCookie(name) { // note name of a cookie is name of first variable
    // get data from cookie and trim it
    let data = getCookie(name).split(",");
    data = data.map( (e) => e.trim() );

    // create dictionary to store variables
    let dict = {};

    // record pairs of cookie variables in dictionary
    for (const i of data) {
        let tokens = i.split("=");
        dict[tokens[0]] = tokens[1];
    }

    return dict;
}

function getCookie(name) {
    // grab data after cookie name
    let data = document.cookie;
    let crumbs = data.split(`${name}=`);

    // return cookie data, remove everything after it, preappend cookie name
    return (`${name}=` + crumbs.pop().split(";")[0]);
}

// needs API name, parameters as a dictionary, a function taking one string parameter (JSON API output), and a function taking an error
function callAPI(name, params, func, errfunc) { 
    let jsonPayload = JSON.stringify(params);
    
    let url = `${urlBase}/${name}.${extension}`; // construct API url
    
    // construct request
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    
    try {
        xhr.onreadystatechange = function() {
            // if result successfully received, pass into func
            if (this.readyState === 4 && this.status === 200) {
                let jsonObject = JSON.parse(xhr.responseText);
                
                func(jsonObject);
            }
        };
        xhr.send(jsonPayload); // send JSON payload
    }
    
    // on error, pass to errfunc
    catch(err) {
        errfunc(err);
    }
}
