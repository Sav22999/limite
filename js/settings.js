let websites_json = {};

const DEFAULT_CATEGORIES = {
    "social": ["facebook.com", "twitter.com", "instagram.com", "chat.openai.com", "linkedin.com", "tiktok.com", "pinterest.com", "reddit.com", "threads.net", "mastodon.social", "tumblr.com", "snapchat.com", "discord.com", "beereal.com", "vk.com", "ok.ru", "weibo.com", "line.me", "viber.com"],
    "travel": ["booking.com", "expedia.com", "airbnb.com", "hotels.com", "trivago.it", "trip.com", "hostelworld.com", "lastminute.com", "skyscanner.com", "thetrainline.com", "omio.it", "uber.com", "agoda.com", "edreams.it", "blablacar.com", "blablacar.it", "kayak.com", "momondo.com", "ryanair.com", "easyjet.com", "lufthansa.com", "ita-airways.com", "vueling.com", "wizzair.com", "emirates.com", "qatarairways.com", "tripadvisor.com"],
    "news": ["bbc.com", "bbc.co.uk", "cnn.com", "rainews.it", "corriere.it", "repubblica.it", "msn.com", "news.yahoo.com", "aol.com", "ladige.it", "ildolomiti.it", "nytimes.com", "theguardian.com", "reuters.com", "ansa.it", "ilsole24ore.com", "lastampa.it", "ilfattoquotidiano.it", "tgcom24.mediaset.it", "lequipe.fr", "lemonde.fr", "elpais.com", "spiegel.de", "bild.de", "gazeta.ru", "ria.ru", "tass.ru"],
    "education": ["classroom.google.com", "edu.google.com", "coursera.org", "udemy.com", "edx.org", "khanacademy.org", "duolingo.com", "memrise.com", "babbel.com", "quizlet.com", "skillshare.com", "brilliant.org", "masterclass.com", "italki.com"],
    "shopping": ["amazon.com", "amazon.it", "amazon.fr", "amazon.de", "ebay.com", "eprice.it", "lafeltrinelli.it", "ibs.it", "mediaworld.it", "euronics.it", "trony.it", "unieuro.it", "justeat.it", "glovoapp.com", "deliveroo.co.uk", "deliveroo.it", "deliveroo.com", "tesco.com", "asda.com", "sainsburys.co.uk", "ah.nl", "aliexpress.com", "temu.com", "shein.com", "zalando.it", "yoox.com", "vinted.it", "wallapop.com", "etsy.com", "target.com", "walmart.com", "bestbuy.com"],
    "search": ["google.com", "google.it", "google.co.uk", "google.fr", "google.de", "bing.com", "duckduckgo.com", "qwant.com", "baidu.com", "yandex.com", "yandex.ru", "search.yahoo.com", "ecosia.org", "startpage.com"],
    "reference": ["wikipedia.org", "wordreference.com", "dictionary.cambridge.org", "treccani.it", "oxfordlearnersdictionaries.com", "emojipedia.org", "affinity.help", "merriam-webster.com", "britannica.com", "wolframalpha.com", "quora.com", "stackexchange.com", "reddit.com"],
    "entertainment": ["youtube.com", "netflix.com", "primevideo.com", "spotify.com", "deezer.com", "disneyplus.com", "imdb.com", "hulu.com", "twitch.tv", "crunchyroll.com", "paramountplus.com", "hbomax.com", "apple.com/apple-tv-plus", "dailymotion.com", "vimeo.com", "soundcloud.com", "tidal.com"],
    "adults": ["youporn.com", "pornhub.com", "xnxx.com", "xvideos.com", "xhamster.com", "badoo.com", "grindr.com", "tinder.com", "lovoo.com", "onlyfans.com", "chaturbate.com", "redtube.com", "tube8.com"],
    "sav22999": ["saveriomorelli.com", "emojiaddon.com", "savpdfviewer.com", "notefox.eu", "savmrl.it", "savm.it", "saveriomorelli.it", "illerom.eu", "morelli.dev"],
    "develop": ["github.com", "gitlab.com", "addons.mozilla.org", "thunderbird.net", "addons.thunderbird.net", "stackoverflow.com", "w3.org", "w3schools.com", "developer.mozilla.org", "w3docs.com", "bitbucket.org", "npmjs.com", "docker.com", "codepen.io", "jsfiddle.net", "dev.to", "medium.com", "hackernews.com", "news.ycombinator.com", "vercel.com", "netlify.com", "heroku.com", "aws.amazon.com", "console.cloud.google.com", "azure.microsoft.com"],
    "messaging": ["whatsapp.com", "web.whatsapp.com", "telegram.org", "web.telegram.org", "t.me", "signal.com", "kakaocorp.com", "snapchat.com", "wechat.com", "line.me", "slack.com", "teams.microsoft.com", "zoom.us", "discord.com", "skype.com"],
    "games": ["store.steampowered.com", "ea.com", "ubisoft.com", "instant-gaming.com", "epicgames.com", "gog.com", "rockstargames.com", "nintendo.com", "playstation.com", "xbox.com", "roblox.com", "minecraft.net", "twitch.tv"],
    "cloud": ["drive.google.com", "onedrive.live.com", "mega.io", "mega.nz", "pcloud.com", "my.pcloud.com", "icedrive.net", "dropbox.com", "box.com", "sync.com", "nordlocker.com", "icloud.com", "wetransfer.com", "mediafire.com"],
    "health": ["apss.tn.it", "asmbasilicata.it", "aspbasilicata.it", "salute.gov.it", "webmd.com", "mayoclinic.org", "healthline.com", "nih.gov", "who.int"],
    "other": []
};

