const db = require("../db/database");

function getBackupData() {
    const folders = db
    .prepare(`SELECT * FROM folders`)
    .all();

    const items = db
    .prepare(`SELECT * FROM items`)
    .all();

    return {folders, items};
}

function importBackup(backupData) {
    const importTransaction = db.transaction(() => {
        db.prepare("DELETE FROM items").run();
        db.prepare("DELETE FROM folders").run();

        const pending = [...backupData.folders];
        const insertFolder = db.prepare(`
            INSERT INTO folders (id, parent_id, name, date, overall_memo)
            VALUES (?, ?, ?, ?, ?)
        `);

        const insertedIds = new Set();

        while (pending.length > 0) {
            let insertedThisRound = 0;

            for (let i = pending.length -1; i >= 0; i--) {
                const folder = pending[i];

                const parentReady = 
                    folder.parent_id === null ||
                    insertedIds.has(folder.parent_id);
                
                if (!parentReady) continue;

                insertFolder.run(
                    folder.id,
                    folder.parent_id,
                    folder.name,
                    folder.date,
                    folder.overall_memo ?? null
                );

                insertedIds.add(folder.id);
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
                (id, folder_id, type, source, isbn, title, date, memo)
            VALUES(?,?,?,?,?,?,?,?)
        `);

        for (const item of backupData.items) {
            insertItem.run(
                item.id,
                item.folder_id,
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