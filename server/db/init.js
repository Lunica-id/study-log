function initDatabase(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            role TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('admin', 'user')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            parent_id INTEGER,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            overall_memo TEXT,

            FOREIGN KEY(user_id)
                REFERENCES users(id)
                ON DELETE CASCADE

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