let currentCategories = {};
let notificationsEnabled = true;
let defaultTrackingEnabled = true;
let settingsChanged = false;

function markChanged() {
    settingsChanged = true;
    let btn = document.getElementById("save-settings-button");
    btn.disabled = false;
    btn.classList.add("save-button-pending");
    let hint = document.getElementById("save-settings-hint");
    if (hint) hint.style.display = "inline";
}

function markSaved() {
    settingsChanged = false;
    let btn = document.getElementById("save-settings-button");
    btn.disabled = true;
    btn.classList.remove("save-button-pending");
    let hint = document.getElementById("save-settings-hint");
    if (hint) hint.style.display = "none";
}

function loaded() {
    localizeUI();
    // Support buttons
    document.getElementById("support-telegram-button").onclick = function () {
        browser.tabs.create({url: "https://t.me/sav_projects"});
    }
    document.getElementById("review-on-firefox-addons-button").onclick = function () {
        browser.tabs.create({url: "https://addons.mozilla.org/firefox/addon/limite/"});
    }
    document.getElementById("translate-addon").onclick = function () {
        browser.tabs.create({url: "https://crowdin.com/project/limite"});
    }

    // Save settings — disabled until something changes
    let saveBtn = document.getElementById("save-settings-button");
    saveBtn.disabled = true;
    document.getElementById("save-settings-button").onclick = function () {
        saveSettings();
    }

    // Import & Export data
    document.getElementById("import-data-button").onclick = function () {
        importData();
    }
    document.getElementById("export-data-button").onclick = function () {
        exportData();
    }

    // Categories import/export
    document.getElementById("export-categories-button").onclick = function () {
        exportCategories();
    }
    document.getElementById("import-categories-button").onclick = function () {
        importCategories();
    }

    // Delete all data
    document.getElementById("delete-all-data-button").onclick = function () {
        deleteAllData();
    }

    // Notifications toggle
    document.getElementById("toggle-container-notifications").onclick = function () {
        toggleNotifications();
        markChanged();
    }

    // Default tracking toggle
    document.getElementById("toggle-container-default-tracking").onclick = function () {
        defaultTrackingEnabled = !defaultTrackingEnabled;
        updateDefaultTrackingToggleUI(defaultTrackingEnabled);
        markChanged();
    };

    // Whitelist / Blacklist add buttons
    document.getElementById("whitelist-add-button").onclick = function () {
        addWebsiteToList("whitelist");
    };
    document.getElementById("whitelist-add-input").onkeyup = function (event) {
        if (event.key === "Enter") addWebsiteToList("whitelist");
    };
    document.getElementById("blacklist-add-button").onclick = function () {
        addWebsiteToList("blacklist");
    };
    document.getElementById("blacklist-add-input").onkeyup = function (event) {
        if (event.key === "Enter") addWebsiteToList("blacklist");
    };

    ["threshold-yellow", "threshold-orange", "threshold-red", "display-interval-days"].forEach(function (id) {
        document.getElementById(id).addEventListener("input", markChanged);
    });
    ["date-format-select", "default-sort-select"].forEach(function (id) {
        document.getElementById(id).addEventListener("change", markChanged);
    });
    ["show-column-since-time", "show-column-average", "show-column-category"].forEach(function (id) {
        document.getElementById(id).addEventListener("change", function () {
            markChanged();
            updateSortOptionsVisibility();
        });
    });

    // Load saved settings
    loadSettings();

    // Check milestone
    checkMilestone();
}

