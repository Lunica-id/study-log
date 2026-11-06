const express = require("express");
const router = express.Router();

const folderRepository = require("../repositories/folderRepository");

const {
    folderPostSchema,
    folderPatchSchema
} = require("../validators/folderSchemas");

router.get("/",(req,res) => {
    const folders = folderRepository.getAllFolders();
    res.json(folders);
})

router.get("/root",(req,res) => {
    const folders = folderRepository.getRootFolders();
    res.json(folders);
})

router.get("/:id",(req,res) => {
    const folderId = Number(req.params.id);
    const folder = folderRepository.getFolderById(folderId);

    if(!folder) {
        return res.status(404).json({
            error:"Folder not found"
        });
    }
    res.json(folder);
})

router.get("/:id/children",(req,res) => {
    const folderId = Number(req.params.id);
    const folders = folderRepository.getChildFolders(folderId);
    res.json(folders);
})

router.post("/",(req,res) => {
    const result = folderPostSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    try {
        const newFolderId = folderRepository.createFolder(result.data)

        res.status(201).json({
            message: "Folder created",
            id: newFolderId
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "failed to create folder"
        });
    }
})

router.patch("/:id", (req,res) => {
    const folderId = Number(req.params.id);

    const result = folderPatchSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    try {
        const dbResult = folderRepository.updateFolder(folderId, result.data);

        if(dbResult == null) {
            return res.status(400).json({
                error: "No fields to update"
            });
        }
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
})

router.delete("/:id", (req,res) => {
    const folderId = Number(req.params.id);
    try {
        const result = folderRepository.deleteFolder(folderId);
        if (result.changes === 0) {
            return res.status(404).json({
                error: "Folder not found"
            });
        }
        res.json({
            message: "Folder deleted"
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to delete folder"
        });
    }
})

module.exports = router;