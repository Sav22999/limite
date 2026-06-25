let websites_json = {};
let websites_json_by_domain = [];
let smallest_date = "";
let all_dates = [];

let start_date = null;
let days_to_show = 7; //number of days to show
let categories = {};
let isResizing = false;
let hasResized = false;
let startX, startWidth, activeTh;
let column_widths = {};

function makeResizable(th, minWidth = 50, defaultWidth = null) {
    th.dataset.minWidth = minWidth;

    // Apply saved width or default width
    let savedWidth = column_widths[th.id];
    let widthToApply = savedWidth || defaultWidth || th.style.width;

    if (widthToApply && widthToApply !== "auto") {
        th.style.width = widthToApply;
        th.style.minWidth = widthToApply;
        th.style.maxWidth = widthToApply;
    }

    let headerContent = document.createElement("div");
    headerContent.classList.add("th-resizable-content");
    // Sposta i figli esistenti nel nuovo container
    while (th.firstChild) {
        headerContent.appendChild(th.firstChild);
    }

    let resizer = document.createElement("div");
    resizer.classList.add("resizer");

    resizer.addEventListener("dblclick", function (e) {
        let dWidth = defaultWidth || "";
        th.style.width = dWidth; 
        th.style.minWidth = dWidth;
        th.style.maxWidth = dWidth;
        saveColumnWidths();
        e.stopPropagation();
        e.preventDefault();
    });

    resizer.addEventListener("mousedown", function (e) {
        isResizing = true;
        hasResized = false;
        activeTh = th;
        startX = e.pageX;
        startWidth = th.getBoundingClientRect().width;

        e.preventDefault();
        e.stopPropagation();
    });

    th.appendChild(headerContent);
    th.appendChild(resizer);
}

document.addEventListener("mousemove", function (e) {
    if (!isResizing || !activeTh) return;
    let width = startWidth + (e.pageX - startX);
    const minWidth = parseInt(activeTh.dataset.minWidth) || 50;
    if (width < minWidth) width = minWidth;

    activeTh.style.width = width + "px";
    activeTh.style.minWidth = width + "px";
    activeTh.style.maxWidth = width + "px";
    hasResized = true;
});

document.addEventListener("mouseup", function (e) {
    if (isResizing) {
        isResizing = false;
        activeTh = null;
        if (Math.abs(e.pageX - startX) > 5) {
            hasResized = true;
            setTimeout(() => {
                hasResized = false;
            }, 200);
        } else {
            hasResized = false;
        }
        saveColumnWidths();
    }
});

function saveColumnWidths() {
    let widths = {};
    document.querySelectorAll("#table-all-websites th").forEach(th => {
        if (th.id && th.style.width) {
            widths[th.id] = th.style.width;
        }
    });
    browser.storage.local.get("limite_settings", function (val) {
        let settings = val["limite_settings"] || {};
        settings["column_widths"] = widths;
        browser.storage.local.set({"limite_settings": settings});
    });
    column_widths = widths;
}
let sorted_by = "";

let show_column_since_time = true;
let show_column_average = true;
let show_column_category = true;
let infinite_scrolling = true;

let thresholdYellow = 60 * 30;
let thresholdOrange = 60 * 60;
let thresholdRed    = 60 * 60 * 3;

let websites_to_render = [];
let currentIndex = 0;
let PAGE_SIZE = 20;

