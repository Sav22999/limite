var timeSpentToday = 0;
var lastNotification = {};
var lastNotificationDate = 0;

var currentUrl = "";
var oldUrl = "";
var fullUrl = "";
var enabledOrNot = true;

var websites_json = {}

var checkTimer = null;

var changedEdits = false;
var changedTab = false;

var minimized = false;

var activeTabId;

let categories = {};

const linkReview = ["https://addons.mozilla.org/firefox/addon/limite/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.me/saveriomorelli", "https://ko-fi.com/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}
const icons = ["icon.png", "icon_disabled.png", "icon_yellow.png", "icon_orange.png", "icon_red.png"];

const DEFAULT_CATEGORIES = {
    "social": ["facebook.com", "twitter.com", "instagram.com", "chat.openai.com", "linkedin.com", "tiktok.com", "pinterest.com", "reddit.com"],
    "travel": ["booking.com", "expedia.com", "airbnb.com", "hotels.com", "trivago.it", "trip.com", "hostelworld.com", "lastminute.com", "skyscanner.com", "thetrainline.com", "omio.it", "uber.com", "agoda.com", "edreams.it", "blablacar.com", "blablacar.it"],
    "news": ["bbc.com", "bbc.co.uk", "cnn.com", "rainews.it", "corriere.it", "repubblica.it", "msn.com", "news.yahoo.com", "aol.com", "ladige.it", "ildolomiti.it"],
    "education": ["classroom.google.com", "edu.google.com"],
    "shopping": ["amazon.com", "amazon.it", "amazon.fr", "amazon.de", "ebay.com", "eprice.it", "lafeltrinelli.it", "ibs.it", "mediaworld.it", "euronics.it", "trony.it", "unieuro.it", "justeat.it", "glovoapp.com", "deliveroo.co.uk", "deliveroo.it", "deliveroo.com", "tesco.com", "asda.com", "sainsburys.co.uk", "ah.nl"],
    "search": ["google.com", "google.it", "google.co.uk", "google.fr", "google.de", "bing.com", "duckduckgo.com", "qwant.com", "baidu.com", "yandex.com", "search.yahoo.com"],
    "reference": ["wikipedia.org", "wordreference.com", "dictionary.cambridge.org", "treccani.it", "oxfordlearnersdictionaries.com", "emojipedia.org", "affinity.help"],
    "entertainment": ["youtube.com", "netflix.com", "primevideo.com", "spotify.com", "deezer.com", "disneyplus.com", "imdb.com", "hulu.com"],
    "adults": ["youporn.com", "pornhub.com", "xnxx.com", "xvideos.com", "xhamster.com", "badoo.com", "grindr.com", "tinder.com", "lovoo.com"],
    "sav22999": ["saveriomorelli.com", "emojiaddon.com", "savpdfviewer.com"],
    "develop": ["github.com", "gitlab.com", "addons.mozilla.org", "thunderbird.net", "addons.thunderbird.net", "stackoverflow.com", "w3.org", "w3schools.com", "developer.mozilla.org", "w3docs.com"],
    "messaging": ["whatsapp.com", "web.whatsapp.com", "telegram.org", "web.telegram.org", "t.me", "signal.com", "kakaocorp.com", "snapchat.com", "wechat.com", "line.me"],
    "games": ["store.steampowered.com", "ea.com", "ubisoft.com", "instant-gaming.com"],
    "cloud": ["drive.google.com", "onedrive.live.com", "mega.io", "mega.nz", "pcloud.com", "my.pcloud.com", "icedrive.net", "dropbox.com", "box.com", "sync.com", "nordlocker.com"],
    "health": ["apss.tn.it", "asmbasilicata.it", "aspbasilicata.it", "salute.gov.it"],
    "other": []
};

let thresholdYellow = 60 * 30;
let thresholdOrange = 60 * 60;
let thresholdRed    = 60 * 60 * 3;
let notificationsEnabled = true;
let defaultTrackingEnabled = true;
let whitelist = [];
let blacklist = [];

function loadSettingsFromStorage() {
    browser.storage.local.get("limite_settings", function (value) {
        let settings = value["limite_settings"] || {};
        thresholdYellow = settings["threshold_yellow"] !== undefined ? settings["threshold_yellow"] : 60 * 30;
        thresholdOrange = settings["threshold_orange"] !== undefined ? settings["threshold_orange"] : 60 * 60;
        thresholdRed    = settings["threshold_red"]    !== undefined ? settings["threshold_red"]    : 60 * 60 * 3;
        notificationsEnabled = settings["notifications_enabled"] !== undefined ? settings["notifications_enabled"] : true;
        defaultTrackingEnabled = settings["default_tracking_enabled"] !== undefined ? settings["default_tracking_enabled"] : true;
        whitelist = settings["whitelist"] || [];
        blacklist = settings["blacklist"] || [];
    });
    browser.storage.local.get("limite_categories", function (value) {
        if (value["limite_categories"] !== undefined) {
            categories = value["limite_categories"];
        } else {
            categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
        }
    });
}

function loaded() {
    //catch changing of tab
    browser.tabs.onActivated.addListener(tabUpdated);
    browser.tabs.onUpdated.addListener(tabUpdated);
    browser.windows.onFocusChanged.addListener(checkLostFocus);

    // Reload settings whenever storage changes (e.g. user saves settings page)
    browser.storage.onChanged.addListener(function (changes, area) {
        if (area === "local" && (changes["limite_settings"] || changes["limite_categories"])) {
            loadSettingsFromStorage();
        }
    });

    loadSettingsFromStorage();

    // Save install date (only first time)
    browser.storage.sync.get("limite_install_date", function (data) {
        if (data["limite_install_date"] === undefined) {
            browser.storage.sync.set({"limite_install_date": new Date().toISOString()});
        }
    });

    // Increment total seconds (accumulate in memory, flush every 60s to avoid sync quota)
    let _pendingSeconds = 0;
    setInterval(function () {
        if (enabledOrNot && !minimized) {
            _pendingSeconds++;
        }
    }, 1000);
    setInterval(function () {
        if (_pendingSeconds > 0) {
            let toFlush = _pendingSeconds;
            _pendingSeconds = 0;
            browser.storage.sync.get("limite_total_seconds", function (data) {
                let current = data["limite_total_seconds"] || 0;
                browser.storage.sync.set({"limite_total_seconds": current + toFlush});
            });
        }
    }, 60000);

    //send categories to "all-websites"
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message !== undefined && message["from"] === "all-websites" && message["ask"] === "categories") sendResponse({"categories": categories});
        if (message !== undefined && message["from"] === "popup" && message["ask"] === "increment_opens") {
            browser.storage.sync.get("limite_popup_opens", function (data) {
                let current = data["limite_popup_opens"] || 0;
                browser.storage.sync.set({"limite_popup_opens": current + 1});
            });
        }
    });
}

