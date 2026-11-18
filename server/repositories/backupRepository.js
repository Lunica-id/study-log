const db = require("../db/database");

function getBackupData(userId) {
    const folders = db
    .prepare(`
        SELECT id, parent_id, name, date, overall_memo
        FROM folders
        WHERE user_id = ?
    `).all(userId);

    const items = db
    .prepare(`
        SELECT items.* 
        FROM items
        JOIN folders
            ON items.folder_id = folders.id
        WHERE folders.user_id = ?
    `).all(userId);

    return {folders, items};
}

function importBackup(backupData, userId) {
    const importTransaction = db.transaction(() => {
        db.prepare(`
            DELETE FROM folders
            WHERE user_id = ?
        `).run(userId);

        const pending = [...backupData.folders];
        const insertFolder = db.prepare(`
            INSERT INTO folders (user_id, parent_id, name, date, overall_memo)
            VALUES (?, ?, ?, ?, ?)
        `);

        const idMap = new Map();

        while (pending.length > 0) {
            let insertedThisRound = 0;

            for (let i = pending.length -1; i >= 0; i--) {
                const folder = pending[i];

                const parentReady = 
                    folder.parent_id === null ||
                    idMap.has(folder.parent_id);
                
                if (!parentReady) continue;

                const result = insertFolder.run(
                    userId,
                    folder.parent_id === null ? null : idMap.get(folder.parent_id),
                    folder.name,
                    folder.date,
                    folder.overall_memo ?? null
                );
                idMap.set(folder.id, Number(result.lastInsertRowid));

                pending.splice(i,1);
                insertedThisRound++;
            }
            if (insertedThisRound === 0) {
                throw new Error(
                    "Invalid folder hierarchy or circular reference"
                );
            }
        }

        const insertItem = db.prepare(`
            INSERT INTO items
                (folder_id, type, source, isbn, title, date, memo)
            VALUES(?,?,?,?,?,?,?)
        `);

        for (const item of backupData.items) {
            const newFolderId = idMap.get(item.folder_id);
            if (newFolderId === undefined) {
                throw new Error("Invalid folder reference");
            }
            insertItem.run(
                newFolderId,
                item.type,
                item.source ?? null,
                item.isbn ?? null,
                item.title,
                item.date,
                item.memo ?? null
            );
        }
    });

    importTransaction();
}

module.exports = {
    getBackupData,
    importBackup
};