function updateSortOptionsVisibility() {
    let showSince = document.getElementById("show-column-since-time").checked;
    let showAvg = document.getElementById("show-column-average").checked;
    let showCat = document.getElementById("show-column-category").checked;

    let sortSelect = document.getElementById("default-sort-select");
    if (!sortSelect) return;
    for (let i = 0; i < sortSelect.options.length; i++) {
        let opt = sortSelect.options[i];
        let val = opt.value;
        let visible = true;

        if (val.startsWith("category-") && !showCat) visible = false;
        if (val.startsWith("avg-time-") && !showAvg) visible = false;
        if (val.startsWith("since-install-") && !showSince) visible = false;

        opt.style.display = visible ? "block" : "none";
        if (!visible && sortSelect.value === val) {
            sortSelect.value = "website-asc";
        }
    }
}

function updateInfiniteScrollingOptionsVisibility() {
    let isInfiniteScrollingEnabled = document.getElementById("infinite-scrolling-checkbox").checked;
    let itemsPerPageRow = document.getElementById("items-per-page-row");
    if (itemsPerPageRow) {
        itemsPerPageRow.style.display = isInfiniteScrollingEnabled ? "none" : "flex";
    }
}

// ── Settings load/save ──────────────────────────────────────────────

function loadSettings() {
    browser.storage.local.get("limite_settings", function (value) {
        let settings = value["limite_settings"] || {};

        // Thresholds (stored in seconds, displayed in minutes)
        let yellowSec = settings["threshold_yellow"] !== undefined ? settings["threshold_yellow"] : 60 * 30;
        let orangeSec = settings["threshold_orange"] !== undefined ? settings["threshold_orange"] : 60 * 60;
        let redSec = settings["threshold_red"] !== undefined ? settings["threshold_red"] : 60 * 60 * 3;
        document.getElementById("threshold-yellow").value = Math.round(yellowSec / 60);
        document.getElementById("threshold-orange").value = Math.round(orangeSec / 60);
        document.getElementById("threshold-red").value = Math.round(redSec / 60);

        // Notifications
        notificationsEnabled = settings["notifications_enabled"] !== undefined ? settings["notifications_enabled"] : true;
        updateNotificationToggleUI(notificationsEnabled);

        // Date format
        let fmt = settings["date_format"] || "YYYY-MM-DD";
        document.getElementById("date-format-select").value = fmt;

        // Default tracking
        defaultTrackingEnabled = settings["default_tracking_enabled"] !== undefined ? settings["default_tracking_enabled"] : true;
        updateDefaultTrackingToggleUI(defaultTrackingEnabled);

        // Default sort
        document.getElementById("default-sort-select").value = settings["default_sort_by"] || "website-asc";

        // Column visibility
        document.getElementById("show-column-since-time").checked = settings["show_column_since_time"] !== undefined ? settings["show_column_since_time"] : true;
        document.getElementById("show-column-average").checked = settings["show_column_average"] !== undefined ? settings["show_column_average"] : true;
        document.getElementById("show-column-category").checked = settings["show_column_category"] !== undefined ? settings["show_column_category"] : true;

        updateSortOptionsVisibility();

        // Infinite scrolling
        document.getElementById("infinite-scrolling-checkbox").checked = settings["infinite_scrolling"] !== undefined ? settings["infinite_scrolling"] : true;
        document.getElementById("infinite-scrolling-checkbox").onchange = function() {
            markChanged();
            updateInfiniteScrollingOptionsVisibility();
        };

        // Items per page
        document.getElementById("items-per-page-input").value = settings["items_per_page"] || 20;
        document.getElementById("items-per-page-input").onchange = markChanged;

        updateInfiniteScrollingOptionsVisibility();

        // Display interval
        document.getElementById("display-interval-days").value = settings["display_interval_days"] || 7;

        // Whitelist / Blacklist
        let whitelist = settings["whitelist"] || [];
        let blacklist = settings["blacklist"] || [];
        renderListUI("whitelist", whitelist);
        renderListUI("blacklist", blacklist);

        // Categories
        browser.storage.local.get("limite_categories", function (catValue) {
            let saved = catValue["limite_categories"];
            // Always start from DEFAULT_CATEGORIES keys, then overlay saved values
            currentCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
            if (saved !== undefined && typeof saved === "object") {
                Object.keys(saved).forEach(function (cat) {
                    currentCategories[cat] = saved[cat];
                });
            }
            renderCategoriesUI();
            // After loading everything, ensure button is disabled
            markSaved();
        });
    });
}

