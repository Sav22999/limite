function getTimeConverted(time) {
    let timeToUse = time;
    let timeToReturn = "";
    if (timeToUse >= 60) {
        //check minutes
        if (timeToUse / 60 >= 60) {
            //check hours
            if (timeToUse / (60 * 60) >= 24) {
                //check days
                if (timeToUse / (60 * 60 * 24) >= 365) {
                    //check year(s)
                    if (getDayOrDays((timeToUse % (60 * 60 * 24 * 365))) != "") {
                        timeToReturn = getYearOrYears(timeToUse) + " and " + getDayOrDays((timeToUse % (60 * 60 * 24 * 365)));
                    } else {
                        timeToReturn = getYearOrYears(timeToUse);
                    }
                } else {
                    //check day(s)
                    timeToReturn = getDayOrDays(timeToUse);
                }
            } else {
                //hours
                timeToReturn = getHourOrHours(timeToUse);
            }
        } else {
            //minutes
            timeToReturn = getMinuteOrMinutes(timeToUse);
        }
    } else {
        //seconds
        timeToReturn = getSecondOrSeconds(timeToUse);
    }
    return timeToReturn;
}

function getSecondOrSeconds(timeToUse) {
    let timeToReturn = "";
    if (timeToUse === 1) timeToReturn = timeToUse + " second";
    else if (timeToUse === 0 || timeToUse > 1) timeToReturn = timeToUse + " seconds";
    return timeToReturn;
}

function getMinuteOrMinutes(timeToUse) {
    let timeToReturn = "";
    if (timeToUse >= 60 && timeToUse < 60 * 2) timeToReturn = ((timeToUse - (timeToUse % 60)) / 60) + " minute";
    else if (timeToUse >= 60 * 2) timeToReturn = ((timeToUse - (timeToUse % 60)) / 60) + " minutes";
    return timeToReturn;
}

function getHourOrHours(timeToUse) {
    let timeToReturn = "";
    if (timeToUse / (60) >= 60 && timeToUse / (60) < 60 * 2) timeToReturn = ((timeToUse - (timeToUse % (60 * 60))) / (60 * 60)) + " hour";
    else if (timeToUse / (60) >= 60 * 2) timeToReturn = ((timeToUse - (timeToUse % (60 * 60))) / (60 * 60)) + " hours";
    return timeToReturn;
}

function getDayOrDays(timeToUse) {
    let timeToReturn = "";
    if (timeToUse / (60 * 60) >= 24 && timeToUse / (60 * 60) < 24 * 2) timeToReturn = ((timeToUse - (timeToUse % (60 * 60 * 24))) / (60 * 60 * 24)) + " day";
    else if (timeToUse / (60 * 60) >= 24 * 2) timeToReturn = ((timeToUse - (timeToUse % (60 * 60 * 24))) / (60 * 60 * 24)) + " days";
    return timeToReturn;
}

function getYearOrYears(timeToUse) {
    let timeToReturn = "";
    if (timeToUse / (60 * 60 * 24) >= 365 && timeToUse / (60 * 60 * 24) < 365 * 2) timeToReturn = ((timeToUse - (timeToUse % (60 * 60 * 24 * 365))) / (60 * 60 * 24 * 365)) + " year";
    else timeToReturn = ((timeToUse - (timeToUse % (60 * 60 * 24 * 365))) / (60 * 60 * 24 * 365)) + " years";
    return timeToReturn;
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