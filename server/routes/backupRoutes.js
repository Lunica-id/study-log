const express = require("express");
const router = express.Router();

const backupRepository = require("../repositories/backupRepository");
const { backupSchema } = require("../validators/backupSchemas");

router.get("/", (req,res) => {
    const backupData = backupRepository.getBackupData();
    res.json({
        version: 1,
        exportedAt: new Date().toISOString(),
        ...backupData
    });
})

router.post("/", (req,res) => {
    const result = backupSchema.safeParse(req.body);
    if(!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    const {folders,items} = result.data;
    const folderIds = new Set(folders.map(folder => folder.id));

    if (folderIds.size !== folders.length) {
        return res.status(400).json({
            error: "Duplicate folder IDs"
        });
    }

    const itemIds = new Set(items.map(item => item.id));

    if(itemIds.size !== items.length) {
        return res.status(400).json({
            error: "Duplicate item IDs"
        });
    }

    for (const folder of folders) {
        if (folder.parent_id !== null && !folderIds.has(folder.parent_id)) {
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
        backupRepository.importBackup(result.data);

        return res.json({
            message: "Backup imported successfully"
        });
    } catch (err) {
        console.error("Import failed:", err);

        return res.status(500).json({
            error: "Failed to import backup"
        });
    }
})

module.exports = router;