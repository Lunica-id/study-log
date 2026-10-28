document.addEventListener("DOMContentLoaded", () => {
    console.log("script.js loaded");
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

    let folderStack = [];
    let currentFolderId = null;
    let editingFolderId = null;
    let editingItemId = null;

    let memoSaveTimer = null;

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
    overallMemo.addEventListener("input", () => {
        clearTimeout(memoSaveTimer);

        memoSaveTimer = setTimeout(() => {
            saveOverallMemo();
        }, 500);
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

    async function renderOverall(folderId) {
		try {
			const folders = await fetchChildrenFolders(folderId);

			if (folderId === null) {
                const tempWrapper = document.createElement("div");
				renderFolders(folders, tempWrapper);

                replaceList(rootGenreWrapper, tempWrapper, ".genre-grid:not(#add-grid, #add-subgrid)",addGridBtn);
				genreListSection.classList.remove("hidden");
				detailSection.classList.add("hidden");
                currentFolderId = null;
				return true;
			}

			const items = await fetchChildrenItems(folderId);
            const currentFolder = await fetchFolder(folderId);
            const tempFolderWrapper = document.createElement("div");
            const tempItemWrapper = document.createElement("div");

			renderFolders(folders, tempFolderWrapper);
			renderItems(items,tempItemWrapper);

            replaceList(subGenreWrapper,tempFolderWrapper,".genre-grid:not(#add-grid, #add-subgrid)",addSubGridBtn);
            replaceList(entryList,tempItemWrapper,".entry-item:not(#add-item)",addItemBtn);

			genreTitle.innerText = currentFolder.name;
			overallMemo.value = currentFolder.overall_memo || "";

			genreListSection.classList.add("hidden");
			detailSection.classList.remove("hidden");

            currentFolderId = folderId;
            return true;
		} catch (error) {
			console.error("Failed to render folder:", error);
			alert("Failed to load folder data. Please try again.");
			return false;
		}
    }

    function renderFolders(folders, wrapper) {
        folders.forEach(folder => {
            const div = document.createElement("div");
            div.className = "genre-grid sweep-hover";
            div.dataset.nodeId = folder.id;

            div.innerHTML = `
                <h3>${folder.name}</h3>
                <p>${folder.date}</p>
            `;

            div.addEventListener("click", async() => {
                const previousFolderId = currentFolderId;
                const success = await renderOverall(folder.id);
                if(success) {
                    folderStack.push(previousFolderId);
                }
            });

            wrapper.appendChild(div);
        })
    }

    function renderItems(items, wrapper) {
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

            wrapper.appendChild(li);
        })
    }

    function replaceList(wrapper, tempWrapper, selector, addButton) {
        wrapper.querySelectorAll(selector).forEach(element => element.remove());

        let nextElement = addButton.nextSibling;

        while(tempWrapper.firstChild) {
            wrapper.insertBefore(tempWrapper.firstChild,nextElement);
        }
    }

    async function handleParentSubmit(e) {
        e.preventDefault();

        const name = document.getElementById("genre-name").value.trim();
        const date = document.getElementById("date").value || getTodayString();

        if (!name) {
            alert("Please fill in genre name");
            return;
        }

        const folder = {
            name: name,
            date: date
        };
        
		let success;
        if (editingFolderId !== null) {
            success = await updateFolder(folder); 
        } else {
            success = await createNewFolder(folder);
        }

		if(!success) {
			alert("Failed to save folder.");
			return;
		}
        
        editGenreModal.classList.add("hidden");
        document.getElementById("genre-name").value = "";
        document.getElementById("date").value = "";

        await renderOverall(currentFolderId);
    }

    async function handleDetailSubmit(e) {
        e.preventDefault();

        const type = document.getElementById("detail-type").value;
        const source = document.getElementById("detail-source").value;
        const isbn = document.getElementById("detail-isbn").value || null;
        const title = document.getElementById("detail-title").value;
        const date = document.getElementById("detail-date").value || getTodayString();
        const memo = document.getElementById("detail-memo").value || null;

        const item = {
            type: type,
            source: extractYouTubeId(source) ?? source,
            isbn: isbn,
            title: title,
            date: date,
            memo: memo
        };

		let success;
        if (editingItemId !== null) {
            success = await updateItem(item);
        } else {
            success = await createNewItem(item);
        }

		if(!success) {
			alert("Failed to save item. Please try again.");
			return;
		}

		editingItemId = null;
        editDetailModal.classList.add("hidden");

        document.getElementById("detail-type").value = "link";
        document.getElementById("detail-source").value = "";
        document.getElementById("detail-isbn").value = "";
        document.getElementById("detail-title").value = "";
        document.getElementById("detail-date").value = "";
        document.getElementById("detail-memo").value = "";

        await renderOverall(currentFolderId);
    }

    function updateDetailForm() {
        const selectedType = typeSelect.value;
        const typeBlocks = document.querySelectorAll("#detail-form [data-type]");

        typeBlocks.forEach(block => {
            const types = block.dataset.type.split(" ");
            block.classList.toggle("hidden", !types.includes(selectedType));
        });
    }

    async function goBack({saveMemo = true} = {}) {
        clearTimeout(memoSaveTimer);

        if (saveMemo) {
            const saved = await saveOverallMemo();

        	if (!saved) {
            	alert("Memo could not be saved. Please try again.");
            	return;
        	}
    	}

        const previousFolderId = folderStack[folderStack.length -1] ?? null;
        const success = await renderOverall(previousFolderId);
        if (success) {
            folderStack.pop();
        }
    }

    async function openEditFolderModal() {
		try {
			if (editingFolderId === null) return;

	        const folder = await fetchFolder(editingFolderId);

    	    if (!folder) return;

        	editGenreType.innerText = "Edit Folder";
    	    genreSubmitBtn.innerText = "Edit";

        	document.getElementById("genre-name").value = folder.name;
	        document.getElementById("date").value = folder.date;

    	    editGenreModal.classList.remove("hidden");
        	controlFolderModal.classList.add("hidden");
		} catch (error) {
			console.error("Failed to render folder:", error);
			alert("Failed to load folder data. Please try again.");
			return;
		}

    }

    async function updateFolder(folder) {
        try {
			const response = await fetch(`/api/folders/${editingFolderId}`, {
            	method: "PATCH",
	            headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
            	    name: folder.name,
                	date: folder.date
                })
    	    });

	        const result = await response.json();

	        if (!response.ok) {
    	        console.error(result.error);
        	    return false;
        	}

	        console.log("update successfully: ", result);
    	    editingFolderId = null;
			return true;
		} catch (error) {
			console.error("Failed to update folder:", error);
			return false;
		}
    }

    async function saveOverallMemo() {
        if (currentFolderId === null) return true;

        try {
            const response = await fetch(
                `/api/folders/${currentFolderId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        overallMemo: overallMemo.value
                    })
                }
            );

            if (!response.ok) {
                console.error("Failed to save memo:", response.status);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Failed to save memo:", error);
            return false;
        }
    }

    async function deleteFolder() {
        if (editingFolderId === null) return;

        const confirmed = confirm(
            "Are you sure you want to delete this folder? All subfolders and details will be deleted."
        );
        if (!confirmed) return;

		try {
			clearTimeout(memoSaveTimer);

			const response = await fetch(`/api/folders/${editingFolderId}`, {
				method: "DELETE"
			});

			const result = await response.json();

			if (!response.ok) {
				console.error(result.error);
				return;
			}

			console.log("delete successfully:", result);

			editingFolderId = null;
			controlFolderModal.classList.add("hidden");
			await goBack({ saveMemo: false });
		} catch (error) {
			console.error("Failed to delete folder:", error);
			alert("Failed to delete folder. Please try again.");
			return;
		}
    }

    async function openEditDetailModal() {
		try {
			if (editingItemId === null) return;

	        const response = await fetch(
    	        `/api/items/${editingItemId}`
        	);

	        if (!response.ok) {
    	        console.error("Failed to fetch item");
        	    return;
        	}

	        const item = await response.json();

    	    editDetailType.innerText = "Edit Detail";
        	detailSubmitBtn.innerText = "Edit";

	        document.getElementById("detail-type").value = item.type;

    	    document.getElementById("detail-source").value =
        	    item.type === "youtube"
            	    ? `https://www.youtube.com/watch?v=${item.source}`
                	: item.source ?? "";

	        document.getElementById("detail-isbn").value = item.isbn ?? "";
    	    document.getElementById("detail-title").value = item.title;
        	document.getElementById("detail-date").value = item.date;
	        document.getElementById("detail-memo").value = item.memo ?? "";

    	    updateDetailForm();

	        editDetailModal.classList.remove("hidden");
    	    controlDetailModal.classList.add("hidden");
		} catch (error) {
			console.error("Failed to open detail edit modal", error);
			alert("Failed to open detail edit modal. Please try again.");
		}
    }

    async function deleteDetail() {
        if (editingItemId === null) return;

        const confirmed = confirm(
            "Are you sure you want to delete this item? You cannot restore it."
        );
        if (!confirmed) return;

		try {
    	    const response = await fetch(
            `/api/items/${editingItemId}`,
            {
                method: "DELETE"
            }
        	);

	        const result = await response.json();

    	    if (!response.ok) {
        	    console.error(result.error);
            	return;
        	}

	        console.log("delete item successfully:", result);

    	    editingItemId = null;
        	controlDetailModal.classList.add("hidden");
    
	        await renderOverall(currentFolderId);
		} catch (error) {
			console.error("Failed to delete item:", error);
			alert("Failed to delete item. Please try again.");
			return;
		}
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

    async function loadRootFolders() {
        await renderOverall(null);
    }

    async function fetchChildrenFolders(parentId) {
        const url = parentId === null 
            ? "/api/folders/root"
            : `/api/folders/${parentId}/children`
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch folders");
        }

        return await response.json();
    }

    async function fetchFolder(id) {
        const response = await fetch(`/api/folders/${id}`);
        if (!response.ok) {
            throw new Error("Failed to fetch a folder");
        }
        return await response.json();
    }

    async function fetchChildrenItems(folderId) {
        const response = await fetch(`/api/items/${folderId}/children`);
        if (!response.ok) {
            throw new Error("Failed to fetch items");
        }

        return await response.json();
    }

    async function importData() {
        const file = document.getElementById("import-file").files[0];

        if (!file) {
            alert("Please select a file");
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (
                data.version !== 1 ||
                !Array.isArray(data.folders) ||
                !Array.isArray(data.items)
            ) {
                throw new Error("Invalid backup format");
            }

            const confirmed = confirm(
                "Importing this backup will replace all current data. Continue?"
            );

            if (!confirmed) return;

            const response = await fetch("/api/backup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to import backup"
                );
            }

            currentFolderId = null;
            folderStack = [];
            editingFolderId = null;
            editingItemId = null;

            await renderOverall(null);

            importFileModal.classList.add("hidden");
            document.getElementById("import-file").value = "";

            alert("Import completed successfully");

        } catch (error) {
            console.error("Import failed:", error);
            alert("Failed to import data: " + error.message);
        }
    }

    async function exportData() {
        try {
            const response = await fetch("/api/backup");
            if (!response.ok) {
                console.error("failed");  //TODO
                return;
            }

            const data = await response.json();
            const jsonText = JSON.stringify(data, null, 2);

            const blob = new Blob([jsonText], {type: "application/json"});
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `interestRecord_${getTodayString()}.json`;
            a.click();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export data");
        }
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
		try {
			const response = await fetch("/api/folders", {
	            method: "POST",
    	        headers: { "Content-Type": "application/json" },
	            body: JSON.stringify({
    	            parentId: currentFolderId,
        	        name: folder.name,
            	    date: folder.date,
                	overallMemo: null
            	})
        	});

	        const result = await response.json();

    	    if (!response.ok) {
				console.error("Failed to create folder:", response.status,result);
				return false;
			}

	        console.log("create successfully: ", result);
			return true;
		} catch (error) {
			console.error("Failed to create folder:", error);
			return false;
		}
        
    }

    async function createNewItem(item) {
		try {
			const response = await fetch("/api/items", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					folderId: currentFolderId,
					type: item.type,
					source: item.source,
					isbn: item.isbn,
					title: item.title,
					date: item.date,
					memo: item.memo,
				})
			});
			const result = await response.json();

			if (!response.ok) {
				console.error(result.error);
				return false;
			}

			console.log("create item successfully: ", result);
			return true;
		} catch (error) {
			console.error("Failed to create item:", error);
			return false;
		}
    }

    async function updateItem(item) {
		try {
			const response = await fetch(`/api/items/${editingItemId}`, {
				method: "PATCH",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					type: item.type,
					source: item.source,
					isbn: item.isbn,
					title: item.title,
					date: item.date,
					memo: item.memo
				})
			});

			const result = await response.json();

			if (!response.ok) {
				console.error(result.error);
				return false;
			}

			console.log("update item successfully:", result);
			return true;
		} catch (error) {
			console.error("Failed to update item", error);
			return false;
		}
    }
})