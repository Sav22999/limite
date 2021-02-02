browser.tabs.query({active: true, currentWindow: true}, function (tabs) {

    // since only one tab should be active and in the current window at once
    // the return variable should only have one entry
    var activeTab = tabs[0];
    var activeTabId = activeTab.id; // or do whatever you need
    var activeTabUrl = activeTab.url; // or do whatever you

    //oldUrl = currentUrl;
    currentUrl = activeTabUrl;
    console.log(currentUrl)
    console.log(JSON.stringify(tabs[0]));
});

/*var currentUrl = "";
var enabledOrNot = true;

var timer = null;

var timeSpentToday = 0;
var timeSpentAlways = 0;

function increaseTimeBackground(url) {
    if (enabledOrNot) {
        timeSpentToday++;
        timeSpentAlways++;
        console.log(timeSpentToday);
        if (url.toString() == currentUrl) {
            saveUrlToDataBackground(enabledOrNot, 0);
        }
    }
}


function getShortUrlBackground(url) {
    let urlToReturn = url.toString();
    let urlParts, urlPartsTemp;

    if (url.toString().includes(":")) {
        urlParts = url.toString().split(":");
        urlToReturn = urlParts[1];
        if (isUrlSupportedBackground(url)) {
        } else {
            return "This is URL is not supported";
        }
    }

    if (urlToReturn.includes("/")) {
        urlPartsTemp = urlToReturn.split("/");
        if (urlPartsTemp[0] == "" && urlPartsTemp[1] == "") {
            urlToReturn = urlPartsTemp[2];
        }
    }

    if (urlToReturn.includes(".")) {
        urlPartsTemp = urlToReturn.split(".");
        if (urlPartsTemp[0] == "www") {
            urlToReturn = urlToReturn.substr(4);
        }
    }

    return urlToReturn;
}

function getTheProtocolBackground(url) {
    return url.toString().split(":")[0];
}

function isUrlSupportedBackground(url) {
    let valueToReturn = false;
    switch (getTheProtocolBackground(url.toString())) {
        case "http":
        case "https":
            //the URL is supported
            valueToReturn = true;
            break;

        default:
            valueToReturn = true;
    }
    return valueToReturn;
}

browser.tabs.query({active: true, currentWindow: true}, function (tabs) {

    // since only one tab should be active and in the current window at once
    // the return variable should only have one entry
    var activeTab = tabs[0];
    var activeTabId = activeTab.id; // or do whatever you need
    var activeTabUrl = activeTab.url; // or do whatever you

    //oldUrl = currentUrl;
    currentUrl = getShortUrlBackground(activeTabUrl);
    console.log(currentUrl)
});


let urlToUse = currentUrl;
if (timer != null) {
    clearInterval(timer);
    timer = null;
}

//disableSwitch(true);//todo remove as comment
if (isUrlSupportedBackground(currentUrl)) {
    browser.storage.local.get("websites", function (value) {
            timeSpentToday = 0;
            timeSpentAlways = 0;
            if (value["websites"] != undefined) {
                websites_json = value["websites"];
                if (websites_json[urlToUse] != undefined) {
                    enabledOrNot = websites_json[urlToUse]["enabled"];
                    timeSpentToday = websites_json[urlToUse][getToday()];
                    timeSpentAlways = websites_json[urlToUse]["always"];
                } else {
                    saveUrlToDataBackground(true, 0);
                }
            } else {
                saveUrlToDataBackground(true, 0);
            }
            if (timer == null) {
                timer = setInterval(function () {
                    increaseTimeBackground(currentUrl)
                }, 1000);
            }
        }
    )
}

function saveUrlToDataBackground(enabled, time = 0) {
    let urlToUse = currentUrl;

    timeSpentToday += time;
    timeSpentAlways += time;

    let value = {};
    value["enabled"] = enabled;
    value[getToday()] = timeSpentToday;
    value["always"] = timeSpentAlways;
    websites_json[urlToUse] = value;

    browser.storage.local.set({"websites": websites_json}, function () {
        //console.log("Saved || " + JSON.stringify(websites_json));
    });
}

function getToday() {
    let todayDate = new Date();
    let today = "";
    today = todayDate.getFullYear() + "-";
    let month = todayDate.getMonth() + 1;
    if (month < 10) today = today + "0" + month + "-";
    else today = today + "" + month + "-";
    let day = todayDate.getDate();
    if (day < 10) today = today + "0" + day;
    else today = today + "" + day;

    return today;
}

 */