function loaded() {
    localizeUI();
    document.getElementById("refresh-data-button").onclick = function () {
        //location.reload();
        loadDataFromBrowser(true);
    }
    document.getElementById("open-settings-button").onclick = function () {
        browser.tabs.create({url: browser.runtime.getURL("settings/index.html")});
    }
    document.getElementById("go-today-button").onclick = function () {
        goToday();
    }
    document.getElementById("go-last-button").onclick = function () {
        goLast();
    }
    document.getElementById("go-newer-button").onclick = function () {
        goNewer();
    }
    document.getElementById("go-older-button").onclick = function () {
        goOlder();
    }

    loadDateFormat(function () {
        browser.storage.local.get("limite_settings", function (val) {
            let settings = val["limite_settings"] || {};
            column_widths = settings["column_widths"] || {};
            if (settings["default_sort_by"]) {
                sorted_by = settings["default_sort_by"];
            }
            if (settings["display_interval_days"]) {
                days_to_show = parseInt(settings["display_interval_days"]);
            }
            show_column_since_time = settings["show_column_since_time"] !== undefined ? settings["show_column_since_time"] : true;
            show_column_average = settings["show_column_average"] !== undefined ? settings["show_column_average"] : true;
            show_column_category = settings["show_column_category"] !== undefined ? settings["show_column_category"] : true;
            infinite_scrolling = settings["infinite_scrolling"] !== undefined ? settings["infinite_scrolling"] : true;

            thresholdYellow = settings["threshold_yellow"] !== undefined ? settings["threshold_yellow"] : 60 * 30;
            thresholdOrange = settings["threshold_orange"] !== undefined ? settings["threshold_orange"] : 60 * 60;
            thresholdRed    = settings["threshold_red"]    !== undefined ? settings["threshold_red"]    : 60 * 60 * 3;

            if (settings["items_per_page"]) {
                PAGE_SIZE = parseInt(settings["items_per_page"]);
            }

            if (!infinite_scrolling) {
                document.getElementById("pagination-footer").classList.remove("hidden");
                document.getElementById("items-per-page-all-websites").value = PAGE_SIZE;
                document.getElementById("items-per-page-all-websites").onchange = function() {
                    PAGE_SIZE = parseInt(this.value) || 20;
                    renderPaginationPage(0);
                    renderPaginationControls();
                };
            }

            browser.runtime.sendMessage({from: "all-websites", ask: "categories"}, (response) => {
                if (response !== undefined) {
                    categories = response.categories;
                    loadDataFromBrowser(true);
                }
            });
        });
    });

    document.getElementById("all-websites-dedication-section").onscroll = function () {
        if (document.getElementById("all-websites-dedication-section").scrollTop > 30) {
            document.getElementById("actions").classList.add("section-selected");
        } else {
            if (document.getElementById("actions").classList.contains("section-selected")) {
                document.getElementById("actions").classList.remove("section-selected");
            }
        }
        if (document.getElementById("all-websites-dedication-section").scrollTop > 53) {
            document.getElementById("navigator-days").classList.add("nav-days-fixed");
        } else {
            if (document.getElementById("navigator-days").classList.contains("nav-days-fixed")) {
                document.getElementById("navigator-days").classList.remove("nav-days-fixed");
            }
        }

        // Infinite scrolling
        if (infinite_scrolling) {
            let section = document.getElementById("all-websites-dedication-section");
            if (section.scrollTop + section.clientHeight >= section.scrollHeight - 100) {
                renderNextPage();
            }
        }
    }

    document.getElementById("search-all-websites-text").onkeyup = function () {
        search(document.getElementById("search-all-websites-text").value);
    }

    let titleAllWebsites = document.getElementById("title-all-time-spent");
    let versionNumber = document.createElement("div");
    versionNumber.classList.add("float-right", "small-button");
    versionNumber.textContent = browser.runtime.getManifest().version;
    versionNumber.id = "version";
    titleAllWebsites.append(versionNumber);
}

function goToday() {
    loadDataFromBrowser(true, false);
    start_date = 0;
}

function goLast() {
    loadDataFromBrowser(true, false);
    start_date = 0;
    if (all_dates.length > days_to_show) start_date = all_dates.length - days_to_show;
}

function goNewer() {
    loadDataFromBrowser(true, false);
    //-7
    if (start_date > days_to_show) start_date -= days_to_show;
    else start_date = 0;
}

function goOlder() {
    loadDataFromBrowser(true, false);
    //+7
    if ((start_date + days_to_show) < all_dates.length) start_date += days_to_show;
    //else start_date = all_dates.length - days_to_show;
}

function setDateInterval(from, to) {
    document.getElementById("from-to-date-label").textContent = (browser.i18n.getMessage("days_label") || "Days") + ": " + formatDateDisplay(from) + " – " + formatDateDisplay(to);
}

function formatDateDisplay(dateStr) {
    return applyDateFormat(dateStr);
}

let _dateFormat = "YYYY-MM-DD";

function loadDateFormat(callback) {
    browser.storage.local.get("limite_settings", function (value) {
        let settings = value["limite_settings"] || {};
        _dateFormat = settings["date_format"] || "YYYY-MM-DD";
        if (callback) callback();
    });
}

function applyDateFormat(dateStr) {
    if (!dateStr || dateStr.length !== 10) return dateStr;
    let parts = dateStr.split("-"); // [YYYY, MM, DD]
    let y = parts[0], m = parts[1], d = parts[2];
    switch (_dateFormat) {
        case "DD/MM/YYYY": return d + "/" + m + "/" + y;
        case "MM/DD/YYYY": return m + "/" + d + "/" + y;
        case "DD-MM-YYYY": return d + "-" + m + "-" + y;
        case "DD.MM.YYYY": return d + "." + m + "." + y;
        default:           return dateStr; // YYYY-MM-DD
    }
}

