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
    if (window.location.pathname == "/login.html" && justRegistered === true) {
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
    
    // call API, call loginfunc on result, and print error to loginResult if an error happens
    callAPI("Login", { "login":login, "password":hash }, loginfunc, printError("loginResult"));
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
        window.location.href = "login.html"; // link to login page
    };
    
    // call API, call registerfunc on result, and print error to registerResult if an error happens
    callAPI("Register", { "firstName":first, "lastName":last, "login":login, "password":hash }, registerfunc, printError("registerResult"));
}

function createContact() { // reads firstname, lastname, email, phone, and notes
    // save new contact data
    let first = document.getElementById("firstName").value;
    let last = document.getElementById("lastName").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;
    let notes = document.getElementById("notes").value;

    // accept input only if either email or phone provided (name already required)
    if (email === "" && phone === "") {
        document.getElementById("operationResult").innerHTML = "Must provide either email or phone";
        return;
    }

    // validate phone number and convert to dash only format
    phone = phoneParse(phone);
    if (!phone && phone !== "") {
        document.getElementById("operationResult").innerHTML = "Invalid Phone Number";
        return;
    }

    // if created, print confirmation to operation result, and trigger search refresh
    let createfunc = function(jsonObject) {
        document.getElementById("operationResult").innerHTML = "Contact added successfully";
        document.getElementById("contactForm").reset(); // reset form fields
        searchContacts();
    };

    // call API, call createfunc on result, and print error to operationResult if an error happens
    callAPI("AddContact", { "userID":userID, "firstName":first, "lastName":last, "email":email, "phone":phone, "notes":notes }, createfunc, printError("operationResult"));

    // remove output text after 5 seconds
    setTimeout(() => document.getElementById("operationResult").innerHTML = "", 5000);
}

function searchContacts() { // reads search text; triggers onchange instead of onsubmit
    // return if input is empty, trimming spaces
    if (document.getElementById("searchInput").value.trim() === "") {
        return;
    }

    // save search data
    let search = document.getElementById("searchInput").value;

    // if searched, enter results as table rows
    let searchfunc = function(jsonObject) {
        // save table body element to variable and clear innerHTML
        const table = document.getElementById("contactList");
        table.innerHTML = "";

        // iterate trough all returned contacts and create rows for each
        for(let i = 0; i < jsonObject.results.length; i++) {
            const row = document.createElement("tr");
            table.appendChild(row);

            // get returned string as array, split by commas; limit 6 in case notes field has commas.
            let contact = parseContact(jsonObject.results[i]);
            let contactID = parseInt(contact[0]); // parse contact ID to integer and save

            // format phone number and date
            contact[4] = phoneFormat(contact[4]);
            contact[5] = dateFormat(contact[5]);

            // populate cells with data
            for (let j = 1; j < contact.length; j++) {
                const cell = document.createElement("td");
                cell.innerHTML = contact[j];
                row.appendChild(cell);
            }

            // create edit button for contact and append to row
            const edit = createButton(i, "Edit");
            edit.addEventListener("click", () => onClickEdit(contactID, contact[1], contact[2], contact[3], contact[4], contact[6]));
            row.appendChild(edit);

            // create delete button for contact and append to row
            const del = createButton(i, "Delete");
            del.addEventListener("click", () => deleteContact(contactID, `${contact[1]} ${contact[2]}`));
            row.appendChild(del);
        }
    };

    // call API, call searchfunc on result, and print error to operationResult if an error happens
    callAPI("SearchContacts", { "userID":userID, "search":search }, searchfunc, printError("operationResult"));
}

// to process API output of search function
function parseContact(input) {
    // split input by commas, initialize empty array for result
    let contact = input.split(",");
    let result = [];

    // copy first 6 variables directly into result
    for (let i = 0; i < 6; i++) {
        result.push(contact[i]);
    }

    // merge anything after 6 (the notes section) into result[6]
    let str = "";
    for (let i = 6; i < contact.length; i++) {
        str += contact[i];
        str += ","; // put commas back in string
    }
    str = str.substring(0, str.length - 1); // chop off trailing comma
    result.push(str);

    return result; // return resulting array
}

function createButton(rowNum, text) {
    // create button with id based on text and rowNum and class based on text
    const button = document.createElement("button");
    button.setAttribute("id", (text.toLowerCase() + rowNum));
    button.setAttribute("class", text.toLowerCase()); // set class for formatting
    button.setAttribute("type", "button"); // so button doesn't submit the form

    // set button text to text and return the button
    button.innerHTML = text;
    return button;
}

// called when a contact's delete button is pressed; gives warning, then deletes contact
function deleteContact(contactID, name) {
    // return if user cancels delete
    if (!confirm(`Really delete contact "${name}?" This cannot be undone`)) {
        return;
    }

    // if deleted, print confirmation to operation result, and trigger search refresh
    let deletefunc = function(jsonObject) {
        document.getElementById("operationResult").innerHTML = "Contact deleted successfully";
        searchContacts();
    };

    // call API, call createfunc on result, and print error to operationResult if an error happens
    callAPI("DeleteContact", { "ContactID":contactID }, deletefunc, printError("operationResult"));

    // remove output text after 5 seconds
    setTimeout(() => document.getElementById("operationResult").innerHTML = "", 5000);
}