function checkLostFocus(windowId) {
    if (windowId === browser.windows.WINDOW_ID_NONE) {
        // The browser window is minimized or lost focus
        minimized = true;
    } else {
        //browser has focus
        minimized = false;
    }
    //console.log("Minimized: " + minimized);
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
                if (value["edits"] !== undefined && value["edits"]["counter"]) {
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

function tabUpdated() {
    //console.log("updated");
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = tabs[0];
        activeTabId = activeTab.id;
        var activeTabUrl = activeTab.url;

        setUrl(getShortUrl(activeTabUrl), true);

        oldUrl = currentUrl;
        currentUrl = getShortUrl(activeTabUrl);
        fullUrl = activeTabUrl;
        getSavedData(activeTabUrl);

        changedEdits = false;

        if (checkTimer === null) {
            checkTimer = setInterval(function () {
                checkEverySecond(currentUrl);
            }, 1000);
        }
    });
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
        if (urlPartsTemp[0] === "" && urlPartsTemp[1] === "") {
            urlToReturn = urlPartsTemp[2];
        }
    }

    if (urlToReturn.includes(".")) {
        urlPartsTemp = urlToReturn.split(".");
        if (urlPartsTemp[0] === "www") {
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

    //console.log(JSON.stringify(websites_json));

    let valueToUse = {};
    browser.storage.local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        } else {
            enabledOrNot = true;
        }
        //console.log(JSON.stringify(websites_json));
        changedTab = false;
        timeSpentToday = 0;
        //timeSpentAlways = 0;
        if (websites_json[urlToUse] !== undefined) {
            valueToUse = websites_json[urlToUse];
            if (websites_json[urlToUse][getToday()] !== undefined) {
                timeSpentToday = websites_json[urlToUse][getToday()];
            }

            /*if (websites_json[urlToUse]["always"] !== undefined) {
                timeSpentAlways = websites_json[urlToUse]["always"];
            }*/
        } else {
            websites_json[urlToUse] = {};
        }

        if (valueToUse["category"] === undefined) valueToUse["category"] = getCategory(urlToUse);

        // Apply whitelist/blacklist for new sites
        if (valueToUse["enabled"] === undefined) {
            if (whitelist.includes(urlToUse)) {
                enabled = true;
            } else if (blacklist.includes(urlToUse)) {
                enabled = false;
            } else {
                enabled = defaultTrackingEnabled;
            }
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

        if (timeSpentToday >= 0 && timeSpentToday < thresholdYellow) {
            //below yellow threshold || OK
            changeIcon(0);
            setBadgeText(((timeSpentToday - (timeSpentToday % 60)) / 60).toString() + "m");
        } else if (timeSpentToday >= thresholdYellow && timeSpentToday < thresholdOrange) {
            //yellow
            changeIcon(2);
            createNotification(2, currentUrl, getTimeConverted(thresholdYellow), "You have already spent " + getTimeConverted(thresholdYellow) + " on this site today");
            setBadgeText(((timeSpentToday - (timeSpentToday % 60)) / 60).toString() + "m", "#FFD400", "#000000");
        } else if (timeSpentToday >= thresholdOrange && timeSpentToday < thresholdRed) {
            //orange
            changeIcon(3);
            createNotification(3, currentUrl, getTimeConverted(thresholdOrange), "You have already spent " + getTimeConverted(thresholdOrange) + " on this site today");
            setBadgeText(((timeSpentToday - (timeSpentToday % (60 * 60))) / (60 * 60)).toString() + "h", "#FF7C00", "#000000");
        } else if (timeSpentToday >= thresholdRed) {
            //red
            changeIcon(4);
            createNotification(4, currentUrl, getTimeConverted(thresholdRed), "You have already spent " + getTimeConverted(thresholdRed) + " on this site today");
            setBadgeText(">" + Math.round(thresholdRed / 3600) + "h", "#FF0000");
        }
    })
}