function saveSettings() {
    // Read thresholds
    let yellowMin = parseInt(document.getElementById("threshold-yellow").value) || 30;
    let orangeMin = parseInt(document.getElementById("threshold-orange").value) || 60;
    let redMin = parseInt(document.getElementById("threshold-red").value) || 180;

    // Validate ordering
    if (yellowMin >= orangeMin || orangeMin >= redMin) {
        alert("Please make sure: Yellow < Orange < Red.");
        return;
    }

    let settings = {
        "threshold_yellow": yellowMin * 60,
        "threshold_orange": orangeMin * 60,
        "threshold_red": redMin * 60,
        "notifications_enabled": notificationsEnabled,
        "date_format": document.getElementById("date-format-select").value,
        "default_sort_by": document.getElementById("default-sort-select").value,
        "show_column_since_time": document.getElementById("show-column-since-time").checked,
        "show_column_average": document.getElementById("show-column-average").checked,
        "show_column_category": document.getElementById("show-column-category").checked,
        "infinite_scrolling": document.getElementById("infinite-scrolling-checkbox").checked,
        "items_per_page": parseInt(document.getElementById("items-per-page-input").value) || 20,
        "display_interval_days": parseInt(document.getElementById("display-interval-days").value) || 7,
        "default_tracking_enabled": defaultTrackingEnabled,
        "whitelist": Array.from(document.querySelectorAll("#whitelist-list .category-website-item span")).map(s => s.textContent),
        "blacklist": Array.from(document.querySelectorAll("#blacklist-list .category-website-item span")).map(s => s.textContent)
    };

    // Read categories from textareas — REMOVED, now managed via objects in memory
    // currentCategories is already updated by add/delete actions

    browser.storage.local.set({"limite_settings": settings}, function () {
        browser.storage.local.set({"limite_categories": currentCategories}, function () {
            markSaved();
        });
    });
}

// ── Notifications toggle ────────────────────────────────────────────

function toggleNotifications() {
    notificationsEnabled = !notificationsEnabled;
    updateNotificationToggleUI(notificationsEnabled);
}

function updateDefaultTrackingToggleUI(enabled) {
    let thumb = document.getElementById("toggle-thumb-default-tracking");
    if (enabled) {
        thumb.style.left = "auto";
        thumb.style.right = "0px";
        thumb.style.backgroundImage = "url('../img/yes.png')";
    } else {
        thumb.style.left = "0px";
        thumb.style.right = "auto";
        thumb.style.backgroundImage = "url('../img/no.png')";
    }
}

function updateNotificationToggleUI(enabled) {
    let thumb = document.getElementById("toggle-thumb-notifications");
    if (enabled) {
        thumb.style.left = "auto";
        thumb.style.right = "0px";
        thumb.style.backgroundImage = "url('../img/yes.png')";
    } else {
        thumb.style.left = "0px";
        thumb.style.right = "auto";
        thumb.style.backgroundImage = "url('../img/no.png')";
    }
}

// ── Milestone ───────────────────────────────────────────────────────