// call when a contact's edit button is pressed.
function onClickEdit(contactID, first, last, email, phone, notes) {
    // swap form to edit
    const form = document.getElementById("contactForm");
    form.setAttribute("onsubmit", `editContact(${contactID}); return false;`);
    document.getElementById("formTitle").innerHTML = "Edit Contact";
    document.getElementById("saveButton").value = "Save";

    // add cancel button
    const cancel = createButton(1, "Cancel");
    cancel.setAttribute("onclick", "revertForm(true)");
    form.firstElementChild.appendChild(cancel);

    // load contact data into form
    document.getElementById("firstName").value = first;
    document.getElementById("firstName").focus(); // set type cursor to firstName
    document.getElementById("lastName").value = last;
    document.getElementById("email").value = email;
    document.getElementById("phone").value = phone;
    document.getElementById("notes").value = notes;
}

function editContact(contactID) { // reads firstname, lastname, email, phone, and notes
    // save revised contact data
    let first = document.getElementById("firstName").value;
    let last = document.getElementById("lastName").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;
    let notes = document.getElementById("notes").value;

    // accept input only if either email or phone provided (name already required)
    if (email === "" && phone === "") {
        document.getElementById("operationResult").innerHTML = "Must provide either email or phone";
        return;
    }

    // validate phone number and convert to dash only format
    phone = phoneParse(phone);
    if (!phone && phone !== "") {
        document.getElementById("operationResult").innerHTML = "Invalid Phone Number";
        return;
    }

    // if edited, print confirmation to operation result, trigger search refresh, and revert form to create
    let editfunc = function(jsonObject) {
        document.getElementById("operationResult").innerHTML = "Contact edited successfully";
        revertForm();
        searchContacts();
    };

    // call API, call createfunc on result, and print error to operationResult if an error happens
    callAPI("UpdateContact", { "ContactID":contactID, "FirstName":first, "LastName":last, "Email":email, "PhoneNumber":phone, "Notes":notes }, editfunc, printError("operationResult"));

    // remove output text after 5 seconds
    setTimeout(() => document.getElementById("operationResult").innerHTML = "", 5000);
}

// revert edit contact form back to create form
function revertForm(clearOpResult = false) {
    // swap form to create; delete cancel button
    const form = document.getElementById("contactForm");
    form.setAttribute("onsubmit", "createContact(); return false;");
    document.getElementById("formTitle").innerHTML = "Create Contact";
    form.firstElementChild.removeChild(document.getElementById("cancel1"));
    form.reset(); // reset form fields
    document.getElementById("saveButton").value = "Create";
    document.getElementById("firstName").focus(); // set type cursor to firstName

    // clear operation result only if true is passed
    if (clearOpResult) {
        document.getElementById("operationResult").innerHTML = "";
    }
}

function readAccount() {
    // read account cookie
    let data = readCookie("firstName");

    userID = data["userID"]; // try to read userID

    if (typeof userID === 'string' || userID instanceof String) {
        // if successful, set variable values
        userID = parseInt(userID.trim());
        firstName = data["firstName"];
        lastName = data["lastName"];
    }
    else {
        // otherwise, return to login
        window.location.href = "login.html";
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

function doLogout() {
    userId = 0;
    firstName = "";
    lastName = "";
    document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "index.html";
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

// takes an element ID, and returns a function that prints an error to that element
function printError(elementID) {
    return function(err) {
        const target = document.getElementById(elementID);
        if (target) {
            target.innerHTML = err?.message || err;
        }
    };
}

// format date/time in a more readable way
function dateFormat(str) {
    // split date and time into component parts
    let dateTime = str.split(" ");
    let date = dateTime[0].split("-");
    let time = dateTime[1].split(":");

    date = `${date[1]}/${date[2]}/${date[0]}`; // parse date

    // get hour as number, set default suffix to AM
    let hour = parseInt(time[0]);
    let suffix = "AM";

    // if afternoon, switch to PM
    if (hour > 12) {
        hour -= 12;
        suffix = "PM";
    }

    return `${date} ${hour}:${time[1]} ${suffix}`; // return well-formatted date
}

// properly format a phone number given phone number separated by dashes
function phoneFormat(str) {
    let phone = str.split("-");
    return `(${phone[0]}) ${phone[1]}-${phone[2]}`;
}

// given a valid phone number in any format, convert to numbers separated by dashes
function phoneParse(str) {
    let num = str.replace(/\D/g, ""); // remove all non-digit characters

    // return phone number if valid
    if (num.length === 10) {
        return `${num.substring(0,3)}-${num.substring(3,6)}-${num.substring(6,10)}`;
    }
    else if (num.length === 0) {
        return "";
    }
    return (num.length === 0); // otherwise return false
}
