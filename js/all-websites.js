let websites_json = {};
let websites_json_by_domain = [];
let smallest_date = "";
let all_dates = [];

let start_date = null;
let days_to_show = 7; //number of days to show
let categories = {};
let sorted_by = "";

function loaded() {
    document.getElementById("refresh-data-button").onclick = function () {
        //location.reload();
        loadDataFromBrowser(true);
    }
    document.getElementById("delete-all-data-button").onclick = function () {
        deleteAllData();
    }
    document.getElementById("import-data-button").onclick = function () {
        importData();
    }
    document.getElementById("export-data-button").onclick = function () {
        exportData();
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

    browser.runtime.sendMessage({from: "all-websites", ask: "categories"}, (response) => {
        if (response !== undefined) {
            categories = response.categories;
            loadDataFromBrowser(true);
        }
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
    document.getElementById("from-to-date-label").textContent = "Days: " + from + " – " + to;
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

function importData() {
    showBackgroundOpacity();
    document.getElementById("import-section").style.display = "block";
    let jsonImportElement = document.getElementById("json-import")
    jsonImportElement.value = "";
    jsonImportElement.focus();

    document.getElementById("cancel-import-data-button").onclick = function () {
        hideBackgroundOpacity();
        document.getElementById("import-section").style.display = "none";
    }
    document.getElementById("import-now-data-button").onclick = function () {
        let value = jsonImportElement.value;
        if (value.replaceAll(" ", "") !== "") {
            try {
                let websites_temp = value;
                if (value["websites"] !== undefined && value["limite"] !== undefined) websites_temp = value["websites"];
                websites_json = JSON.parse(websites_temp);
                document.getElementById("import-section").style.display = "none";
                browser.storage.local.set({"websites": websites_json}, function () {
                    loadDataFromBrowser(true);
                    hideBackgroundOpacity();
                });
            } catch (e) {
                console.error("Error: " + e.toString());
                let errorSubSection = document.createElement("div");
                errorSubSection.classList.add("sub-section", "background-light-red");
                errorSubSection.textContent = "Error: " + e.toString();

                let mainSection = document.getElementById("import-sub-sections");
                mainSection.insertBefore(errorSubSection, mainSection.childNodes[0]);
            }
        }
    }
}

function exportData() {
    showBackgroundOpacity();
    browser.storage.local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        }
        let limite_json = {
            "version": browser.runtime.getManifest().version,
            "author": browser.runtime.getManifest().author,
            "manifest_version": browser.runtime.getManifest().manifest_version
        };
        let export_json = {"limite": limite_json, "websites": websites_json};
        document.getElementById("export-section").style.display = "block";
        document.getElementById("json-export").value = JSON.stringify(export_json);

        document.getElementById("cancel-export-data-button").onclick = function () {
            hideBackgroundOpacity();
            document.getElementById("export-section").style.display = "none";
        }
        document.getElementById("copy-now-data-button").onclick = function () {
            document.getElementById("cancel-export-data-button").value = "Close";

            document.getElementById("json-export").value = JSON.stringify(websites_json);
            document.getElementById("json-export").select();
            document.execCommand("copy");
        }
        loadDataFromBrowser(true);
    });
}

function showBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "block";
}

function hideBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "none";
}