function loadDataFromBrowser(generate_section = true, force_generation = true) {
    browser.storage.local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        }
        if (generate_section) {
            document.getElementById("all-websites-sections").textContent = "";
            //websites_json_by_domain = [];
            loadAllWebsites(generate_section, force_generation);
        }
        //console.log(JSON.stringify(websites_json));
    });
}

function search(value = "") {
    browser.storage.local.get("websites").then(response => {
        websites_json = {};
        if (response["websites"] !== undefined) {
            websites_json = response["websites"];
        }
        websites_json_by_domain = [];
        document.getElementById("search-all-websites-text").value = value.toString();
        let valueToUse = value.toLowerCase();
        for (const website in websites_json) {
            let current_website_json = websites_json[website];
            let condition_category = true//TODO//
            let condition_time = true//TODO//
            let condition_enabled = true//TODO
            if ((website.toLowerCase().includes(valueToUse)) && condition_category && condition_time && condition_enabled) {
                websites_json_by_domain.push(website);
            }
        }
        loadAllWebsites(true, false, false);
    });
}

function deleteAllData() {
    let confirmation = confirm("Are you sure you want to clear all data?\nYou can't cancel this process once started.");
    if (confirmation) {
        let clearStorage = browser.storage.local.clear();
        clearStorage.then(onCleared, onError);
    }
}

function deleteAWebsite(url) {
    let confirmation = confirm("Are you sure you want to clear the selected website (https://" + url + ") and the time spent on it?\nYou can't cancel this process once started.");
    if (confirmation) {
        //delete the selected page
        delete websites_json[url];

        browser.storage.local.set({"websites": websites_json}, function () {
            loadDataFromBrowser(true);
        });
    }
}

function onCleared() {
    //all websites clear || successful
    loadDataFromBrowser(true);
}

function onError(e) {
}


/**
 * Sort by column!
 * @param column it can be "website", "category", "status", "since-install", "avg-time", "date-N" (where N is 0, 1, 2, ...)
 * @param websites the dictionary to sort
 * @param generate_ui true -> it "generates" also the UI, false -> otherwise it changes only the variable
 */
function sortByColumn(column, websites, generate_ui = true, toggle = true) {
    if (sorted_by === "") sorted_by = "website-asc";

    let previousColumn = "";
    let ascOrDesc = "asc";
    if (column === sorted_by.replace("-asc", "").replace("-desc", "")) {
        //same column
        if (sorted_by.includes("-asc") || !sorted_by.includes("-desc")) {
            if (toggle) ascOrDesc = "desc";
            else ascOrDesc = "asc";
        } else if (sorted_by.includes("-desc")) {
            if (toggle) ascOrDesc = "asc";
            else ascOrDesc = "desc";
        }
        previousColumn = column;
    } else {
        previousColumn = sorted_by.replace("-asc", "").replace("-desc", "");
    }

    sorted_by = column + "-" + ascOrDesc;
    if (generate_ui) {
        if (previousColumn !== "" && previousColumn !== column) {
            let prevEl = document.getElementById("th-" + previousColumn);
            if (prevEl) {
                if (prevEl.classList.contains("th-sort-by-column-sel")) prevEl.classList.remove("th-sort-by-column-sel");
                if (prevEl.classList.contains("sort-by-column-asc")) prevEl.classList.remove("sort-by-column-asc");
                if (prevEl.classList.contains("sort-by-column-desc")) prevEl.classList.remove("sort-by-column-desc");
            }
        }

        let currEl = document.getElementById("th-" + column);
        if (currEl) {
            if (!currEl.classList.contains("th-sort-by-column-sel")) currEl.classList.add("th-sort-by-column-sel");
            if (currEl.classList.contains("sort-by-column-asc")) currEl.classList.remove("sort-by-column-asc");
            if (currEl.classList.contains("sort-by-column-desc")) currEl.classList.remove("sort-by-column-desc");
            currEl.classList.add("sort-by-column-" + ascOrDesc);
        }
    }

    //console.log("col " + column + " | prev " + previousColumn + " | sorted_by " + sorted_by)

    websites = getWebsitesToUse(websites_json);
    if (sorted_by.includes("-asc")) {
        //sort as "asc"
        websites = websites.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            return valA > valB ? 1 : -1;
        });
    } else {
        //sort as "desc"
        websites = websites.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            return valA < valB ? 1 : -1;
        });
    }

    if (generate_ui) {
        browser.storage.local.get("websites").then(response => {
            websites_json = {};
            if (response["websites"] !== undefined) {
                websites_json = response["websites"];
            }
            // Re-sort and reset infinite scroll / pagination
            websites_to_render = websites;
            currentIndex = 0;
            let oldTBody = document.getElementById("tbody-table-all-websites");
            if (oldTBody) document.getElementById("table-all-websites").removeChild(oldTBody);
            let tableTBodyElement = document.createElement("tbody");
            tableTBodyElement.id = "tbody-table-all-websites";
            document.getElementById("table-all-websites").append(tableTBodyElement);
            
            if (infinite_scrolling) {
                renderNextPage();
                document.getElementById("pagination-controls").classList.add("hidden");
            } else {
                renderPaginationPage(0);
                renderPaginationControls();
                // Ensure we scroll to top when changing page/sorting in pagination mode
                document.getElementById("all-websites-dedication-section").scrollTop = 0;
            }
        });
    }
    return websites;
}

