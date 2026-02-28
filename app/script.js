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

    loadStorage();
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

    function renderGenreDetail(folderId) {
        if (folderId === null) {
            renderGenreList(root.children, rootGenreWrapper);
            genreListSection.classList.remove("hidden");
            detailSection.classList.add("hidden");
            return;
        }

        const folder = folderId === null 
            ? root
            : findNodeById(root.children, folderId);
        if (!folder) return;

        genreTitle.innerText = folder.name;

        entryList.querySelectorAll(".entry-item:not(#add-item)").forEach(e => e.remove());

        renderGenreList(folder.children, subGenreWrapper);

        folder.children.forEach(child => {
            if (child.type === "folder") return;
            renderDetailItem(child);
        })
        overallMemo.value = folder.overallMemo || "";
        genreListSection.classList.add("hidden");
        detailSection.classList.remove("hidden");
    }

    function renderGenreList(children, wrapper) {
        wrapper.querySelectorAll(".genre-grid:not(#add-grid, #add-subgrid)").forEach(e => e.remove());

        children.forEach(child => {
            if (child.type !== "folder") return;

            const div = document.createElement("div");
            div.className = "genre-grid sweep-hover";
            div.dataset.nodeId = child.id;

            div.innerHTML = `
                <h3>${child.name}<h3>
                <p>${child.date}</p>
            `;

            div.addEventListener("click", () => {
                folderStack.push(currentFolderId);
                currentFolderId = child.id;
                renderGenreDetail(child.id);
            });

            wrapper.appendChild(div);
        })
    }

    function renderDetailItem(detail) {
        const li = document.createElement("li");
        li.className = "entry-item";
        li.dataset.detailId = detail.id;

        if(detail.type === "youtube") {
            li.innerHTML = `
                <iframe 
                    class="entry-thumbnail" 
                    width="367" 
                    height="207" 
                    src="https://www.youtube.com/embed/${detail.source}" 
                    title="YouTube video player" 
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                ></iframe>
                <div class="entry-info">
                    <a
                        href="https://www.youtube.com/watch?v=${detail.source}"
                        target="_blank"
                        class="entry-title"
                    >${detail.title}</a>
                </div>
                <p class="entry-date">${detail.date}</p>
                <p class="entry-memo">Memo</p>
                <div class="entry-ellipsis"><i class="fa-solid fa-ellipsis-vertical"></i></div>
            `;
        } else if (detail.type === "link") {
            li.innerHTML = `
                <div class="favicon">
                    <img src="https://www.google.com/s2/favicons?domain=${detail.source}">
                </div>
                <div class="entry-info">
                    <a 
                        href="${detail.source}" 
                        target="_blank" 
                        class="entry-title"
                    >${detail.title}</a>
                </div>
                <p class="entry-date">${detail.date}</p>
                <p class="entry-memo">Memo</p>
                <div class="entry-ellipsis"><i class="fa-solid fa-ellipsis-vertical"></i></div>
            `;
        } else if (detail.type === "book") {
            li.innerHTML = `
                <div class="book-icon">
                    <i class="fa-solid fa-book"></i>
                </div>
                <div class="entry-info">
                    <p class="entry-title">${detail.title}</p>
                </div>
                <p class="entry-date">${detail.date}</p>
                <p class="entry-memo">Memo</p>
                <div class="entry-ellipsis"><i class="fa-solid fa-ellipsis-vertical"></i></div>
            `;
        }

        entryList.appendChild(li);
    }

    function handleParentSubmit(e) {
        e.preventDefault();

        const name = document.getElementById("genre-name").value.trim();
        const date = document.getElementById("date").value || getTodayString();

        if (!name) {
            alert("Please fill in genre name");
            return;
        }

        let parentChildren;

        if (currentFolderId === null) {
            parentChildren = root.children;
        } else {
            const parent = findNodeById(root.children, currentFolderId);
            if (!parent) return;
            parentChildren = parent.children;
        }

        if (editingFolderId !== null) {
            const folder = findNodeById(root.children, editingFolderId);
            if (!folder || folder.type !== "folder") return;

            folder.name = name;
            folder.date = date;
            editingFolderId = null;
        } else {
            parentChildren.push({
                id: Date.now(),
                type: "folder",
                name,
                date,
                overallMemo: "",
                children: []
            });
        }

        editGenreModal.classList.add("hidden");
        saveStorage();
        document.getElementById("genre-name").value = "";
        document.getElementById("date").value = "";
        renderGenreDetail(currentFolderId);
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
        renderGenreDetail(currentFolderId);
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
        renderGenreDetail(currentFolderId);
    }

    function openEditFolderModal () {
        if (!editingFolderId) return;

        const folder = findNodeById(root.children, editingFolderId);
        if (!folder || folder.type !== "folder") return;

        editGenreType.innerText = "Edit Folder";
        genreSubmitBtn.innerText = "Edit";

        document.getElementById("genre-name").value = folder.name;
        document.getElementById("date").value = folder.date;

        editGenreModal.classList.remove("hidden");
        controlFolderModal.classList.add("hidden");
    }

    function deleteFolder() { 
        if (!editingFolderId) return;

        const parentId = folderStack[folderStack.length - 1] ?? null;
        const parent = parentId ? findNodeById(root.children, parentId) : root;
        if (!parent) return;

        parent.children = parent.children.filter(f => f.id !== editingFolderId);
        editingFolderId = null;
        saveStorage();
        goBack();
        renderGenreDetail(currentFolderId);
        controlFolderModal.classList.add("hidden");
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

        const parent = findNodeById(root.children, currentFolderId);
        if (!parent) return;

        parent.children = parent.children.filter(d => d.id !== editingItemId);

        editingItemId = null;
        saveStorage();
        renderGenreDetail(currentFolderId);
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

    function saveStorage() {
        localStorage.setItem("interestRecord", JSON.stringify(root));
    }

    function loadStorage() {
        const saved = localStorage.getItem("interestRecord");
        if (!saved) return;
        root = JSON.parse(saved); 
        renderGenreDetail(null);
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
                renderGenreDetail(null);
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

})
