var timeSpentToday = 0;
var timeSpentAlways = 0;

var currentUrl = "";
var oldUrl = "";
var enabledOrNot = true;

var websites_json = {}

var timer = null;

const linkReview = ["https://addons.mozilla.org/firefox/addon/emoji-sav/"]; //{firefox add-ons}
const linkDonate = ["https://bit.ly/3aJnnq7", "https://ko-fi.com/saveriomorelli"]; //{paypal, ko-fi}

function loaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {

        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = tabs[0];
        var activeTabId = activeTab.id; // or do whatever you need
        var activeTabUrl = activeTab.url; // or do whatever you

        setUrl(getShortUrl(activeTabUrl), true);

        setFavicon(activeTab.favIconUrl);

        oldUrl = currentUrl;
        currentUrl = getShortUrl(activeTabUrl);
        setUIFromData(activeTabUrl);
    });

    browser.tabs.onUpdated.addListener(tabUpdated);
    disableSwitch(true);

    document.getElementById("buy-me-a-coffee-section").onclick = function () {
        browser.tabs.create({url: linkDonate[0]});
        window.close();
    }
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    setUrl(getShortUrl(tabInfo.url), true);
    setFavicon(tabInfo.favIconUrl);

    oldUrl = currentUrl;
    currentUrl = getShortUrl(tabInfo.url);
    setUIFromData(tabInfo.url);
}

function setFavicon(url) {
    //document.getElementById("toggle-section").style.backgroundImage = "url('" + url + "')";
}

function setUrl(url, formatted = false) {
    if (formatted) {
        document.getElementById("website-section").innerHTML = getUrlFormatted(url);
    } else {
        document.getElementById("website-section").innerHTML = url;
    }

    currentUrl = url;
}