function getWebsitesToUse(websites_json) {
    let websites_to_use = [];
    let last_seven_days = getLastSevenDays();

    for (let index in websites_json_by_domain) {
        //website
        let current_website = websites_json_by_domain[index];

        let new_website = {};

        new_website["website"] = current_website;
        new_website["status"] = (websites_json[current_website]["enabled"] !== false) ? 1 : 0;
        new_website["category"] = browser.i18n.getMessage("category_" + checkCategory(current_website)) || checkCategory(current_website);

        //since install
        let number_of_days = all_dates.length;

        let sum_since_install = 0;
        for (let date in websites_json[current_website]) {
            if (date !== "always" && date !== "enabled" && date !== "category") {
                sum_since_install += websites_json[current_website][date];
            }
        }
        new_website["since-install"] = sum_since_install;

        let avg_time = 0;
        if (number_of_days > 0) avg_time = sum_since_install / number_of_days;
        new_website["avg-time"] = parseInt(avg_time.toString());

        //days
        for (let date in last_seven_days) {
            let date_to_show = last_seven_days[date];
            let time = 0;
            if (websites_json[current_website][date_to_show] !== undefined) {
                time = websites_json[current_website][date_to_show];
            }
            new_website["date-" + date] = time
        }

        websites_to_use.push(new_website);
    }

    return websites_to_use;
}

function loadAllWebsites(clear = true, load_all_websites = true, apply_filter = true) {
    if (clear) {
        document.getElementById("all-websites-sections").textContent = "";
    }
    if (!isEmpty(websites_json) && load_all_websites || !isEmpty(websites_json_by_domain) && !load_all_websites) {
        //there are websites saved

        if (load_all_websites) {
            websites_json_by_domain = [];
            for (let url in websites_json) {
                websites_json_by_domain.push(url);
            }
        }

        websites_json_by_domain.sort();
        //console.log(JSON.stringify(websites_json_by_domain));

        let websites_to_use = getWebsitesToUse(websites_json);

        //console.log(websites_to_use)
        if (apply_filter) {
            //websites_to_use = sortByColumn("website", websites_to_use, false, false);
        }
        showWebsitesTable(websites_to_use, apply_filter);

    } else {
        //no websites
        let section = document.createElement("div");
        section.classList.add("section-empty");
        section.textContent = "No websites found";

        document.getElementById("all-websites-sections").append(section);
    }
}

function getLastSevenDays() {
    smallest_date = getToday();

    for (let index in websites_json_by_domain) {
        for (let date in websites_json[websites_json_by_domain[index]]) {
            if (date !== "enabled" && date !== "category") {
                if (date < smallest_date) {
                    smallest_date = date;
                }
            }
        }
    }

    all_dates = getAllDates(smallest_date, getToday());
    all_dates.reverse();

    if (start_date === null) start_date = 0;

    let last_seven_days = [];
    let counter = start_date; //from index 0
    while (counter < (days_to_show + start_date)) {
        if (all_dates.length >= (counter + 1)) {
            last_seven_days.push(all_dates[counter]);
        }
        counter++;
    }

    return last_seven_days;
}

