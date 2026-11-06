const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./db/database");
const initDatabase = require("./db/init");
const folderRoutes = require("./routes/folderRoutes");
const itemRoutes = require("./routes/itemRoutes");
const { folderPostSchema, folderPatchSchema } = require("./validators/folderSchemas");
const { itemPostSchema, itemPatchSchema } = require("./validators/itemSchemas");
const { backupSchema } = require("./validators/backupSchemas");

const app = express();
const PORT = 3003;

const frontendPath = path.join(__dirname, "..", "app");

initDatabase(db);

app.use(express.static(frontendPath));
app.use(cors());
app.use(express.json());

app.use("/api/folders", folderRoutes);
app.use("/api/items", itemRoutes);

app.get("/api/backup", (req, res) => {
    const folders = db
        .prepare(`SELECT * FROM folders`)
        .all();
    const items = db
        .prepare(`SELECT * FROM items`)
        .all();

    res.json({
        version:1,
        exportedAt: new Date().toISOString(),
        folders,
        items
    });
});

app.post("/api/backup", (req, res) => {
    const result = backupSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid backup data",
            details: result.error.issues
        });
    }

    const { folders, items } = result.data;
    const folderIds = new Set(folders.map(folder => folder.id));

    if (folderIds.size !== folders.length) {
        return res.status(400).json({
            error: "Duplicate folder IDs"
        });
    }

    const itemIds = new Set(items.map(item => item.id));

    if (itemIds.size !== items.length) {
        return res.status(400).json({
            error: "Duplicate item IDs"
        });
    }

    for (const folder of folders) {
        if (
            folder.parent_id !== null &&
            !folderIds.has(folder.parent_id)
        ) {
            return res.status(400).json({
                error: "Parent folder not found"
            });
        }

        if (folder.parent_id === folder.id) {
            return res.status(400).json({
                error: "A folder cannot be its own parent"
            });
        }
    }

    for (const item of items) {
        if (!folderIds.has(item.folder_id)) {
            return res.status(400).json({
                error: "Item folder not found"
            });
        }
    }

    try {
        const importBackup = db.transaction(() => {
            db.prepare("DELETE FROM items").run();
            db.prepare("DELETE FROM folders").run();

            const pending = [...folders];
            const insertFolder = db.prepare(`
                INSERT INTO folders
                    (id, parent_id, name, date, overall_memo)
                VALUES (?, ?, ?, ?, ?)
            `);

            const insertedIds = new Set();

            while (pending.length > 0) {
                let insertedThisRound = 0;

                for (let i = pending.length - 1; i >= 0; i--) {
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
                        folder.overall_memo
                    );

                    insertedIds.add(folder.id);
                    pending.splice(i, 1);
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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const item of items) {
                insertItem.run(
                    item.id,
                    item.folder_id,
                    item.type,
                    item.source,
                    item.isbn,
                    item.title,
                    item.date,
                    item.memo
                );
            }
        });

        importBackup();

        return res.json({
            message: "Backup imported successfully"
        });

    } catch (err) {
        console.error("Import failed:", err);

        return res.status(500).json({
            error: "Failed to import backup"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
