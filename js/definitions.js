function getTimeConverted(time, includeSeconds = false) {
    let timeToUse = time;
    let parts = [];

    const years = Math.floor(timeToUse / (60 * 60 * 24 * 365));
    timeToUse %= (60 * 60 * 24 * 365);

    const days = Math.floor(timeToUse / (60 * 60 * 24));
    timeToUse %= (60 * 60 * 24);

    const hours = Math.floor(timeToUse / (60 * 60));
    timeToUse %= (60 * 60);

    const minutes = Math.floor(timeToUse / 60);
    const seconds = timeToUse % 60;

    if (years > 0) parts.push(getYearOrYears(years * 60 * 60 * 24 * 365));
    if (days > 0) parts.push(getDayOrDays(days * 60 * 60 * 24));
    if (hours > 0) parts.push(getHourOrHours(hours * 60 * 60));
    if (minutes > 0) parts.push(getMinuteOrMinutes(minutes * 60));
    if (includeSeconds && seconds > 0) parts.push(getSecondOrSeconds(seconds));

    if (parts.length === 0) {
        return getSecondOrSeconds(0);
    }

    if (!includeSeconds) {
        // Approssimazione più corretta: se la parte successiva è >= metà dell'unità superiore, arrotondiamo per eccesso
        if (years > 0) {
            // Se giorni >= 182 (circa metà anno), arrotondiamo gli anni
            let yearsToDisplay = years;
            if (days >= 182) yearsToDisplay++;
            
            if (days > 0 && yearsToDisplay === years) {
                return getYearOrYears(years * 60 * 60 * 24 * 365) + " " + browser.i18n.getMessage("and") + " " + getDayOrDays(days * 60 * 60 * 24);
            }
            return getYearOrYears(yearsToDisplay * 60 * 60 * 24 * 365);
        }
        if (days > 0) {
            // Se ore >= 12, arrotondiamo i giorni
            let daysToDisplay = days;
            if (hours >= 12) daysToDisplay++;
            
            // Se arriviamo a 365 giorni, arrotondiamo a 1 anno
            if (daysToDisplay >= 365) return getYearOrYears(365 * 60 * 60 * 24);
            
            return getDayOrDays(daysToDisplay * 60 * 60 * 24);
        }
        if (hours > 0) {
            // Se minuti >= 30, arrotondiamo le ore
            let hoursToDisplay = hours;
            if (minutes >= 30) hoursToDisplay++;
            
            // Se arriviamo a 24 ore, arrotondiamo a 1 giorno
            if (hoursToDisplay >= 24) return getDayOrDays(24 * 60 * 60);
            
            return getHourOrHours(hoursToDisplay * 60 * 60);
        }
        if (minutes > 0) {
            // Se secondi >= 30, arrotondiamo i minuti
            let minutesToDisplay = minutes;
            if (seconds >= 30) minutesToDisplay++;
            
            // Se arriviamo a 60 minuti, arrotondiamo a 1 ora
            if (minutesToDisplay >= 60) return getHourOrHours(60 * 60);
            
            return getMinuteOrMinutes(minutesToDisplay * 60);
        }
        // Per i secondi
        if (seconds >= 30) return getMinuteOrMinutes(60);
        return parts[0];
    }

    // Tempo per esteso: uniamo tutte le parti con virgole e "and" per l'ultima parte
    if (parts.length === 1) return parts[0];
    const lastPart = parts.pop();
    return parts.join(", ") + " " + browser.i18n.getMessage("and") + " " + lastPart;
}

function getSecondOrSeconds(timeToUse) {
    let seconds = timeToUse;
    if (seconds === 1) return seconds + " " + browser.i18n.getMessage("second");
    return seconds + " " + browser.i18n.getMessage("seconds");
}

function getMinuteOrMinutes(timeToUse) {
    let minutes = Math.floor(timeToUse / 60);
    if (minutes === 1) return minutes + " " + browser.i18n.getMessage("minute");
    return minutes + " " + browser.i18n.getMessage("minutes");
}

function getHourOrHours(timeToUse) {
    let hours = Math.floor(timeToUse / 3600);
    if (hours === 1) return hours + " " + browser.i18n.getMessage("hour");
    return hours + " " + browser.i18n.getMessage("hours");
}

function getDayOrDays(timeToUse) {
    let days = Math.floor(timeToUse / (3600 * 24));
    if (days === 1) return days + " " + browser.i18n.getMessage("day");
    return days + " " + browser.i18n.getMessage("days");
}

function getYearOrYears(timeToUse) {
    let years = Math.floor(timeToUse / (3600 * 24 * 365));
    if (years === 1) return years + " " + browser.i18n.getMessage("year");
    return years + " " + browser.i18n.getMessage("years");
}

function getToday() {
    let todayDate = new Date();
    return getFormattedDate(todayDate);
}

function getFormattedDate(date) {
    let dateToUse = new Date(date);
    let dateToReturn = "";
    dateToReturn = dateToUse.getFullYear() + "-";
    let month = dateToUse.getMonth() + 1;
    if (month < 10) dateToReturn = dateToReturn + "0" + month + "-";
    else dateToReturn = dateToReturn + "" + month + "-";
    let day = dateToUse.getDate();
    if (day < 10) dateToReturn = dateToReturn + "0" + day;
    else dateToReturn = dateToReturn + "" + day;

    return dateToReturn;
}

function localizeUI() {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
        const messageKey = el.getAttribute("data-i18n");
        const message = browser.i18n.getMessage(messageKey);
        if (message) {
            if (el.tagName === "INPUT" && (el.type === "button" || el.type === "submit")) {
                el.value = message;
            } else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                el.placeholder = message;
            } else {
                el.textContent = message;
            }
        }
    });
}