/**
 * Sort by column!
 * @param column it can be "website", "category", "status", "since-install", "date-N" (where N is 0, 1, 2, ...)
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
            if (document.getElementById("th-" + previousColumn).classList.contains("th-sort-by-column-sel")) document.getElementById("th-" + previousColumn).classList.remove("th-sort-by-column-sel");
            if (document.getElementById("th-" + previousColumn).classList.contains("sort-by-column-asc")) document.getElementById("th-" + previousColumn).classList.remove("sort-by-column-asc");
            if (document.getElementById("th-" + previousColumn).classList.contains("sort-by-column-desc")) document.getElementById("th-" + previousColumn).classList.remove("sort-by-column-desc");
        }

        if (!document.getElementById("th-" + column).classList.contains("th-sort-by-column-sel")) document.getElementById("th-" + column).classList.add("th-sort-by-column-sel");
        if (document.getElementById("th-" + column).classList.contains("sort-by-column-asc")) document.getElementById("th-" + column).classList.remove("sort-by-column-asc");
        if (document.getElementById("th-" + column).classList.contains("sort-by-column-desc")) document.getElementById("th-" + column).classList.remove("sort-by-column-desc");
        document.getElementById("th-" + column).classList.add("sort-by-column-" + ascOrDesc);
    }

    //console.log("col " + column + " | prev " + previousColumn + " | sorted_by " + sorted_by)

    websites = getWebsitesToUse(websites_json);
    if (sorted_by.includes("-asc")) {
        //sort as "asc"
        websites = websites.sort((a, b) => a[column] > b[column] ? 1 : -1);
    } else {
        //sort as "desc"
        websites = websites.sort((a, b) => a[column] < b[column] ? 1 : -1);
    }

    if (generate_ui) {
        browser.storage.local.get("websites").then(response => {
            websites_json = {};
            if (response["websites"] !== undefined) {
                websites_json = response["websites"];
            }
            document.getElementById("table-all-websites").removeChild(document.getElementById("tbody-table-all-websites"));
            let tableTBodyElement = getTBodyTable(websites, getLastSevenDays());
            document.getElementById("table-all-websites").append(tableTBodyElement);
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
        new_website["status"] = websites_json[current_website]["enabled"];
        new_website["category"] = websites_json[current_website]["category"];

        //since install
        let number_of_days = all_dates.length;

        let sum_since_install = 0;
        for (let date in websites_json[current_website]) {
            if (date !== "always" && date !== "enabled" && date !== "category") {
                sum_since_install += websites_json[current_website][date];
            }
        }
        new_website["since-install"] = sum_since_install;


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
        websites_to_use = sortByColumn("website", websites_to_use, false, false);
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

    let tableHeaderElement = document.createElement("th");
    tableHeaderElement.textContent = "Website";
    tableHeaderElement.id = "th-website";
    tableHeaderElement.classList.add("th-sort-by-column");
    if (sorted_by === "" || sorted_by === "website-asc") tableHeaderElement.classList.add("th-sort-by-column-sel", "sort-by-column-asc");
    tableHeaderElement.onclick = function () {
        websites = sortByColumn("website", websites);
    }
    tableRowElement.append(tableHeaderElement);

    tableHeaderElement = document.createElement("th");
    tableHeaderElement.textContent = "Status";
    tableHeaderElement.id = "th-status";
    tableHeaderElement.classList.add("th-sort-by-column");
    tableHeaderElement.onclick = function () {
        websites = sortByColumn("status", websites);
    }
    tableRowElement.append(tableHeaderElement);

    tableHeaderElement = document.createElement("th");
    tableHeaderElement.textContent = "Category";
    tableHeaderElement.id = "th-category";
    tableHeaderElement.classList.add("th-sort-by-column");
    tableHeaderElement.onclick = function () {
        websites = sortByColumn("category", websites);
    }
    tableRowElement.append(tableHeaderElement);

    tableHeaderElement = document.createElement("th");
    tableHeaderElement.textContent = "Since install";
    tableHeaderElement.id = "th-since-install";
    tableHeaderElement.classList.add("th-sort-by-column");
    tableHeaderElement.onclick = function () {
        websites = sortByColumn("since-install", websites);
    }
    tableRowElement.append(tableHeaderElement);
    for (let date in last_seven_days) {

        let date_to_show = last_seven_days[date];
        tableHeaderElement = document.createElement("th");
        tableHeaderElement.textContent = date_to_show;
        tableHeaderElement.id = "th-date-" + date;
        tableHeaderElement.classList.add("th-sort-by-column");
        tableHeaderElement.onclick = function () {
            websites = sortByColumn("date-" + date, websites);
        }
        tableRowElement.append(tableHeaderElement);
    }
    setDateInterval(last_seven_days[0], last_seven_days[last_seven_days.length - 1]);

    tableTHeadElement.append(tableRowElement);
    return tableTHeadElement;
}

function getTBodyTable(websites, last_seven_days) {
    let tableTBodyElement = document.createElement("tbody");
    tableTBodyElement.id = "tbody-table-all-websites";
    for (let website in websites) {
        let tableRowElement = document.createElement("tr");

        //console.log(websites[website]);

        let currentWebsiteElement = document.createElement("h2");
        currentWebsiteElement.textContent = "https://" + websites[website]["website"];
        currentWebsiteElement.classList.add("link", "go-to-external");
        currentWebsiteElement.onclick = function () {
            browser.tabs.create({url: "https://" + websites[website]["website"]});
        }
        currentWebsiteElement.title = currentWebsiteElement.textContent;

        let buttonDelete = document.createElement("input");
        buttonDelete.type = "button";
        buttonDelete.alt = "Delete";
        buttonDelete.classList.add("button", "button-delete", "very-small-button", "float-left", "margin-left-minus-20-px", "margin-top-5-px", "text-align-center");
        buttonDelete.id = "button-delete-single";
        buttonDelete.onclick = function () {
            deleteAWebsite(websites[website]["website"]);
        }


        let tableDataElement = document.createElement("td");
        tableDataElement.classList.add("padding-left-30-px");
        tableDataElement.append(buttonDelete, currentWebsiteElement);
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
        let tableDataElementCategory = document.createElement("td");
        tableDataElementCategory.append(generateCategories(checkCategory(websites[website]["website"]), websites[website]["website"], tableDataElementCategory));
        tableRowElement.append(tableDataElementCategory);


        //since install
        let number_of_days = all_dates.length;

        let sum_since_install = websites[website]["since-install"]
        let since_install = getTimeConverted(sum_since_install);
        tableDataElement = document.createElement("td");
        tableDataElement.textContent = since_install;
        tableDataElement.classList.add("since-install-time");
        if (sum_since_install >= (60 * 30) * number_of_days && sum_since_install < (60 * 60) * number_of_days) {
            tableDataElement.classList.add("yellow");
        } else if (sum_since_install >= (60 * 60) * number_of_days && sum_since_install < (60 * 60 * 3) * number_of_days) {
            tableDataElement.classList.add("orange");
        } else if (sum_since_install >= (60 * 60 * 3) * number_of_days) {
            tableDataElement.classList.add("red");
        }
        tableRowElement.append(tableDataElement);


        //days
        for (let date in last_seven_days) {
            let date_to_show = last_seven_days[date];
            let time_to_show = getTimeConverted(websites[website]["date-" + date]);
            let time = websites[website]["date-" + date];
            if (time_to_show === "") time_to_show = getTimeConverted(0);
            tableDataElement = document.createElement("td");
            tableDataElement.textContent = time_to_show;
            if (time >= 60 * 30 && time < 60 * 60) {
                tableDataElement.classList.add("yellow");
            } else if (time >= 60 * 60 && time < 60 * 60 * 3) {
                tableDataElement.classList.add("orange");
            } else if (time >= 60 * 60 * 3) {
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

    let tableTBodyElement = getTBodyTable(websites, getLastSevenDays());
    tableElement.append(tableTBodyElement);

    section.append(tableElement);
    document.getElementById("all-websites-sections").append(section);
    if (apply_filter) {
        applyFilter();
    }
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
        optionElement.textContent = item;
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