function getShortUrl(url) {
    let urlToReturn = url;
    let urlParts, urlPartsTemp;

    if (url.includes(":")) {
        urlParts = url.split(":");
        urlToReturn = urlParts[1];
        if (isUrlSupported(url)) {
            disableSwitch(false);
        } else {
            switchToOff("toggle-thumb");
            disableSwitch(true);
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

function getUrlFormatted(url) {
    let urlParts = url.split(".");
    let i = 0;
    let urlToReturn = "";
    while (i < urlParts.length) {
        if (i == urlParts.length - 2) {
            urlToReturn += "<span class='bold'>";
        }
        urlToReturn += urlParts[i] + "";
        if (i != (urlParts.length - 1)) {
            urlToReturn += "."
        }
        if (i == (urlParts.length - 1)) {
            urlToReturn += "</span>";
        }
        i++;
    }
    return urlToReturn;
}

function getTheProtocol(url) {
    return url.split(":")[0];
}

function saveUrlToData(enabled, time = 0) {
    let urlToUse = currentUrl;

    timeSpentToday += time;
    timeSpentAlways += time;

    document.getElementById("today-time").innerHTML = getTimeConverted(timeSpentToday);
    document.getElementById("always-time").innerHTML = getTimeConverted(timeSpentAlways);

    let value = websites_json[urlToUse];
    value["enabled"] = enabled;
    value["always"] = timeSpentAlways;
    value[getToday()] = timeSpentToday;
    websites_json[urlToUse] = value;

    browser.storage.local.set({"websites": websites_json}, function () {
        //console.log("Saved || " + JSON.stringify(websites_json));
    });
}

function setUIFromData(url) {
    let urlToUse = currentUrl;
    clearInterval(timer);
    timer = null;

    //disableSwitch(true);//todo remove as comment
    disableSwitch(false);
    if (isUrlSupported(url)) {
        browser.storage.local.get("websites", function (value) {
                timeSpentToday = 0;
                timeSpentAlways = 0;
                if (value["websites"] != undefined) {
                    websites_json = value["websites"];
                    if (websites_json[urlToUse] != undefined) {
                        switchToOnOrOff("toggle-thumb", true, websites_json[urlToUse]["enabled"]);
                        if (websites_json[urlToUse][getToday()] != undefined) {
                            timeSpentToday = websites_json[urlToUse][getToday()];
                        } else {
                            timeSpentToday = 0;
                        }
                        if (websites_json[urlToUse]["always"] != undefined) {
                            timeSpentAlways = websites_json[urlToUse]["always"];
                        } else {
                            timeSpentAlways = 0;
                        }

                        document.getElementById("today-time").innerHTML = getTimeConverted(timeSpentToday);
                        document.getElementById("always-time").innerHTML = getTimeConverted(timeSpentAlways);
                    } else {
                        switchToOnOrOff("toggle-thumb", true, true);
                        saveUrlToData(true, 0);
                    }
                } else {
                    switchToOnOrOff("toggle-thumb", true, true);
                    saveUrlToData(true, 0);
                }
                disableSwitch(false);
            }
        )
    } else {
        disableSwitch(true);
        switchToOff("toggle-thumb");
    }
}

function switchToOnOrOff(toggleId, forced = false, value = false) {
    if (!forced && document.getElementById(toggleId).style.left == "0px" || forced && value) {
        switchToOn(toggleId);
    } else {
        switchToOff(toggleId);
    }
}

function switchToOn(toggleId) {
    document.getElementById(toggleId).style.left = "auto";
    document.getElementById(toggleId).style.right = "0px";
    document.getElementById(toggleId).style.backgroundImage = "url('../img/yes.png')";

    document.getElementById("details-section").style.display = "block";

    enabledOrNot = true;
    if (timer == null) {
        timer = setInterval(function () {
            increaseTime(currentUrl, timeSpentToday)
        }, 1000);
    }
}

function switchToOff(toggleId) {
    document.getElementById(toggleId).style.left = "0px";
    document.getElementById(toggleId).style.right = "auto";
    document.getElementById(toggleId).style.backgroundImage = "url('../img/no.png')";

    document.getElementById("details-section").style.display = "none";

    browser.storage.local.get("websites", function (value) {
        if (value["websites"] != undefined) {
            websites_json = value["websites"];
            if (websites_json[currentUrl] != undefined) {
                websites_json[currentUrl]["enabled"] = false;
                browser.storage.local.set({"websites": websites_json}, function () {
                });
            } else {
                websites_json[currentUrl]["enabled"] = false;
                websites_json[currentUrl]["today"] = 0;
                websites_json[currentUrl]["always"] = 0;
                browser.storage.local.set({"websites": websites_json}, function () {
                });
            }
        } else {
            websites_json[currentUrl]["enabled"] = false;
            websites_json[currentUrl]["today"] = 0;
            websites_json[currentUrl]["always"] = 0;
            browser.storage.local.set({"websites": websites_json}, function () {
            });
        }
    });
    enabledOrNot = false;
    clearInterval(timer);
    timer = null;
}

function disableSwitch(value) {
    let toggleContainer = document.getElementById("toggle-container");
    toggleContainer.style.top = (document.getElementById("switch-toggle-section").offsetHeight - toggleContainer.offsetHeight) / 2;
    if (value) {
        toggleContainer.onclick = function () {
        }
    } else {
        toggleContainer.onclick = function () {
            switchToOnOrOff("toggle-thumb");
        }
    }
}

function isUrlSupported(url) {
    let valueToReturn = false;
    switch (getTheProtocol(url)) {
        case "http":
        case "https":
            //the URL is supported
            valueToReturn = true;
            break;

        default:
            //this disable all unsupported website
            //valueToReturn = false;//todo remove this comment
            valueToReturn = true;//this is just for testing
    }
    return valueToReturn;
}

function increaseTime(url) {
    if (enabledOrNot) {
        if (!isInteger(timeSpentToday)) timeSpentToday = 0;
        timeSpentToday++;
        if (!isInteger(timeSpentAlways)) timeSpentAlways = 0;
        timeSpentAlways++;
        if (url == currentUrl) {
            saveUrlToData(true, 0);
        }
    }
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

function getTimeConverted(time) {
    return time;
}

function isInteger(value) {
    if (Number.isNaN(value) == false) {
        if (Number.isInteger(value)) {
            return true;
        }
    }
    return false;
}

loaded();