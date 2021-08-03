let websites_json = {};
let websites_json_by_domain = [];
let smallest_date = "";
let all_dates = [];

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

    loadDataFromBrowser(true);

    document.getElementById("all-websites-dedication-section").onscroll = function () {
        if (document.getElementById("all-websites-dedication-section").scrollTop > 30) {
            document.getElementById("actions").classList.add("section-selected");
        } else {
            if (document.getElementById("actions").classList.contains("section-selected")) {
                document.getElementById("actions").classList.remove("section-selected");
            }
        }
    }
}

function loadDataFromBrowser(generate_section = true) {
    browser.storage.local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] != undefined) {
            websites_json = value["websites"];
        }
        if (generate_section) {
            document.getElementById("all-websites-sections").textContent = "";
            websites_json_by_domain = [];
            loadAllWebsites();
        }
        //console.log(JSON.stringify(websites_json));
    });
}

function deleteAllData() {
    let confirmation = confirm("Are you sure you want to clear all data?\nYou can cancel this process once started.");
    if (confirmation) {
        let clearStorage = browser.storage.local.clear();
        clearStorage.then(onCleared, onError);
    }
}

function deleteAWebsite(url) {
    let confirmation = confirm("Are you sure you want to clear the selected website (https://" + url + ") and the time spent on it?\nYou can cancel this process once started.");
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
        if (value.replaceAll(" ", "") != "") {
            try {
                websites_json = JSON.parse(value);
                document.getElementById("import-section").style.display = "none";
                browser.storage.local.set({"websites": websites_json}, function () {
                    loadDataFromBrowser(true);
                    hideBackgroundOpacity()
                });
            } catch (e) {
                //console.log("Error: " + e.toString());
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
        if (value["websites"] != undefined) {
            websites_json = value["websites"];
        }
        document.getElementById("export-section").style.display = "block";
        document.getElementById("json-export").value = JSON.stringify(websites_json);

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

function loadAllWebsites() {
    if (!isEmpty(websites_json)) {
        //there are websites saved

        for (let url in websites_json) {
            websites_json_by_domain.push(url);
        }
        //console.log(JSON.stringify(websites_json_by_domain));

        websites_json_by_domain.sort();

        smallest_date = getToday();

        for (let index in websites_json_by_domain) {
            for (let date in websites_json[websites_json_by_domain[index]]) {
                if (date != "enabled") {
                    if (date < smallest_date) {
                        smallest_date = date;
                    }
                }
            }
        }

        all_dates = getAllDates(smallest_date, getToday());
        all_dates.reverse();

        let section = document.createElement("div");
        section.classList.add("section", "overflow-auto", "no-padding");
        section.id = "table-section";

        let tableElement = document.createElement("table");

        let tableTHeadElement = document.createElement("thead");
        let tableRowElement = document.createElement("tr");

        let tableHeaderElement = document.createElement("th");
        tableHeaderElement.textContent = "Website";
        tableRowElement.append(tableHeaderElement);

        tableHeaderElement = document.createElement("th");
        tableHeaderElement.textContent = "Status";
        tableRowElement.append(tableHeaderElement);

        tableHeaderElement = document.createElement("th");
        tableHeaderElement.textContent = "Since install";
        tableRowElement.append(tableHeaderElement);

        for (let date in all_dates) {
            let date_to_show = all_dates[date];
            tableHeaderElement = document.createElement("th");
            tableHeaderElement.textContent = date_to_show;
            tableRowElement.append(tableHeaderElement);
        }

        tableTHeadElement.append(tableRowElement);
        tableElement.append(tableTHeadElement);

        let tableTBodyElement = document.createElement("tbody");
        for (let index in websites_json_by_domain) {
            tableRowElement = document.createElement("tr");

            let current_website = websites_json_by_domain[index];

            let currentWebsiteElement = document.createElement("h2");
            currentWebsiteElement.textContent = "https://" + current_website;
            currentWebsiteElement.classList.add("link", "go-to-external");
            currentWebsiteElement.onclick = function () {
                browser.tabs.create({url: "https://" + current_website});
            }

            let buttonDelete = document.createElement("input");
            buttonDelete.type = "button";
            buttonDelete.value = "Delete";
            buttonDelete.classList.add("button", "button-delete", "very-small-button", "float-left", "margin-left-minus-50-px", "margin-top-5-px", "text-align-center");
            buttonDelete.onclick = function () {
                deleteAWebsite(current_website);
            }

            let tableDataElement = document.createElement("td");
            tableDataElement.classList.add("padding-left-55-px");
            tableDataElement.append(buttonDelete, currentWebsiteElement);
            tableRowElement.append(tableDataElement);

            let status_to_show = true;
            if (websites_json[current_website]["enabled"] != undefined) {
                status_to_show = websites_json[current_website]["enabled"];
            }
            tableDataElement = document.createElement("td");
            if (status_to_show) {
                tableDataElement.textContent = "enabled";
                tableDataElement.classList.add("status-enabled");
            } else {
                tableDataElement.textContent = "disabled";
                tableDataElement.classList.add("status-disabled");
            }
            tableRowElement.append(tableDataElement);

            let sum_since_install = 0;
            for (let date in all_dates) {
                let date_to_show = all_dates[date];
                if (websites_json[current_website][date_to_show] != undefined) {
                    sum_since_install += parseInt(websites_json[current_website][date_to_show].toString());
                }
            }
            let since_install = getTimeConverted(sum_since_install);
            tableDataElement = document.createElement("td");
            tableDataElement.textContent = since_install;
            tableDataElement.classList.add("since-install-time");
            if (sum_since_install >= 60 * 30 && sum_since_install < 60 * 60) {
                tableDataElement.classList.add("yellow");
            } else if (sum_since_install >= 60 * 60 && sum_since_install < 60 * 60 * 3) {
                tableDataElement.classList.add("orange");
            } else if (sum_since_install >= 60 * 60 * 3) {
                tableDataElement.classList.add("red");
            }
            tableRowElement.append(tableDataElement);

            for (let date in all_dates) {
                let date_to_show = all_dates[date];
                let time_to_show = getTimeConverted(0);
                let time = 0;
                if (websites_json[current_website][date_to_show] != undefined) {
                    time = websites_json[current_website][date_to_show];
                    time_to_show = getTimeConverted(time);
                }
                if (time_to_show == "") time_to_show = getTimeConverted(0);
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
        tableElement.append(tableTBodyElement);

        section.append(tableElement);
        document.getElementById("all-websites-sections").append(section);

    } else {
        //no websites
        let section = document.createElement("div");
        section.classList.add("section-empty");
        section.textContent = "No websites found";

        document.getElementById("all-websites-sections").append(section);
    }
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
    return dateArray;
}

loaded();