const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateString) {
    if (!datePattern.test(dateString)) {
        return false;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month-1, day);

    return (date.getFullYear() === year && date.getMonth() === month-1 && date.getDate() === day);
}

function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function isValidYouTubeId(value) {
    return /^[a-zA-Z0-9_-]{11}$/.test(value);
}

function normaliseIsbn(value) {
    if (value === null || value === undefined) {
        return null;
    } else if (value === "") {
        return null;
    } else if (typeof(value) === "string") {
        return value.replace(/[-\s]/g, "").toUpperCase();
    }
    return value;
}

function isValidIsbn(value) {
    const normalisedValue = normaliseIsbn(value);
    const digitStr = normalisedValue.split('');
    if (digitStr.length == 10) {
        let sum = 0;
        for (let i=0;i<9;i++) {
            sum += Number(digitStr[i])*(10-i);
        }
        if (digitStr[9] === "X") {
            sum += 10;
        } else {
            sum += Number(digitStr[9]);
        }
        if (sum%11 === 0) {
            return true;
        }
        return false;
    } else if (digitStr.length == 13) {
        const digits = digitStr.map(Number);
        let sum = 0;
        for (let i=0;i<12;i+=2) {
            sum = sum + digits[i] + digits[i+1]*3;
        }
        if (sum%10 === (10-digits[12])%10) {
            return true;
        }
        return false;
    } else {
        return false;
    }
}

module.exports = {
    datePattern, 
    isValidDate,
    isValidHttpUrl,
    isValidYouTubeId,
    normaliseIsbn,
    isValidIsbn
};