function getTHeadTable(websites, last_seven_days) {
    let tableTHeadElement = document.createElement("thead");
    tableTHeadElement.id = "thead-table-all-websites";
    let tableRowElement = document.createElement("tr");

    let thWebsite = document.createElement("th");
    thWebsite.id = "th-website";
    thWebsite.classList.add("th-sort-by-column");
    thWebsite.textContent = browser.i18n.getMessage("column_website") || "Website";

    if (sorted_by === "" || sorted_by === "website-asc") {
        thWebsite.classList.add("th-sort-by-column-sel", "sort-by-column-asc");
        sorted_by = "website-asc";
    }
    if (sorted_by === "website-desc") thWebsite.classList.add("th-sort-by-column-sel", "sort-by-column-desc");
    thWebsite.onclick = function (event) {
        if (isResizing || hasResized) {
            return;
        }
        websites = sortByColumn("website", websites);
    }
    makeResizable(thWebsite, 120, "250px");
    tableRowElement.append(thWebsite);

    let tableHeaderElement = document.createElement("th");
    tableHeaderElement.textContent = browser.i18n.getMessage("column_status") || "Status";
    tableHeaderElement.id = "th-status";
    tableHeaderElement.classList.add("th-sort-by-column");
    tableHeaderElement.style.width = "100px";
    if (sorted_by === "status-asc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-asc");
    if (sorted_by === "status-desc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-desc");
    tableHeaderElement.onclick = function () {
        if (isResizing || hasResized) return;
        websites = sortByColumn("status", websites);
    }
    makeResizable(tableHeaderElement, 80);
    tableRowElement.append(tableHeaderElement);

    if (show_column_category) {
        tableHeaderElement = document.createElement("th");
        tableHeaderElement.textContent = browser.i18n.getMessage("column_category") || "Category";
        tableHeaderElement.id = "th-category";
        tableHeaderElement.classList.add("th-sort-by-column");
        tableHeaderElement.style.width = "170px";
        if (sorted_by === "category-asc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-asc");
        if (sorted_by === "category-desc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-desc");
        tableHeaderElement.onclick = function () {
            if (isResizing || hasResized) return;
            websites = sortByColumn("category", websites);
        }
        makeResizable(tableHeaderElement, 100);
        tableRowElement.append(tableHeaderElement);
    }

    if (show_column_since_time) {
        tableHeaderElement = document.createElement("th");
        tableHeaderElement.textContent = browser.i18n.getMessage("since_install") || "Since install";
        tableHeaderElement.id = "th-since-install";
        tableHeaderElement.classList.add("th-sort-by-column");
        tableHeaderElement.style.width = "120px";
        if (sorted_by === "since-install-asc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-asc");
        if (sorted_by === "since-install-desc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-desc");
        tableHeaderElement.onclick = function () {
            if (isResizing || hasResized) return;
            websites = sortByColumn("since-install", websites);
        }
        makeResizable(tableHeaderElement, 100);
        tableRowElement.append(tableHeaderElement);
    }

    if (show_column_average) {
        tableHeaderElement = document.createElement("th");
        tableHeaderElement.textContent = browser.i18n.getMessage("average_time") || "Average";
        tableHeaderElement.id = "th-avg-time";
        tableHeaderElement.classList.add("th-sort-by-column");
        tableHeaderElement.style.width = "100px";
        if (sorted_by === "avg-time-asc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-asc");
        if (sorted_by === "avg-time-desc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-desc");
        tableHeaderElement.onclick = function () {
            if (isResizing || hasResized) return;
            websites = sortByColumn("avg-time", websites);
        }
        makeResizable(tableHeaderElement, 80);
        tableRowElement.append(tableHeaderElement);
    }
    //days
    for (let date in last_seven_days) {

        let date_to_show = last_seven_days[date];
        tableHeaderElement = document.createElement("th");
        tableHeaderElement.textContent = applyDateFormat(date_to_show);
        tableHeaderElement.id = "th-date-" + date;
        tableHeaderElement.classList.add("th-sort-by-column");
        tableHeaderElement.style.width = "100px";
        if (sorted_by === "date-" + date + "-asc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-asc");
        if (sorted_by === "date-" + date + "-desc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-desc");
        tableHeaderElement.onclick = function () {
            if (isResizing || hasResized) return;
            websites = sortByColumn("date-" + date, websites);
        }
        makeResizable(tableHeaderElement, 80);
        tableRowElement.append(tableHeaderElement);
    }
    setDateInterval(last_seven_days[0], last_seven_days[last_seven_days.length - 1]);

    tableTHeadElement.append(tableRowElement);
    return tableTHeadElement;
}

function getWebsiteToShow(website) {
    return website;
}