function checkMilestone() {
    browser.storage.sync.get(["limite_total_seconds", "limite_popup_opens", "limite_milestone_hours_dismissed", "limite_milestone_opens_dismissed"], function (data) {
        let totalSeconds = data["limite_total_seconds"] || 0;
        let totalHours = Math.floor(totalSeconds / 3600);
        let popupOpens = data["limite_popup_opens"] || 0;
        let hoursDismissed = data["limite_milestone_hours_dismissed"] || 0; // 0=never, -1=never show, timestamp=show after
        let opensDismissed = data["limite_milestone_opens_dismissed"] || 0;
        let now = Date.now();

        let showHours = totalHours >= 100 && hoursDismissed !== -1 && (hoursDismissed === 0 || now >= hoursDismissed);
        let showOpens = popupOpens >= 200 && opensDismissed !== -1 && (opensDismissed === 0 || now >= opensDismissed);

        if (showHours) {
            showMilestoneOverlay(
                "🎉 " + totalHours + " hours with Limite!",
                "<p>Wow! You have used <strong>Limite</strong> for over <strong>" + totalHours + " hours</strong>!</p>" +
                "<p>Limite is <strong>free and open-source</strong>. It does not collect any data, does not track you, and never will.</p>" +
                "<p>If Limite has been useful to you, please consider making a small periodic donation to support its development. Every contribution, no matter how small, makes a big difference! 💙</p>",
                "hours"
            );
        } else if (showOpens) {
            showMilestoneOverlay(
                "🎉 " + popupOpens + " times opened!",
                "<p>You have opened the <strong>Limite</strong> popup <strong>" + popupOpens + " times</strong>!</p>" +
                "<p>Limite is <strong>free and open-source</strong>. It does not collect any data, does not track you, and never will.</p>" +
                "<p>If Limite has been useful to you, please consider making a small periodic donation to support its development. Every contribution, no matter how small, makes a big difference! 💙</p>",
                "opens"
            );
        }
    });
}

function showMilestoneOverlay(title, message, type) {
    document.getElementById("milestone-title").textContent = title;
    document.getElementById("milestone-message").innerHTML = message;
    showOverlay("milestone-section");

    document.getElementById("milestone-never-button").onclick = function () {
        let key = type === "hours" ? "limite_milestone_hours_dismissed" : "limite_milestone_opens_dismissed";
        browser.storage.sync.set({[key]: -1});
        hideOverlay("milestone-section");
    };
    document.getElementById("milestone-later-button").onclick = function () {
        let key = type === "hours" ? "limite_milestone_hours_dismissed" : "limite_milestone_opens_dismissed";
        browser.storage.sync.set({[key]: Date.now() + 30 * 24 * 60 * 60 * 1000});
        hideOverlay("milestone-section");
    };
    document.getElementById("milestone-donate-button").onclick = function () {
        browser.tabs.create({url: "https://www.saveriomorelli.com/donate/"});
        hideOverlay("milestone-section");
    };
}

// ── Whitelist / Blacklist UI ──────────────────────────────────────

function renderListUI(listId, websites) {
    let container = document.getElementById(listId + "-list");
    container.textContent = "";
    websites.sort().forEach(function (site, index) {
        let item = createWebsiteListItemForList(listId, site, index, websites);
        container.appendChild(item);
    });
}

function createWebsiteListItemForList(listId, site, index, websites) {
    let item = document.createElement("div");
    item.classList.add("category-website-item");
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    item.style.padding = "4px 8px";
    item.style.background = "#f0f0f0";
    item.style.borderRadius = "4px";
    item.style.marginBottom = "4px";

    let siteName = document.createElement("span");
    siteName.textContent = site;
    siteName.style.fontSize = "14px";

    let deleteBtn = document.createElement("span");
    deleteBtn.classList.add("button", "button-delete", "very-small-button", "category-website-delete");
    deleteBtn.style.width = "25px";
    deleteBtn.style.padding = "0";
    deleteBtn.style.minWidth = "25px";
    deleteBtn.style.backgroundPosition = "center";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.onclick = function () {
        websites.splice(index, 1);
        renderListUI(listId, websites);
        markChanged();
    };

    item.append(siteName, deleteBtn);
    return item;
}

function addWebsiteToList(listId) {
    let input = document.getElementById(listId + "-add-input");
    let url = sanitizeUrl(input.value);
    if (url === "") return;

    // Get current list from DOM
    let websites = Array.from(document.querySelectorAll("#" + listId + "-list .category-website-item span")).map(s => s.textContent);

    if (!websites.includes(url)) {
        websites.push(url);
        renderListUI(listId, websites);
        markChanged();
    }
    input.value = "";
}

