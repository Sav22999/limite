var timeSpentToday = 0;
var lastNotification = {};
var lastNotificationDate = 0;

var currentUrl = "";
var oldUrl = "";
var enabledOrNot = true;

var websites_json = {}

var checkTimer = null;

var changedEdits = false;
var changedTab = false;

var activeTabId;

const linkReview = ["https://addons.mozilla.org/firefox/addon/limite/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.com/pools/c/8yl6auiU6e", "https://ko-fi.com/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}
const icons = ["icon.png", "icon_disabled.png", "icon_yellow.png", "icon_orange.png", "icon_red.png"];

function loaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = tabs[0];
        activeTabId = activeTab.id;
        var activeTabUrl = activeTab.url;

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

    //catch changing of tab
    browser.tabs.onUpdated.addListener(tabUpdated);
}

function reload() {
    if (!changedTab) {
        browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
            // since only one tab should be active and in the current window at once
            // the return variable should only have one entry
            let activeTab = tabs[0];
            activeTabId = activeTab.id; // or do whatever you need
            let activeTabUrl = activeTab.url; // or do whatever you

            setUrl(getShortUrl(activeTabUrl), true);

            oldUrl = currentUrl;
            currentUrl = getShortUrl(activeTabUrl);
            fullUrl = activeTabUrl;

            browser.storage.local.get("edits", function (value) {
                if (value["edits"] != undefined && value["edits"]["counter"]) {
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
}

function checkStatusEnabled(enabled, force = false) {
    if (!force) {
        if (enabled) increaseTime(currentUrl);
    } else {
        saveUrlToData(enabled, 0);
    }
    if (!enabled) {
        changeIcon(1);
        setBadgeText("");
    }
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    setUrl(getShortUrl(tabInfo.url), true);

    oldUrl = currentUrl;
    currentUrl = getShortUrl(tabInfo.url);
    fullUrl = tabInfo.url;
    changedTab = true;
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

function getTheProtocol(url) {
    return url.split(":")[0];
}

function saveUrlToData(enabled, time = 0) {
    let urlToUse = currentUrl;

    let valueToUse = {};
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] != undefined) {
            websites_json = value["websites"];
        }
        changedTab = false;
        timeSpentToday = 0;
        //timeSpentAlways = 0;
        if (websites_json[urlToUse] != undefined) {
            valueToUse = websites_json[urlToUse];
            if (websites_json[urlToUse][getToday()] != undefined) {
                timeSpentToday = websites_json[urlToUse][getToday()];
            }
            /*if (websites_json[urlToUse]["always"] != undefined) {
                timeSpentAlways = websites_json[urlToUse]["always"];
            }*/
        }

        timeSpentToday += time;
        //timeSpentAlways += time;

        valueToUse["enabled"] = enabled;
        valueToUse[getToday()] = timeSpentToday;
        //valueToUse["always"] = timeSpentAlways;
        websites_json[urlToUse] = valueToUse;

        if (isUrlSupported(fullUrl)) {
            if (!changedEdits) {
                browser.storage.local.set({"websites": websites_json}, function () {
                    //console.log("Background || Saved || Status: " + enabledOrNot + " || " + JSON.stringify(websites_json));
                    //console.log("Background || Saved || Status: " + enabledOrNot + "");
                    //console.log("Background || Saved || " + JSON.stringify(websites_json[currentUrl]));
                });
            }
        }
    })
}

function getSavedData(url) {
    let urlToUse = currentUrl;

    if (isUrlSupported(url)) {
        browser.storage.local.get("websites", function (value) {
                timeSpentToday = 0;
                //timeSpentAlways = 0;
                if (value["websites"] != undefined) {
                    websites_json = value["websites"];
                    if (websites_json[urlToUse] != undefined) {
                        let enabled = false;
                        if (websites_json[urlToUse]["enabled"] != undefined) enabled = websites_json[urlToUse]["enabled"];
                        switchToOnOrOff(true, enabled);
                        timeSpentToday = 0;
                        if (websites_json[urlToUse][getToday()] != undefined) {
                            timeSpentToday = websites_json[urlToUse][getToday()];
                        }
                        /*
                        if (websites_json[urlToUse]["always"] != undefined) {
                            timeSpentAlways = websites_json[urlToUse]["always"];
                        } else {
                            timeSpentAlways = 0;
                        }*/
                    } else {
                        saveUrlToData(true, 0);
                    }
                } else {
                    saveUrlToData(true, 0);
                }
                changedTab = false;
            }
        )
    } else {
        switchToOff();
        changedTab = false;
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
    changeIcon(0);
}

function switchToOff() {
    enabledOrNot = false;
    changeIcon(1);
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

function checkEverySecond(url) {
    reload();
    //console.log("Checking... || Enabled: " + enabledOrNot + " || Changed: " + changedEdits);
}

function increaseTime(url) {
    if (enabledOrNot) {
        if (url == currentUrl) {
            saveUrlToData(true, 1);
        }

        if (timeSpentToday >= 0 && timeSpentToday < 60 * 30) {
            //30 minutes || OK
            changeIcon(0);
            setBadgeText(((timeSpentToday - (timeSpentToday % 60)) / 60).toString() + "m");
        } else if (timeSpentToday >= 60 * 30 && timeSpentToday < 60 * 60) {
            //60 minutes (1 hour) || Yellow
            changeIcon(2);
            createNotification(2, currentUrl, "30 minutes", "You have already spent 30 minutes on this site today");
            setBadgeText(((timeSpentToday - (timeSpentToday % 60)) / 60).toString() + "m", "#FFD400", "#000000");
        } else if (timeSpentToday >= 60 * 60 && timeSpentToday < 60 * 60 * 3) {
            //3 hours || Orange
            changeIcon(3);
            createNotification(3, currentUrl, "1 hour", "You have already spent 1 hour on this site today");
            setBadgeText(((timeSpentToday - (timeSpentToday % (60 * 60))) / (60 * 60)).toString() + "h", "#FF7C00", "#000000");
        } else if (timeSpentToday >= 60 * 60 * 3) {
            //>3 hours || Red
            changeIcon(4);
            createNotification(4, currentUrl, "3 hours", "You have already spent 1 hours on this site today");
            setBadgeText(">3h", "#FF0000");
        }

        //console.log("All websites: " + JSON.stringify(websites_json));
    }
}

function createNotification(type, url, title, content) {
    //send a notification
    if (getToday() != lastNotificationDate || lastNotification[url] != type) {
        lastNotificationDate = getToday();
        lastNotification[url] = type;
        browser.notifications.create({
            "type": "basic",
            "iconUrl": "./img/icon-48.png",
            "title": title,
            "message": content
        });
    } else {
        //already sent
    }

    //console.log(JSON.stringify(lastNotification));
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

function changeIcon(index) {
    browser.browserAction.setIcon({path: "../img/" + icons[index], tabId: activeTabId});
}

function setBadgeText(text, background_color = "#0080FF", text_color = "#FFFFFF") {
    browser.browserAction.setBadgeText({text: text});
    browser.browserAction.setBadgeTextColor({color: text_color});
    browser.browserAction.setBadgeBackgroundColor({color: background_color});
}

loaded();