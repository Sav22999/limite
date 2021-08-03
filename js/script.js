var timeSpentToday = 0;
var timeSpentAlways = 0;

var currentUrl = "";
var oldUrl = "";
var fullUrl = "";
var enabledOrNot = true;

var websites_json = {}

var loadUItimer = null;

var firstTime = true;

var changedEdits = false;

const linkReview = ["https://addons.mozilla.org/firefox/addon/limite/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.com/pools/c/8yl6auiU6e", "https://ko-fi.com/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}

function loaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = tabs[0];
        var activeTabId = activeTab.id; // or do whatever you need
        var activeTabUrl = activeTab.url; // or do whatever you

        setUrl(getShortUrl(activeTabUrl), true);

        //setFavicon(activeTab.favIconUrl);

        oldUrl = currentUrl;
        fullUrl = activeTabUrl;
        currentUrl = getShortUrl(activeTabUrl);
        loadUI();

        if (loadUItimer == null) {
            loadUItimer = setInterval(function () {
                loadUI();
            }, 1000);
        }
    });

    browser.tabs.onUpdated.addListener(tabUpdated);
    disableSwitch(true);

    document.getElementById("buy-me-a-coffee-section").onclick = function () {
        browser.tabs.create({url: linkDonate[0]});
        window.close();
    }
    document.getElementById("open-all-websites").onclick = function () {
        browser.tabs.create({url: "../all-websites/index.html"});
        window.close();
    }
}

function loadUI() {
    //load the UI (without set anything)

    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        let activeTabId = activeTab.id; // or do whatever you need
        let activeTabUrl = activeTab.url; // or do whatever you

        setUrl(getShortUrl(activeTabUrl), true);

        //setFavicon(activeTab.favIconUrl);

        oldUrl = currentUrl;
        fullUrl = activeTabUrl;
        currentUrl = getShortUrl(activeTabUrl);

        let urlToUse = currentUrl;

        disableSwitch(true);
        if (isUrlSupported(fullUrl)) {
            browser.storage.local.get("websites", function (value) {
                timeSpentToday = 0;
                timeSpentAlways = 0;
                if (value["websites"] != undefined) {
                    websites_json = value["websites"];
                    if (websites_json[urlToUse] != undefined) {
                        if (firstTime == true) {
                            let enabled = false;
                            if (websites_json[urlToUse]["enabled"] != undefined) enabled = websites_json[urlToUse]["enabled"];
                            switchToOnOrOff(false, "toggle-thumb", true, enabled);
                            firstTime = false;
                        }
                        timeSpentToday = 0;
                        if (websites_json[urlToUse][getToday()] != undefined) {
                            timeSpentToday = websites_json[urlToUse][getToday()];
                        }
                        timeSpentAlways = 0;
                        for (var key in websites_json[currentUrl]) {
                            if (key != "always" && key != "enabled") {
                                //console.log(k + " : " + websites_json[currentUrl][k])
                                timeSpentAlways += websites_json[currentUrl][key];
                            }
                        }
                    } else {
                    }
                } else {
                }
                disableSwitch(false);
                document.getElementById("today-time").innerHTML = getTimeConverted(timeSpentToday);
                document.getElementById("always-time").innerHTML = getTimeConverted(timeSpentAlways);
            })
        } else {
            disableSwitch(true);
            switchToOff("toggle-thumb");
        }
    });
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    setUrl(getShortUrl(tabInfo.url), true);
    //setFavicon(tabInfo.favIconUrl);

    oldUrl = currentUrl;
    currentUrl = getShortUrl(tabInfo.url);
    firstTime = true;
    loadUI();
}

function setFavicon(url) {
    document.getElementById("toggle-section").style.backgroundImage = "url('" + url + "')";
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
            return "This URL is not supported";
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

function switchToOnOrOff(changeVariable = false, toggleId, forced = false, value = false) {
    if (!forced && document.getElementById(toggleId).style.left == "0px" || forced && value) {
        switchToOn(toggleId, changeVariable);
    } else {
        switchToOff(toggleId, changeVariable);
    }
}

function switchToOn(toggleId, changeVariable = false) {
    document.getElementById(toggleId).style.left = "auto";
    document.getElementById(toggleId).style.right = "0px";
    document.getElementById(toggleId).style.backgroundImage = "url('../img/yes.png')";

    document.getElementById("details-section").style.display = "block";

    if (changeVariable) {
        browser.storage.local.get("edits", function (value) {
            if (value["edits"] !== undefined) changedEdits = value["edits"]["counter"];
            if (!changedEdits) {
                changedEdits = true;
                let editsToPush = {};
                editsToPush["counter"] = changedEdits;
                editsToPush["enabled"] = true;
                browser.storage.local.set({"edits": editsToPush}, function () {
                    enabledOrNot = true;
                });
            }
        });
    }
}

function switchToOff(toggleId, changeVariable = false) {
    document.getElementById(toggleId).style.left = "0px";
    document.getElementById(toggleId).style.right = "auto";
    document.getElementById(toggleId).style.backgroundImage = "url('../img/no.png')";

    document.getElementById("details-section").style.display = "none";

    if (changeVariable) {
        browser.storage.local.get("edits", function (value) {
            if (value["edits"] !== undefined) changedEdits = value["edits"]["counter"];
            if (!changedEdits) {
                changedEdits = true;
                let editsToPush = {};
                editsToPush["counter"] = changedEdits;
                editsToPush["enabled"] = false;
                browser.storage.local.set({"edits": editsToPush}, function () {
                    enabledOrNot = false;
                });
            }
        });
    }
}

function disableSwitch(value) {
    let toggleContainer = document.getElementById("toggle-container");
    toggleContainer.style.top = (document.getElementById("switch-toggle-section").offsetHeight - toggleContainer.offsetHeight) / 2;
    if (value) {
        toggleContainer.onclick = function () {
        }
    } else {
        toggleContainer.onclick = function () {
            switchToOnOrOff(true, "toggle-thumb");
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
            valueToReturn = false;//todo | true->for testing, false->stable release
    }
    return valueToReturn;
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