// ── Categories UI ───────────────────────────────────────────────────

function sanitizeUrl(url) {
    return url.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/^(www|ftp)\./i, "").replace(/\/+$/, "");
}

function renderCategoriesUI() {
    let container = document.getElementById("categories-container");
    container.textContent = "";

    Object.keys(currentCategories).forEach(function (cat) {
        if (cat === "other") return;
        let wrapper = document.createElement("div");
        wrapper.classList.add("category-editor-row");

        let label = document.createElement("div");
        label.classList.add("category-editor-label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "8px";

        let icon = document.createElement("img");
        icon.src = "../img/categories/" + cat + ".svg";
        icon.classList.add("category-icon");
        icon.style.width = "20px";
        icon.style.height = "20px";

        let labelText = document.createElement("span");
        labelText.textContent = browser.i18n.getMessage("category_" + cat) || (cat.charAt(0).toUpperCase() + cat.slice(1));

        label.append(icon, labelText);

        let listContainer = document.createElement("div");
        listContainer.classList.add("category-websites-list");
        listContainer.id = "list-" + cat;

        let websites = currentCategories[cat] || [];
        websites.sort().forEach(function (site, index) {
            let item = createWebsiteListItem(cat, site, index);
            listContainer.appendChild(item);
        });

        let addBtnWrapper = document.createElement("div");
        addBtnWrapper.classList.add("category-add-wrapper");

        let addInput = document.createElement("input");
        addInput.type = "text";
        addInput.placeholder = browser.i18n.getMessage("add_website_placeholder") || "Add website…";
        addInput.classList.add("textbox", "category-add-input");
        addInput.id = "input-add-" + cat;

        let addBtn = document.createElement("input");
        addBtn.type = "button";
        addBtn.value = "+";
        addBtn.classList.add("button", "category-add-button");
        addBtn.onclick = function () {
            addWebsiteToCategory(cat);
        };

        addInput.onkeyup = function (event) {
            if (event.key === "Enter") {
                addWebsiteToCategory(cat);
            }
        };

        addBtnWrapper.append(addInput, addBtn);

        wrapper.append(label, listContainer, addBtnWrapper);
        container.appendChild(wrapper);
    });
}

function createWebsiteListItem(cat, site, index) {
    let item = document.createElement("div");
    item.classList.add("category-website-item");
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    item.style.padding = "4px 8px";
    item.style.background = "#f0f0f0";
    item.style.borderRadius = "4px";
    item.style.marginBottom = "4px";

    let siteName = document.createElement("span");
    siteName.textContent = site;
    siteName.style.fontSize = "14px";

    let deleteBtn = document.createElement("span");
    deleteBtn.classList.add("button", "button-delete", "very-small-button", "category-website-delete");
    deleteBtn.style.width = "25px";
    deleteBtn.style.padding = "0";
    deleteBtn.style.minWidth = "25px";
    deleteBtn.style.backgroundPosition = "center";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.onclick = function () {
        currentCategories[cat].splice(index, 1);
        renderCategoriesUI();
        markChanged();
    };

    item.append(siteName, deleteBtn);
    return item;
}

function addWebsiteToCategory(cat) {
    let input = document.getElementById("input-add-" + cat);
    let url = sanitizeUrl(input.value);
    if (url !== "") {
        if (!currentCategories[cat]) currentCategories[cat] = [];
        if (!currentCategories[cat].includes(url)) {
            currentCategories[cat].push(url);
            input.value = "";
            renderCategoriesUI();
            markChanged();
        }
    }
}

// ── Import / Export data ────────────────────────────────────────────

function importData() {
    showOverlay("import-section");
    let fileImportElement = document.getElementById("file-import");
    fileImportElement.value = "";

    document.getElementById("cancel-import-data-button").onclick = function () {
        hideOverlay("import-section");
    }
    document.getElementById("import-now-data-button").onclick = function () {
        let file = fileImportElement.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function (e) {
                try {
                    let imported = JSON.parse(e.target.result);
                    if (imported.data) {
                        browser.storage.local.clear(function () {
                            browser.storage.local.set(imported.data, function () {
                                alert("Data imported successfully. Reloading...");
                                location.reload();
                            });
                        });
                    } else if (imported.websites || imported.saveriomorelli_limite) {
                        // saveriomorelli_limite was old v1/v2 key
                        let websites = imported.websites || imported.saveriomorelli_limite;
                        browser.storage.local.set({"websites": websites}, function () {
                            alert("Websites imported successfully. Reloading...");
                            location.reload();
                        });
                    } else {
                        // Maybe it's just raw websites object
                        browser.storage.local.set({"websites": imported}, function () {
                            alert("Websites imported successfully. Reloading...");
                            location.reload();
                        });
                    }
                } catch (err) {
                    alert("Error parsing JSON file: " + err.message);
                }
            };
            reader.readAsText(file);
        } else {
            alert("Please select a file first.");
        }
    }
}

