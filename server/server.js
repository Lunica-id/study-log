const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
const {z} = require('zod');

const app = express();
const PORT = 3003;

const db = new Database(
    path.join(__dirname, "study-log.db")
);

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const folderPostSchema = z.object({
    parentId: z.number().nullable(),
    name: z.string().trim().min(1),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message: "Invalid date"
    }),
    overallMemo: z.string().nullable().optional()
});
const folderPatchSchema = z.object({
    name: z.string().trim().min(1).optional(),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message: "Invalid date"
    }).optional(),
    overallMemo: z.string().nullable().optional()
});
const itemPostSchema = z.object({
    folderId: z.number(),
    type: z.enum(["link","youtube","book","document"]),
    source: z.string().nullable().optional(),
    isbn: z.string().nullable().optional(),
    title: z.string().trim().min(1),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message:"Invalid date"
    }),
    memo: z.string().nullable().optional()
});
const itemPatchSchema = z.object({
    type: z.enum(["link", "youtube", "book", "document"]),
    source: z.string().nullable().optional(),
    isbn: z.string().nullable().optional(),
    title: z.string().trim().min(1),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message: "Invalid date"
    }),
    memo: z.string().nullable().optional()
});
const backupSchema = z.object({
    version: z.literal(1),
    exportedAt: z.string(),
    folders: z.array(
        z.object({
            id: z.number().int().positive(),
            parent_id: z.number().int().positive().nullable(),
            name: z.string().min(1),
            date: z.string().regex(datePattern),
            overall_memo: z.string().nullable()
        })
    ),
    items: z.array(
        z.object({
            id: z.number().int().positive(),
            folder_id: z.number().int().positive(),
            type: z.enum(["link", "youtube", "book", "document"]),
            source: z.string().nullable(),
            isbn: z.string().nullable(),
            title: z.string().min(1),
            date: z.string().regex(datePattern),
            memo: z.string().nullable()
        })
    )
});


db.pragma("foreign_keys = ON"); //sqlite3パッケージの場合コードが異なる

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

const frontendPath = path.join(__dirname, "..", "app");

app.use(express.static(frontendPath));
app.use(cors());
app.use(express.json());

app.get("/api/folders", (req, res) => {
    const folders = db
        .prepare(`SELECT * FROM folders`)
        .all();

    res.json(folders);
});

app.get("/api/folders/root", (req, res) => {
    const folders = db
        .prepare(`SELECT * FROM folders WHERE parent_id IS NULL`)
        .all();

    res.json(folders);
})

app.get("/api/folders/:id", (req, res) => {
    const folderId = Number(req.params.id);

    const folder = db
        .prepare(`
            SELECT * FROM folders
            WHERE id = ?
        `).get(folderId);
    
    if (!folder) {
        return res.status(404).json({
            error: "Folder not found"
        });
    }

    res.json(folder);
})

app.get("/api/folders/:id/children", (req, res) => {
    const folderId = Number(req.params.id);

    const folders = db
        .prepare(`
            SELECT * FROM folders
            WHERE parent_id = ?
        `).all(folderId);

    res.json(folders);
})

app.get("/api/items/:id", (req, res) => {
    const itemId = Number(req.params.id);

    const item = db
        .prepare(`
            SELECT * FROM items
            WHERE id = ?
        `).get(itemId);

    res.json(item);
})

app.get("/api/items/:id/children", (req, res) => {
    const folderId = Number(req.params.id);

    const items = db
        .prepare(`
            SELECT * FROM items
            WHERE folder_id = ?
        `).all(folderId);

    res.json(items);
})

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

app.post("/api/folders", (req, res) => {
    const result = folderPostSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    const {parentId, name, date, overallMemo} = result.data;
    console.log("result");
    console.log(result);

    try {
        const dbResult = db.prepare (`
            INSERT INTO folders (parent_id, name, date, overall_memo)
            VALUES(?,?,?,?)
        `).run(parentId,name,date,overallMemo);

        res.status(201).json({
            message: "Folder created",
            id: Number(dbResult.lastInsertRowid)
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "failed to create folder"
        });
    }
});

app.post("/api/items", (req, res) => {
    const result = itemPostSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    const {
        folderId,
        type,
        source,
        isbn,
        title,
        date,
        memo
    } = result.data;

    try {
        const dbResult = db.prepare(`
            INSERT INTO items (
                folder_id,
                type,
                source,
                isbn,
                title,
                date,
                memo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            folderId,
            type,
            source ?? null,
            isbn ?? null,
            title,
            date,
            memo ?? null
        );

        res.status(201).json({
            message: "Item created",
            id: Number(dbResult.lastInsertRowid)
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to create item"
        });
    }
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

app.patch("/api/folders/:id", (req, res) => {
    const folderId = Number(req.params.id);

    const result = folderPatchSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    const { name, date, overallMemo } = result.data;

    const updates = [];
    const values = [];

    if (name !== undefined) {
        updates.push("name = ?");
        values.push(name);
    }

    if (date !== undefined) {
        updates.push("date = ?");
        values.push(date);
    }

    if (overallMemo !== undefined) {
        updates.push("overall_memo = ?");
        values.push(overallMemo);
    }

    if (updates.length === 0) {
        return res.status(400).json({
            error: "No fields to update"
        });
    }

    try {
        const dbResult = db.prepare(`
            UPDATE folders
            SET ${updates.join(", ")}
            WHERE id = ?
        `).run(...values, folderId);

        if (dbResult.changes === 0) {
            return res.status(404).json({
                error: "Folder not found"
            });
        }

        res.json({
            message: "Folder updated"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to update folder"
        });
    }
});

app.patch("/api/items/:id", (req, res) => {
    const itemId = Number(req.params.id);

    const result = itemPatchSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    const {
        type,
        source,
        isbn,
        title,
        date,
        memo
    } = result.data;

    try {
        const dbResult = db.prepare(`
            UPDATE items
            SET
                type = ?,
                source = ?,
                isbn = ?,
                title = ?,
                date = ?,
                memo = ?
            WHERE id = ?
        `).run(
            type,
            source ?? null,
            isbn ?? null,
            title,
            date,
            memo ?? null,
            itemId
        );

        if (dbResult.changes === 0) {
            return res.status(404).json({
                error: "Item not found"
            });
        }

        res.json({
            message: "Item updated"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to update item"
        });
    }
});

app.delete("/api/folders/:id", (req, res) => {
    const folderId = Number(req.params.id);

    try {
        const result = db.prepare(`
            DELETE FROM folders
            WHERE id = ?
        `).run(folderId);

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Folder not found"
            });
        }

        res.json({
            message: "Folder deleted"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to delete folder"
        });
    }
});

app.delete("/api/items/:id", (req, res) => {
    const itemId = Number(req.params.id);

    try {
        const result = db.prepare(`
            DELETE FROM items
            WHERE id = ?
        `).run(itemId);

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Item not found"
            });
        }

        res.json({
            message: "Item deleted"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to delete item"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

function isValidDate(dateString) {
    if (!datePattern.test(dateString)) {
        return false;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month-1, day);

    return (date.getFullYear() === year && date.getMonth() === month-1 && date.getDate() === day);
}