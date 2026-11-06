function initDatabase(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY,
            parent_id INTEGER,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            overall_memo TEXT,

            FOREIGN KEY(parent_id)
                REFERENCES folders(id)
                ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            folder_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            source TEXT,
            isbn TEXT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            memo TEXT,

            FOREIGN KEY (folder_id)
                REFERENCES folders(id)
                ON DELETE CASCADE
        );
    `)
}

module.exports = initDatabase;