function getTBodyTable(websites, last_seven_days) {
    let tableTBodyElement = document.createElement("tbody");
    tableTBodyElement.id = "tbody-table-all-websites";
    for (let website in websites) {
        let tableRowElement = document.createElement("tr");

        //console.log(websites[website]);

        let currentWebsiteElement = document.createElement("h2");
        let current_full_url = "https://" + websites[website]["website"];
        currentWebsiteElement.textContent = getWebsiteToShow(current_full_url);
        currentWebsiteElement.classList.add("link", "go-to-external", "website-url-cell");
        currentWebsiteElement.onclick = function () {
            browser.tabs.create({url: current_full_url});
        }
        currentWebsiteElement.title = current_full_url;

        let buttonDelete = document.createElement("input");
        buttonDelete.type = "button";
        buttonDelete.alt = "Delete";
        buttonDelete.classList.add("button", "button-delete", "very-small-button", "text-align-center");
        buttonDelete.id = "button-delete-single";
        buttonDelete.onclick = function () {
            deleteAWebsite(websites[website]["website"]);
        }


        let tableDataElement = document.createElement("td");
        let urlFlexContainer = document.createElement("div");
        urlFlexContainer.classList.add("url-flex-container");
        urlFlexContainer.append(buttonDelete, currentWebsiteElement);
        tableDataElement.append(urlFlexContainer);
        tableRowElement.append(tableDataElement);

        //status
        let status_to_show = websites[website]["status"];
        let tableDataElementStatus = document.createElement("td");
        tableDataElementStatus.classList.add("status-website");
        let switchToggleSection = document.createElement("div");
        switchToggleSection.id = "switch-toggle-section";
        let toggleContainer = document.createElement("div");
        toggleContainer.id = "toggle-container";
        let toggleBackground = document.createElement("div");
        toggleBackground.id = "toggle-background";
        let toggleThumb = document.createElement("div");
        toggleThumb.id = "toggle-thumb";
        toggleContainer.append(toggleBackground);
        toggleContainer.append(toggleThumb);
        toggleContainer.onclick = function () {
            switchToggleOnOff(toggleThumb, websites[website]["website"], tableDataElementStatus);
        }
        switchToggleSection.append(toggleContainer);
        if (status_to_show) {
            //enabled
            toggleThumb.style.left = "auto";
            toggleThumb.style.right = "0px";
            toggleThumb.style.backgroundImage = "url('../img/yes.png')";
            tableDataElementStatus.append(switchToggleSection);
            tableDataElementStatus.classList.add("status-enabled");
        } else {
            //disabled
            toggleThumb.style.left = "0px";
            toggleThumb.style.right = "auto";
            toggleThumb.style.backgroundImage = "url('../img/no.png')";
            tableDataElementStatus.append(switchToggleSection);
            tableDataElementStatus.classList.add("status-disabled");
        }
        tableRowElement.append(tableDataElementStatus);

        //category
        if (show_column_category) {
            let tableDataElementCategory = document.createElement("td");
            tableDataElementCategory.append(generateCategories(checkCategory(websites[website]["website"]), websites[website]["website"], tableDataElementCategory));
            tableRowElement.append(tableDataElementCategory);
        }


        //since install
        let number_of_days = all_dates.length;

        if (show_column_since_time) {
            let sum_since_install = websites[website]["since-install"];
            let since_install = getTimeConverted(sum_since_install);
            tableDataElement = document.createElement("td");
            tableDataElement.textContent = since_install;
            tableDataElement.title = getTimeConverted(sum_since_install, true);
            tableDataElement.classList.add("since-install-time");
            if (sum_since_install >= (thresholdYellow) * number_of_days && sum_since_install < (thresholdOrange) * number_of_days) {
                tableDataElement.classList.add("yellow");
            } else if (sum_since_install >= (thresholdOrange) * number_of_days && sum_since_install < (thresholdRed) * number_of_days) {
                tableDataElement.classList.add("orange");
            } else if (sum_since_install >= (thresholdRed) * number_of_days) {
                tableDataElement.classList.add("red");
            }
            tableRowElement.append(tableDataElement);
        }

        if (show_column_average) {
            let avg_time = websites[website]["avg-time"];
            let avg_time_to_show = getTimeConverted(avg_time);
            tableDataElement = document.createElement("td");
            tableDataElement.textContent = avg_time_to_show;
            tableDataElement.title = getTimeConverted(avg_time, true);
            tableDataElement.classList.add("avg-time");
            if (avg_time >= (thresholdYellow) && avg_time < (thresholdOrange)) {
                tableDataElement.classList.add("yellow");
            } else if (avg_time >= (thresholdOrange) && avg_time < (thresholdRed)) {
                tableDataElement.classList.add("orange");
            } else if (avg_time >= (thresholdRed)) {
                tableDataElement.classList.add("red");
            }
            tableRowElement.append(tableDataElement);
        }

        //days
        for (let date in last_seven_days) {
            let date_to_show = last_seven_days[date];
            let time = websites[website]["date-" + date] || 0;
            let time_to_show = getTimeConverted(time);
            if (time_to_show === "") time_to_show = getTimeConverted(0);
            tableDataElement = document.createElement("td");
            tableDataElement.textContent = time_to_show;
            tableDataElement.title = getTimeConverted(time, true);
            if (time >= thresholdYellow && time < thresholdOrange) {
                tableDataElement.classList.add("yellow");
            } else if (time >= thresholdOrange && time < thresholdRed) {
                tableDataElement.classList.add("orange");
            } else if (time >= thresholdRed) {
                tableDataElement.classList.add("red");
            }
            tableRowElement.append(tableDataElement);
        }

        tableTBodyElement.append(tableRowElement);
    }
    return tableTBodyElement;
}

