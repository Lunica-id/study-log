const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
    path.join(__dirname, "..", "study-log.db")
);

db.pragma("foreign_keys = ON");

module.exports = db;