function exportData() {
    showOverlay("export-section");

    document.getElementById("cancel-export-data-button").onclick = function () {
        hideOverlay("export-section");
    }

    document.getElementById("download-now-data-button").onclick = function () {
        browser.storage.local.get(null, function (items) {
            let manifest = browser.runtime.getManifest();
            let export_json = {
                "limite": {
                    "version": manifest.version,
                    "addon_id": (manifest.applications && manifest.applications.gecko) ? manifest.applications.gecko.id : "unknown",
                    "browser": navigator.userAgent,
                    "export_date": new Date().toISOString()
                },
                "data": items
            };

            downloadJson(export_json, buildFilename("limite"));
            hideOverlay("export-section");
        });
    }
}

// ── Import / Export categories ──────────────────────────────────────

function importCategories() {
    showOverlay("import-categories-section");
    let fileEl = document.getElementById("file-import-categories");
    fileEl.value = "";

    document.getElementById("cancel-import-categories-button").onclick = function () {
        hideOverlay("import-categories-section");
    }
    document.getElementById("import-now-categories-button").onclick = function () {
        let file = fileEl.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function (e) {
                try {
                    let imported = JSON.parse(e.target.result);
                    // Accept either {categories:{...}} or directly the categories object
                    if (imported["categories"] !== undefined) imported = imported["categories"];
                    currentCategories = imported;
                    browser.storage.local.set({"limite_categories": currentCategories}, function () {
                        hideOverlay("import-categories-section");
                        renderCategoriesUI();
                        alert("Categories imported successfully!");
                    });
                } catch (err) {
                    alert("Error parsing JSON file: " + err.message);
                }
            };
            reader.readAsText(file);
        } else {
            alert("Please select a file first.");
        }
    }
}

function exportCategories() {
    showOverlay("export-categories-section");

    document.getElementById("cancel-export-categories-button").onclick = function () {
        hideOverlay("export-categories-section");
    }
    document.getElementById("download-now-categories-button").onclick = function () {
        let manifest = browser.runtime.getManifest();
        let export_json = {
            "limite": {
                "version": manifest.version,
                "export_date": new Date().toISOString()
            },
            "categories": currentCategories
        };
        downloadJson(export_json, buildFilename("limite_categories"));
        hideOverlay("export-categories-section");
    }
}

// ── Delete all data ─────────────────────────────────────────────────

function deleteAllData() {
    let confirmation = confirm("Are you sure you want to clear all data?\nYou can't cancel this process once started.");
    if (confirmation) {
        browser.storage.local.clear().then(function () {
            alert("All data deleted.");
            location.reload();
        });
    }
}

// ── Helpers ─────────────────────────────────────────────────────────

function showOverlay(sectionId) {
    document.getElementById("background-opacity").style.display = "block";
    document.getElementById(sectionId).style.display = "block";
}

function hideOverlay(sectionId) {
    document.getElementById("background-opacity").style.display = "none";
    document.getElementById(sectionId).style.display = "none";
}

function downloadJson(obj, filename) {
    let blob = new Blob([JSON.stringify(obj, null, 4)], {type: "application/json"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function buildFilename(prefix) {
    let now = new Date();
    let date_str = now.getFullYear() + "_" +
        String(now.getMonth() + 1).padStart(2, '0') + "_" +
        String(now.getDate()).padStart(2, '0');
    let timestamp = now.getTime();
    return prefix + "_" + date_str + "_" + timestamp + ".json";
}

document.addEventListener("DOMContentLoaded", loaded);