function showWebsitesTable(websites, apply_filter = true) {
    let section = document.createElement("div");
    section.classList.add("section", "overflow-auto", "no-padding");
    section.id = "table-section";

    let tableElement = document.createElement("table");
    tableElement.id = "table-all-websites";
    tableElement.classList.add("table-days");

    let tableTHeadElement = getTHeadTable(websites, getLastSevenDays());
    tableElement.append(tableTHeadElement);

    // Initial sort
    let column_to_sort = sorted_by.replace("-asc", "").replace("-desc", "");

    let tableTBodyElement = document.createElement("tbody");
    tableTBodyElement.id = "tbody-table-all-websites";
    tableElement.append(tableTBodyElement);

    section.append(tableElement);
    document.getElementById("all-websites-sections").append(section);

    // Force fixed layout after appending to DOM
    tableElement.style.tableLayout = "fixed";

    sortByColumn(column_to_sort, websites, true, false);

    // renderNextPage(); // Removed, already called by sortByColumn

    if (apply_filter) {
        applyFilter();
    }
}

function renderNextPage() {
    if (currentIndex >= websites_to_render.length) return;
    let last_seven_days = getLastSevenDays();
    let end = Math.min(currentIndex + PAGE_SIZE, websites_to_render.length);
    let slice = websites_to_render.slice(currentIndex, end);
    let tableTBody = document.getElementById("tbody-table-all-websites");
    if (!tableTBody) return;
    let fragment = getTBodyTable(slice, last_seven_days);
    // getTBodyTable returns a tbody element; append its children
    while (fragment.firstChild) {
        tableTBody.append(fragment.firstChild);
    }
    currentIndex = end;
}

function renderPaginationPage(page) {
    currentIndex = page * PAGE_SIZE;
    let last_seven_days = getLastSevenDays();
    let end = Math.min(currentIndex + PAGE_SIZE, websites_to_render.length);
    let slice = websites_to_render.slice(currentIndex, end);
    let tableTBody = document.getElementById("tbody-table-all-websites");
    if (!tableTBody) return;
    tableTBody.textContent = "";
    let fragment = getTBodyTable(slice, last_seven_days);
    while (fragment.firstChild) {
        tableTBody.append(fragment.firstChild);
    }
    // Scroll to top of table
    document.getElementById("all-websites-dedication-section").scrollTop = 0;
}