function getSavedData(url) {
    let urlToUse = currentUrl;

    if (isUrlSupported(url)) {
        browser.storage.local.get("websites", function (value) {
                timeSpentToday = 0;
                //timeSpentAlways = 0;
                if (value["websites"] !== undefined) {
                    websites_json = value["websites"];
                    if (websites_json[urlToUse] !== undefined) {
                        let enabled = false;
                        if (websites_json[urlToUse]["enabled"] !== undefined) enabled = websites_json[urlToUse]["enabled"];
                        switchToOnOrOff(true, enabled);
                        timeSpentToday = 0;
                        if (websites_json[urlToUse][getToday()] !== undefined) {
                            timeSpentToday = websites_json[urlToUse][getToday()];
                        }
                        /*
                        if (websites_json[urlToUse]["always"] !== undefined) {
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
    if (enabledOrNot && !minimized) {
        if (url === currentUrl) {
            saveUrlToData(true, 1);
        }
    }
}

function createNotification(type, url, title, content) {
    //send a notification
    if (!notificationsEnabled) return;
    if (getToday() !== lastNotificationDate || lastNotification[url] !== type) {
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

function getTimeConverted(seconds) {
    if (seconds < 60) return seconds + " seconds";
    if (seconds < 3600) return Math.floor(seconds / 60) + " minutes";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " hour" + (Math.floor(seconds / 3600) > 1 ? "s" : "");
    return Math.floor(seconds / 86400) + " day" + (Math.floor(seconds / 86400) > 1 ? "s" : "");
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
    if (Number.isNaN(value) === false) {
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

function getCategory(website) {
    let valueToReturn = "other";
    for (item in categories) {
        if (categories[item].includes(website)) valueToReturn = item;
    }
    //console.log(website + " : " + valueToReturn);//TODO: use for testing websites filter
    return valueToReturn;
}

loaded();
