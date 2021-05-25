var timeSpentToday = 0;
var timeSpentAlways = 0;

var currentUrl = "";
var oldUrl = "";
var enabledOrNot = true;

var websites_json = {}

var checkTimer = null;

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

        oldUrl = currentUrl;
        currentUrl = getShortUrl(activeTabUrl);
        getSavedData(activeTabUrl);

        changedEdits = false;

        if (checkTimer == null) {
            checkTimer = setInterval(function () {
                checkEverySecond(currentUrl);
            }, 1000);
        }
    });

    browser.tabs.onUpdated.addListener(tabUpdated);
}

function reload() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        let activeTabId = activeTab.id; // or do whatever you need
        let activeTabUrl = activeTab.url; // or do whatever you

        setUrl(getShortUrl(activeTabUrl), true);

        oldUrl = currentUrl;
        currentUrl = getShortUrl(activeTabUrl);
        fullUrl = activeTabUrl;

        browser.storage.local.get("edits", function (value) {
            if (value["edits"]["counter"]) {
                enabledOrNot = value["edits"]["enabled"];
                //console.log("Updated || Enabled: " + enabledOrNot);
                let editsToPush = {};
                editsToPush["counter"] = false;
                editsToPush["enabled"] = enabledOrNot;
                browser.storage.local.set({"edits": editsToPush}, function () {
                    //console.log("Background || Reset edits = " + JSON.stringify(editsToPush));
                    checkStatusEnabled(enabledOrNot, true);
                    changedEdits = false;
                });
            } else {
                checkStatusEnabled(enabledOrNot);
            }
        });
    });
}

function checkStatusEnabled(enabled, force = false) {
    if (!force) {
        if (enabled) increaseTime(currentUrl);
    } else {
        let urlToUse = currentUrl;
        let value = {};
        if (websites_json[urlToUse] != undefined) value = websites_json[urlToUse];
        value["enabled"] = enabled;
        value["always"] = timeSpentAlways;
        value[getToday()] = timeSpentToday;
        websites_json[urlToUse] = value;

        if (!changedEdits) {
            browser.storage.local.set({"websites": websites_json}, function () {
                //console.log("Background || Saved || Forced || Status: " + enabledOrNot + " || " + JSON.stringify(websites_json));
                //console.log("Background || Saved || Forced || Status: " + enabledOrNot + "");
            });
        }
    }
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    setUrl(getShortUrl(tabInfo.url), true);

    oldUrl = currentUrl;
    currentUrl = getShortUrl(tabInfo.url);
    fullUrl = tabInfo.url;
    getSavedData(tabInfo.url);
}

function setUrl(url, formatted = false) {
    currentUrl = url;
}

function getShortUrl(url) {
    let urlToReturn = url;
    let urlParts, urlPartsTemp;

    if (url.includes(":")) {
        urlParts = url.split(":");
        urlToReturn = urlParts[1];
        if (isUrlSupported(url)) {
        } else {
            switchToOff();
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

function getTheProtocol(url) {
    return url.split(":")[0];
}

function saveUrlToData(enabled, time = 0) {
    let urlToUse = currentUrl;

    timeSpentToday += time;
    timeSpentAlways += time;

    let value = {};
    if (websites_json[urlToUse] != undefined) value = websites_json[urlToUse];
    value["enabled"] = enabled;
    value["always"] = timeSpentAlways;
    value[getToday()] = timeSpentToday;
    websites_json[urlToUse] = value;

    if (isUrlSupported(fullUrl)) {
        if (!changedEdits) {
            browser.storage.local.set({"websites": websites_json}, function () {
                //console.log("Background || Saved || Status: " + enabledOrNot + " || " + JSON.stringify(websites_json));
                //console.log("Background || Saved || Status: " + enabledOrNot + "");
            });
        }
    }
}

function getSavedData(url) {
    let urlToUse = currentUrl;

    if (isUrlSupported(url)) {
        browser.storage.local.get("websites", function (value) {
                timeSpentToday = 0;
                timeSpentAlways = 0;
                if (value["websites"] != undefined) {
                    websites_json = value["websites"];
                    if (websites_json[urlToUse] != undefined) {
                        let enabled = false;
                        if (websites_json[urlToUse]["enabled"] != undefined) enabled = websites_json[urlToUse]["enabled"];
                        switchToOnOrOff(true, enabled);
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
                    } else {
                        saveUrlToData(true, 0);
                    }
                } else {
                    saveUrlToData(true, 0);
                }
            }
        )
    } else {
        switchToOff();
    }
}

function switchToOnOrOff(forced = false, value = false) {
    if (forced && value) {
        switchToOn();
    } else {
        switchToOff();
    }
}

function switchToOn() {
    enabledOrNot = true;
}

function switchToOff() {
    enabledOrNot = false;
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
            valueToReturn = true;//todo | true->for testing, false->stable release
    }
    return valueToReturn;
}

function checkEverySecond(url) {
    reload();
    //console.log("Checking... || Enabled: " + enabledOrNot + " || Changed: " + changedEdits);
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

function isInteger(value) {
    if (Number.isNaN(value) == false) {
        if (Number.isInteger(value)) {
            return true;
        }
    }
    return false;
}

loaded();