function renderPaginationControls() {
    let container = document.getElementById("pagination-controls");
    container.textContent = "";
    if (websites_to_render.length === 0) {
        document.getElementById("pagination-footer").classList.add("hidden");
        return;
    }
    document.getElementById("pagination-footer").classList.remove("hidden");

    let totalPages = Math.ceil(websites_to_render.length / PAGE_SIZE);
    let currentPage = Math.floor(currentIndex / PAGE_SIZE);
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;

    // First page
    let btnFirst = document.createElement("button");
    btnFirst.classList.add("button", "button-page-navigation");
    btnFirst.disabled = currentPage === 0;
    let imgFirst = document.createElement("img");
    imgFirst.src = "../img/last.svg";
    imgFirst.style.transform = "rotate(180deg)";
    btnFirst.append(imgFirst);
    btnFirst.onclick = () => {
        renderPaginationPage(0);
        renderPaginationControls();
    };

    // Prev page
    let btnPrev = document.createElement("button");
    btnPrev.classList.add("button", "button-page-navigation");
    btnPrev.disabled = currentPage === 0;
    let imgPrev = document.createElement("img");
    imgPrev.src = "../img/newer.svg";
    btnPrev.append(imgPrev);
    btnPrev.onclick = () => {
        renderPaginationPage(currentPage - 1);
        renderPaginationControls();
    };

    // Info
    let info = document.createElement("span");
    info.id = "pagination-info";
    info.textContent = (currentPage + 1) + " / " + totalPages;

    // Next page
    let btnNext = document.createElement("button");
    btnNext.classList.add("button", "button-page-navigation");
    btnNext.disabled = currentPage === totalPages - 1;
    let imgNext = document.createElement("img");
    imgNext.src = "../img/older.svg";
    btnNext.append(imgNext);
    btnNext.onclick = () => {
        renderPaginationPage(currentPage + 1);
        renderPaginationControls();
    };

    // Last page
    let btnLast = document.createElement("button");
    btnLast.classList.add("button", "button-page-navigation");
    btnLast.disabled = currentPage === totalPages - 1;
    let imgLast = document.createElement("img");
    imgLast.src = "../img/last.svg";
    btnLast.append(imgLast);
    btnLast.onclick = () => {
        renderPaginationPage(totalPages - 1);
        renderPaginationControls();
    };

    container.append(btnFirst, btnPrev, info, btnNext, btnLast);
}

function applyFilter() {
    if (document.getElementById("search-all-websites-text").value.replaceAll(" ", "") !== "") {
        search(document.getElementById("search-all-websites-text").value);
    }
}

function switchToggleOnOff(toggleThumb, current_website, tableDataElement) {
    if (websites_json[current_website]["enabled"] === undefined) websites_json[current_website]["enabled"] = true;

    if (!websites_json[current_website]["enabled"]) {
        //enable
        toggleThumb.style.left = "auto";
        toggleThumb.style.right = "0px";
        toggleThumb.style.backgroundImage = "url('../img/yes.png')";
        websites_json[current_website]["enabled"] = true;
        if (tableDataElement.classList.contains("status-disabled")) tableDataElement.classList.remove("status-disabled");
        tableDataElement.classList.add("status-enabled");
    } else {
        //disable
        toggleThumb.style.left = "0px";
        toggleThumb.style.right = "auto";
        toggleThumb.style.backgroundImage = "url('../img/no.png')";
        websites_json[current_website]["enabled"] = false;
        if (tableDataElement.classList.contains("status-enabled")) tableDataElement.classList.remove("status-enabled");
        tableDataElement.classList.add("status-disabled");
    }

    let websites_status_temp = {};
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_status_temp = value["websites"];
            websites_status_temp[current_website]["enabled"] = websites_json[current_website]["enabled"];
            browser.storage.local.set({"websites": websites_status_temp}, function () {
                websites_json = websites_status_temp;
            });
        }
    });
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0
}

function getAllDates(startDate, stopDate) {
    let dateArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(stopDate)) {
        dateArray.push(getFormattedDate(new Date(currentDate)));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    if (!dateArray.includes(getToday())) dateArray.push(getFormattedDate(getToday()));
    return dateArray;
}

function checkCategory(current_website) {
    let valueToReturn = websites_json[current_website]["category"];
    if (valueToReturn === undefined) valueToReturn = getCategory(current_website);
    return valueToReturn;
}

function getCategory(website) {
    let valueToReturn = "other";
    for (item in categories) {
        if (categories[item].includes(website)) valueToReturn = item;
    }
    //console.log(website + " : " + valueToReturn);//TODO: use for testing websites filter
    return valueToReturn;
}

function generateCategories(selectedItem = "other", current_website, tableDataElementCategory) {
    let selectElement = document.createElement("select");
    selectElement.classList.add("select-category");
    for (item in categories) {
        let optionElement = document.createElement("option");
        if (item === selectedItem) optionElement.selected = true;
        optionElement.value = item;
        optionElement.textContent = browser.i18n.getMessage("category_" + item) || item;
        selectElement.append(optionElement);
    }
    selectElement.onchange = function () {
        saveCategory(current_website, selectElement.value);
        tableDataElementCategory.classList = [selectElement.value + "-category"];
    }
    tableDataElementCategory.classList = [selectedItem + "-category"];
    return selectElement;
}

function saveCategory(current_website, selected_item) {
    let websites_status_temp = {};
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_status_temp = value["websites"];
            websites_status_temp[current_website]["category"] = selected_item;
            browser.storage.local.set({"websites": websites_status_temp}, function () {
                websites_json = websites_status_temp;
            });
        }
    });
}

loaded();