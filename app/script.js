document.addEventListener("DOMContentLoaded", () => {
    const genreListSection = document.getElementById("genre-list");
    const homeEllipsis = document.getElementById("home-ellipsis");
    const rootGenreWrapper = genreListSection.querySelector("#genre-list .wrapper");
    const addGridBtn = document.getElementById("add-grid");
    const addItemBtn = document.getElementById("add-item");
    const detailSection = document.getElementById("genre-detail");
    const genreTitle = detailSection.querySelector(".genre-title");
    const detailEllipsis = document.getElementById("detail-ellipsis");
    const entryList = detailSection.querySelector(".entry-list");
    const overallMemo = document.querySelector(".overall-memo");
    const closeDetailBtn = document.getElementById("close-detail-btn");
    const subGenreWrapper = document.querySelector("#genre-detail .wrapper");
    const addSubGridBtn = document.getElementById("add-subgrid");
    const editGenreModal = document.getElementById("edit-genre-modal");
    const editGenreType = document.getElementById("edit-genre-type");
    const genreCancelBtn = document.getElementById("genre-cancel-btn");
    const genreSubmitBtn = document.getElementById("genre-submit-btn");
    const controlHomeModal = document.getElementById("control-home-modal");
    const importBtn = document.getElementById("import-btn");
    const exportBtn = document.getElementById("export-btn");
    const importFileModal = document.getElementById("import-file-modal");
    const importCancelBtn = document.getElementById("import-cancel-btn");
    const importSubmitBtn = document.getElementById("import-submit-btn");
    const editDetailModal = document.getElementById("edit-detail-modal");
    const editDetailType = document.getElementById("edit-detail-type");
    const typeSelect = document.getElementById("detail-type");
    const detailCancelBtn = document.getElementById("detail-cancel-btn");
    const detailSubmitBtn = document.getElementById("detail-submit-btn");
    const controlFolderModal = document.getElementById("control-folder-modal");
    const editFolderBtn = document.getElementById("edit-folder-btn");
    const deleteFolderBtn = document.getElementById("delete-folder-btn");
    const controlDetailModal = document.getElementById("control-detail-modal");
    const editDetailBtn = document.getElementById("edit-detail-btn");
    const deleteDetailBtn = document.getElementById("delete-detail-btn");

    let root = { id: null, name: "root", type: "folder", children: []};
    let folderStack = [];
    let currentFolderId = null;
    let editingFolderId = null;
    let editingItemId = null;

    let currentParentId = null;

    //loadStorage();
    loadRootFolders();
    document.addEventListener("click", (e) => { 
        if (!controlHomeModal.contains(e.target) && !controlHomeModal.classList.contains("hidden")) {
            controlHomeModal.classList.add("hidden");
        } else if (!controlFolderModal.contains(e.target) && !controlFolderModal.classList.contains("hidden")) {
            controlFolderModal.classList.add("hidden");
        }
    });
    homeEllipsis.addEventListener("click", (e) => {
        e.stopPropagation();
        controlHomeModal.classList.remove("hidden");
    })
    addGridBtn.addEventListener ("click", () => {
        editGenreModal.classList.remove("hidden");
    });
    addSubGridBtn.addEventListener ("click", () => {
        editGenreModal.classList.remove("hidden");
    });
    genreCancelBtn.addEventListener("click", () => {
        editGenreModal.classList.add("hidden");
    });
    genreSubmitBtn.addEventListener("click", handleParentSubmit);
    typeSelect.addEventListener("change", updateDetailForm);
    overallMemo.addEventListener("input", (e) => {
        const folder = findNodeById(root.children, currentFolderId);
        if (!folder) return;
        folder.overallMemo = e.target.value;
        saveStorage();
    });
    closeDetailBtn.addEventListener("click", goBack);
    addItemBtn.addEventListener("click", () => {
        editDetailType.innerText = "Create New Detail";
        detailSubmitBtn.innerText = "Create";
        editDetailModal.classList.remove("hidden");
        updateDetailForm();
    });
    detailEllipsis.addEventListener("click", (e) => {
        e.stopPropagation();
        openControlFolderModal()
    });
    editFolderBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditFolderModal();
    });
    deleteFolderBtn.addEventListener("click", deleteFolder);
    entryList.addEventListener("click", openControlDetailModal);
    detailCancelBtn.addEventListener("click", () => {
        editDetailModal.classList.add("hidden");
        document.getElementById("detail-type").value = "link";
        document.getElementById("detail-source").value = "";
        document.getElementById("detail-title").value = "";
        document.getElementById("detail-date").value = "";
        document.getElementById("detail-memo").value = "";
        editingItemId = null;
    });
    detailSubmitBtn.addEventListener("click", handleDetailSubmit);
    importBtn.addEventListener("click", () => {
        controlHomeModal.classList.add("hidden");
        importFileModal.classList.remove("hidden");
    });
    importCancelBtn.addEventListener("click", ()=> {
        importFileModal.classList.add("hidden");
    })
    importSubmitBtn.addEventListener("click", importData);
    exportBtn.addEventListener("click", exportData);
    editDetailBtn.addEventListener("click", openEditDetailModal);
    deleteDetailBtn.addEventListener("click", deleteDetail);

    function findNodeById(nodes, id) {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.type === "folder" && node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    async function renderOverall(folderId) {
        console.log("renderOverall:", folderId);
        const folders = await fetchChildrenFolders(folderId);

        if (folderId === null) {
            renderFolders(folders, rootGenreWrapper);
            genreListSection.classList.remove("hidden");
            detailSection.classList.add("hidden");
            return;
        }

        if (folderId !== null) {
            const currentFolder = await fetchFolder(folderId);
            genreTitle.innerText = currentFolder.name;
            overallMemo.value = currentFolder.overallMemo || "";
        }

        entryList.querySelectorAll(".entry-item:not(#add-item)").forEach(e => e.remove());

        renderFolders(folders, subGenreWrapper);

        const items = await fetchChildrenItems(folderId);
        renderItems(items);

        currentFolderId = folderId;
        console.log("currentFolderId:"+currentFolderId);
        genreListSection.classList.add("hidden");
        detailSection.classList.remove("hidden");
    }

    function renderFolders(folders, wrapper) {
        wrapper.querySelectorAll(".genre-grid:not(#add-grid, #add-subgrid)").forEach(e => e.remove());

        folders.forEach(folder => {
            //if (folder.type !== "folder") return;

            const div = document.createElement("div");
            div.className = "genre-grid sweep-hover";
            div.dataset.nodeId = folder.id;

            div.innerHTML = `
                <h3>${folder.name}<h3>
                <p>${folder.date}</p>
            `;

            div.addEventListener("click", () => {
                folderStack.push(currentFolderId);
                currentFolderId = folder.id;
                renderOverall(folder.id);
            });

            wrapper.appendChild(div);
        })
    }

    function renderItems(items) {
        items.forEach(item => {
            const li = document.createElement("li");
            li.className = "entry-item";
            li.dataset.detailId = item.id;

            if(item.type === "youtube") {
                li.innerHTML = `
                    <iframe 
                        class="entry-thumbnail" 
                        width="367" 
                        height="207" 
                        src="https://www.youtube.com/embed/${item.source}" 
                        title="YouTube video player" 
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                    ></iframe>
                    <div class="entry-info">
                        <a
                            href="https://www.youtube.com/watch?v=${item.source}"
                            target="_blank"
                            class="entry-title"
                        >${item.title}</a>
                    </div>
                    <p class="entry-date">${item.date}</p>
                    <p class="entry-memo">Memo</p>
                    <div class="entry-ellipsis"><i class="fa-solid fa-ellipsis-vertical"></i></div>
                `;
            } else if (item.type === "link") {
                li.innerHTML = `
                    <div class="favicon">
                        <img src="https://www.google.com/s2/favicons?domain=${item.source}">
                    </div>
                    <div class="entry-info">
                        <a 
                            href="${item.source}" 
                            target="_blank" 
                            class="entry-title"
                        >${item.title}</a>
                    </div>
                    <p class="entry-date">${item.date}</p>
                    <p class="entry-memo">Memo</p>
                    <div class="entry-ellipsis"><i class="fa-solid fa-ellipsis-vertical"></i></div>
                `;
            } else if (item.type === "book") {
                li.innerHTML = `
                    <div class="book-icon">
                        <i class="fa-solid fa-book"></i>
                    </div>
                    <div class="entry-info">
                        <p class="entry-title">${item.title}</p>
                    </div>
                    <p class="entry-date">${item.date}</p>
                    <p class="entry-memo">Memo</p>
                    <div class="entry-ellipsis"><i class="fa-solid fa-ellipsis-vertical"></i></div>
                `;
            }

            entryList.appendChild(li);
        })
    }

    async function handleParentSubmit(e) {
        e.preventDefault();

        console.log("handleParentSubmit start");
        console.log("currentFolderId:", currentFolderId);
        console.log("editingFolderId:", editingFolderId);

        const name = document.getElementById("genre-name").value.trim();
        const date = document.getElementById("date").value || getTodayString();

        if (!name) {
            alert("Please fill in genre name");
            return;
        }

        // let parentChildren;
        // if (currentFolderId === null) {
        //     parentChildren = root.children;
        // } else {
        //     const parent = findNodeById(root.children, currentFolderId);
        //     if (!parent) return;
        //     parentChildren = parent.children;
        // }
        // if (editingFolderId !== null) {
        //     const folder = findNodeById(root.children, editingFolderId);
        //     if (!folder || folder.type !== "folder") return;
        //     folder.name = name;
        //     folder.date = date;
        //     editingFolderId = null;
        // } else {
        //     parentChildren.push({
        //         id: Date.now(),
        //         type: "folder",
        //         name,
        //         date,
        //         overallMemo: "",
        //         children: []
        //     });
        // }
        // editGenreModal.classList.add("hidden");
        // saveStorage();

        const folder = {
                name: name,
                date: date,
                overallMemo: null
            };
        
        if (editingFolderId !== null) {
            await updateFolder(folder); 
        } else {
            await createNewFolder(folder);
        }
        
        editGenreModal.classList.add("hidden");
        document.getElementById("genre-name").value = "";
        document.getElementById("date").value = "";
        
        console.log("currentFolderId before render:", currentFolderId);

        await renderOverall(currentFolderId);

        console.log("after render:", currentFolderId);
    }

    function handleDetailSubmit(e) {
        e.preventDefault();
        const type = document.getElementById("detail-type").value;
        const source = document.getElementById("detail-source").value;
        const isbn = document.getElementById("detail-isbn").value || "-";
        const title = document.getElementById("detail-title").value;
        const date = document.getElementById("detail-date").value || getTodayString();
        const memo = document.getElementById("detail-memo").value;

        const parent = findNodeById(root.children, currentFolderId);
        if (!parent) return;

        if (editingItemId !== null) {
            const item = parent.children.find(c => c.id === editingItemId);
            if (!item) return;

            item.type = type;
            item.source = extractYouTubeId(source) ?? source;
            item.isbn = isbn;
            item.title = title;
            item.date = date;
            item.memo = memo;

            editingItemId = null;
        } else {
            parent.children.push({
                id: Date.now(),
                type: type,
                source: extractYouTubeId(source) ?? source,
                isbn,
                title,
                date,
                memo
            });
        }

        saveStorage();
        editDetailModal.classList.add("hidden");
        document.getElementById("detail-type").value = "link";
        document.getElementById("detail-source").value = "";
        document.getElementById("detail-title").value = "";
        document.getElementById("detail-date").value = "";
        document.getElementById("detail-memo").value = "";
        renderOverall(currentFolderId);
    }

    function updateDetailForm() {
        const selectedType = typeSelect.value;
        const typeBlocks = document.querySelectorAll("#detail-form [data-type]");

        typeBlocks.forEach(block => {
            const types = block.dataset.type.split(" ");
            block.classList.toggle("hidden", !types.includes(selectedType));
        });
    }

    function goBack() {
        currentFolderId = folderStack.pop() ?? null;
        renderOverall(currentFolderId);
    }

    async function openEditFolderModal() {
        if (editingFolderId === null) return;

        const folder = await fetchFolder(editingFolderId);

        if (!folder) return;

        editGenreType.innerText = "Edit Folder";
        genreSubmitBtn.innerText = "Edit";

        document.getElementById("genre-name").value = folder.name;
        document.getElementById("date").value = folder.date;

        editGenreModal.classList.remove("hidden");
        controlFolderModal.classList.add("hidden");
    }

    async function updateFolder(folder) {
        const response = await fetch(`http://localhost:3003/api/folders/${editingFolderId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: folder.name,
                    date: folder.date,
                    overallMemo: folder.overallMemo
                })
            }
        );

        const result = await response.json();
        
        if (!response.ok) {
            console.error(result.error);
            return;
        }

        console.log("update successfully: ", result);
        editingFolderId = null;
    }

    async function deleteFolder() {
        if (editingFolderId === null) return;

        const confirmed = confirm(
            "Are you sure you want to delete this folder? All subfolders and details will be deleted."
        );
        if (!confirmed) return;

        const response = await fetch(`http://localhost:3003/api/folders/${editingFolderId}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error(result.error);
            return;
        }

        console.log("delete successfully:", result);

        editingFolderId = null;
        controlFolderModal.classList.add("hidden");
        goBack();
    }

    function openEditDetailModal () {
        if (!editingItemId) return;

        const parent = findNodeById(root.children, currentFolderId);
        if (!parent) return;

        const item = parent.children.find(d => d.id === editingItemId);
        if (!item)  return;

        editDetailType.innerText = "Edit Detail";
        detailSubmitBtn.innerText = "Edit";
        document.getElementById("detail-type").value = item.type;
        document.getElementById("detail-source").value = item.type ==="youtube" ? `https://www.youtube.com/watch?v=${item.source}` : item.source;
        document.getElementById("detail-isbn").value = item.isbn;
        document.getElementById("detail-title").value = item.title;
        document.getElementById("detail-date").value = item.date;
        document.getElementById("detail-memo").value = item.memo;
        updateDetailForm();

        editDetailModal.classList.remove("hidden");
        controlDetailModal.classList.add("hidden");
    }

    function deleteDetail () {
        if (!editingItemId) return;

        alert("Are you sure you want to delete this item? You cannot restore it.");

        const parent = findNodeById(root.children, currentFolderId);
        if (!parent) return;

        parent.children = parent.children.filter(d => d.id !== editingItemId);

        editingItemId = null;
        saveStorage();
        renderOverall(currentFolderId);
        controlDetailModal.classList.add("hidden");
    }

    function openControlFolderModal() {
        editingFolderId = currentFolderId;
        controlFolderModal.classList.remove("hidden");
    }

    function openControlDetailModal(e) {
        const ellipsis = e.target.closest(".entry-ellipsis");

        if (!ellipsis) {
            controlDetailModal.classList.add("hidden");
            return;
        }

        const item = ellipsis.closest(".entry-item");
        const detailId = Number(item.dataset.detailId);
        editingItemId = detailId;
        
        const rect = ellipsis.getBoundingClientRect();

        controlDetailModal.style.position = "absolute";
        controlDetailModal.style.top = `${rect.bottom + window.scrollY}px`;
        controlDetailModal.style.left = `${rect.left + window.scrollX - 20}px`;
        controlDetailModal.classList.remove("hidden");
    }

    async function saveStorage() {
        localStorage.setItem("interestRecord", JSON.stringify(root));
        console.log("file saved");
        const response = await fetch("http://localhost:3003/api/folders");

        const folders = await response.json();

        console.log("saved file: ",folders);
    }

    // function loadStorage() {
    //     const saved = localStorage.getItem("interestRecord");
    //     if (!saved) return;
    //     root = JSON.parse(saved); 
    //     renderOverall(null);
    // }

    async function loadRootFolders() {
        const folders = await fetchChildrenFolders(null);
        renderFolders(folders, rootGenreWrapper);
    }

    async function fetchChildrenFolders(parentId) {
        const url = parentId === null 
            ? "http://localhost:3003/api/folders/root"
            : `http://localhost:3003/api/folders/${parentId}/children`
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Failed to fetch folders");
            return [];
        }

        return await response.json();
    }

    async function fetchFolder(id) {
        const response = await fetch(`http://localhost:3003/api/folders/${id}`);
        if (!response) {
            console.error("Failed to fetch folder");
            return [];
        }
        return await response.json();
    }

    async function fetchChildrenItems(folderId) {
        const response = await fetch(`http://localhost:3003/api/items/${folderId}/children`);
        if (!response.ok) {
            console.error("Failed to fetch items");
            return [];
        }

        return await response.json();
    }

    function importData() {
        const file = document.getElementById("import-file").files[0];
        if (!file) {
            alert("Please select a file");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                root = parsed;
                saveStorage();
                renderOverall(null);
                importFileModal.classList.add("hidden");
            } catch {
                alert("Invalid file");
            }
        };

        reader.readAsText(file);
        document.getElementById("import-file").value = "";
        importFileModal.classList.add("hidden");
    }

    function exportData() {
        const data = localStorage.getItem("interestRecord");
        if (!data) {
            alert("No data to back up");
            return;
        }

        const blob = new Blob([data], {type: "application/json"});
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `interestRecord_${getTodayString()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    function getTodayString() {
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth()+1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function extractYouTubeId (url) {
        const regex = [
            /youtu\.be\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
        ]

        for (const pattern of regex) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }


    async function createNewFolder(folder) {
        const response = await fetch("http://localhost:3003/api/folders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                parentId: currentFolderId,
                name: folder.name,
                date: folder.date,
                overallMemo: folder.overallMemo
            })
        });

        const result = await response.json();

        if(!response.ok) {
            console.error(result.error);
            return;
        }

        console.log("create successfully: ", result);
    }

    async function createNewItem(item) {
        const response = await fetch ("http://localhost:3003/api/items", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                folderId: currentFolderId,
                type: item.type,
                source: item.source,
                isbn: item.isbn,
                title: item.title,
                date: item.date,
                memo: item.memo
            })
        })
    }
})


        // if (editingItemId !== null) {
        //     const item = parent.children.find(c => c.id === editingItemId);
        //     if (!item) return;

        //     item.type = type;
        //     item.source = extractYouTubeId(source) ?? source;
        //     item.isbn = isbn;
        //     item.title = title;
        //     item.date = date;
        //     item.memo = memo;

        //     editingItemId = null;
        // } else {
        //     parent.children.push({
        //         id: Date.now(),
        //         type: type,
        //         source: extractYouTubeId(source) ?? source,
        //         isbn,
        //         title,
        //         date,
        //         memo
        //     });
        // }