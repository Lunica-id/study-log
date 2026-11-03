document.addEventListener("DOMContentLoaded", () => {
    console.log("script.js loaded");
    const folderListSection = document.getElementById("folder-list-section");
    const homeEllipsis = document.getElementById("home-ellipsis");
    const rootFolderWrapper = folderListSection.querySelector(".wrapper");
    const addRootFolderButton = document.getElementById("add-root-folder");
    const addItemButton = document.getElementById("add-item");
    const folderContentSection = document.getElementById("folder-content-section");
    const folderTitle = folderContentSection.querySelector(".folder-title");
    const folderMenuButton = document.getElementById("folder-menu-button");
    const itemList = folderContentSection.querySelector(".item-list");
    const overallMemo = document.querySelector(".overall-memo");
    const backButton = document.getElementById("back-button");
    const childFolderWrapper = document.querySelector("#folder-content-section .wrapper");                                                                                                                                                                                                                                                                                                                                                                                                                                                       
    const addChildFolderButton = document.getElementById("add-child-folder");
    const editFolderModal = document.getElementById("edit-folder-modal");
    const editFolderHeading = document.getElementById("edit-folder-heading");
    const folderCancelButton = document.getElementById("folder-cancel-button");
    const folderSubmitButton = document.getElementById("folder-submit-button");
    const controlHomeModal = document.getElementById("control-home-modal");
    const importBtn = document.getElementById("import-button");
    const exportBtn = document.getElementById("export-button");
    const importFileModal = document.getElementById("import-file-modal");
    const importCancelBtn = document.getElementById("import-cancel-button");
    const importSubmitBtn = document.getElementById("import-submit-button");
    const editItemModal = document.getElementById("edit-item-modal");
    const editItemHeading = document.getElementById("edit-item-heading");
    const typeSelect = document.getElementById("item-type");
    const itemCancelButton = document.getElementById("item-cancel-button");
    const itemSubmitButton = document.getElementById("item-submit-button");
    const folderMenu = document.getElementById("folder-menu");
    const editFolderButton = document.getElementById("edit-folder-button");
    const deleteFolderBtn = document.getElementById("delete-folder-button");
    const itemMenu = document.getElementById("item-menu");
    const editItemButton = document.getElementById("edit-item-button");
    const deleteItemButton = document.getElementById("delete-item-button");

    let folderStack = [];
    let currentFolderId = null;
    let editingFolderId = null;
    let editingItemId = null;

    let memoSaveTimer = null;

    loadRootFolders();
    document.addEventListener("click", (e) => { 
        if (!controlHomeModal.contains(e.target) && !controlHomeModal.classList.contains("hidden")) {
            controlHomeModal.classList.add("hidden");
        } else if (!folderMenu.contains(e.target) && !folderMenu.classList.contains("hidden")) {
            folderMenu.classList.add("hidden");
        }
    });
    homeEllipsis.addEventListener("click", (e) => {
        e.stopPropagation();
        controlHomeModal.classList.remove("hidden");
    })
    addRootFolderButton.addEventListener ("click", () => {
        editFolderModal.classList.remove("hidden");
    });
    addChildFolderButton.addEventListener ("click", () => {
        editFolderModal.classList.remove("hidden");
    });
    folderCancelButton.addEventListener("click", () => {
        editFolderModal.classList.add("hidden");
    });
    folderSubmitButton.addEventListener("click", handleFolderSubmit);
    typeSelect.addEventListener("change", updateItemForm);
    overallMemo.addEventListener("input", () => {
        clearTimeout(memoSaveTimer);

        memoSaveTimer = setTimeout(() => {
            saveOverallMemo();
        }, 500);
    });
    backButton.addEventListener("click", goBack);
    addItemButton.addEventListener("click", () => {
        editItemHeading.innerText = "Create New Item";
        itemSubmitButton.innerText = "Create";
        editItemModal.classList.remove("hidden");
        updateItemForm();
    });
    folderMenuButton.addEventListener("click", (e) => {
        e.stopPropagation();
        openControlFolderModal()
    });
    editFolderButton.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditFolderModal();
    });
    deleteFolderBtn.addEventListener("click", deleteFolder);
    itemList.addEventListener("click", openControlItemModal);
    itemCancelButton.addEventListener("click", () => {
        editItemModal.classList.add("hidden");
        document.getElementById("item-type").value = "link";
        document.getElementById("item-source").value = "";
        document.getElementById("item-title").value = "";
        document.getElementById("item-date").value = "";
        document.getElementById("item-memo").value = "";
        editingItemId = null;
    });
    itemSubmitButton.addEventListener("click", handleItemSubmit);
    importBtn.addEventListener("click", () => {
        controlHomeModal.classList.add("hidden");
        importFileModal.classList.remove("hidden");
    });
    importCancelBtn.addEventListener("click", ()=> {
        importFileModal.classList.add("hidden");
    })
    importSubmitBtn.addEventListener("click", importData);
    exportBtn.addEventListener("click", exportData);
    editItemButton.addEventListener("click", openEditItemModal);
    deleteItemButton.addEventListener("click", deleteItem);

    async function renderOverall(folderId) {
		try {
			const folders = await fetchChildrenFolders(folderId);

			if (folderId === null) {
                const tempWrapper = document.createElement("div");
				renderFolders(folders, tempWrapper);

                replaceList(rootFolderWrapper, tempWrapper, ".folder-grid:not(#add-root-folder, #add-child-folder)",addRootFolderButton);
				folderListSection.classList.remove("hidden");
				folderContentSection.classList.add("hidden");
                currentFolderId = null;
				return true;
			}

			const items = await fetchChildrenItems(folderId);
            const currentFolder = await fetchFolder(folderId);
            const tempFolderWrapper = document.createElement("div");
            const tempItemWrapper = document.createElement("div");

			renderFolders(folders, tempFolderWrapper);
			renderItems(items,tempItemWrapper);

            replaceList(childFolderWrapper,tempFolderWrapper,".folder-grid:not(#add-root-folder, #add-child-folder)",addChildFolderButton);
            replaceList(itemList,tempItemWrapper,".item-card:not(#add-item)",addItemButton);

			folderTitle.innerText = currentFolder.name;
			overallMemo.value = currentFolder.overall_memo || "";

			folderListSection.classList.add("hidden");
			folderContentSection.classList.remove("hidden");

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
            div.className = "folder-grid sweep-hover";
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
            li.className = "item-card";
            li.dataset.itemId = item.id;

            if(item.type === "youtube") {
                li.innerHTML = `
                    <iframe 
                        class="item-thumbnail" 
                        width="367" 
                        height="207" 
                        src="https://www.youtube.com/embed/${item.source}" 
                        title="YouTube video player" 
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                    ></iframe>
                    <div class="item-info">
                        <a
                            href="https://www.youtube.com/watch?v=${item.source}"
                            target="_blank"
                            class="item-title"
                        >${item.title}</a>
                    </div>
                    <p class="item-date">${item.date}</p>
                    <p class="item-memo">Memo</p>
                    <div class="item-menu"><i class="fa-solid fa-ellipsis-vertical"></i></div>
                `;
            } else if (item.type === "link") {
                li.innerHTML = `
                    <div class="favicon">
                        <img src="https://www.google.com/s2/favicons?domain=${item.source}">
                    </div>
                    <div class="item-info">
                        <a 
                            href="${item.source}" 
                            target="_blank" 
                            class="item-title"
                        >${item.title}</a>
                    </div>
                    <p class="item-date">${item.date}</p>
                    <p class="item-memo">Memo</p>
                    <div class="item-menu"><i class="fa-solid fa-ellipsis-vertical"></i></div>
                `;
            } else if (item.type === "book") {
                li.innerHTML = `
                    <div class="book-icon">
                        <i class="fa-solid fa-book"></i>
                    </div>
                    <div class="item-info">
                        <p class="item-title">${item.title}</p>
                    </div>
                    <p class="item-date">${item.date}</p>
                    <p class="item-memo">Memo</p>
                    <div class="item-menu"><i class="fa-solid fa-ellipsis-vertical"></i></div>
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

    async function handleFolderSubmit(e) {
        e.preventDefault();

        const name = document.getElementById("folder-name").value.trim();
        const date = document.getElementById("date").value || getTodayString();

        if (!name) {
            alert("Please fill in a folder name");
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
        
        editFolderModal.classList.add("hidden");
        document.getElementById("folder-name").value = "";
        document.getElementById("date").value = "";

        await renderOverall(currentFolderId);
    }

    async function handleItemSubmit(e) {
        e.preventDefault();

        const type = document.getElementById("item-type").value;
        const source = document.getElementById("item-source").value;
        const isbn = document.getElementById("item-isbn").value || null;
        const title = document.getElementById("item-title").value;
        const date = document.getElementById("item-date").value || getTodayString();
        const memo = document.getElementById("item-memo").value || null;

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
        editItemModal.classList.add("hidden");

        document.getElementById("item-type").value = "link";
        document.getElementById("item-source").value = "";
        document.getElementById("item-isbn").value = "";
        document.getElementById("item-title").value = "";
        document.getElementById("item-date").value = "";
        document.getElementById("item-memo").value = "";

        await renderOverall(currentFolderId);
    }

    function updateItemForm() {
        const selectedType = typeSelect.value;
        const typeBlocks = document.querySelectorAll("#item-form [data-type]");

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

        	editFolderHeading.innerText = "Edit Folder";
    	    folderSubmitButton.innerText = "Edit";

        	document.getElementById("folder-name").value = folder.name;
	        document.getElementById("date").value = folder.date;

    	    editFolderModal.classList.remove("hidden");
        	folderMenu.classList.add("hidden");
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
            "Are you sure you want to delete this folder? All subfolders and items will be deleted."
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
			folderMenu.classList.add("hidden");
			await goBack({ saveMemo: false });
		} catch (error) {
			console.error("Failed to delete folder:", error);
			alert("Failed to delete folder. Please try again.");
			return;
		}
    }

    async function openEditItemModal() {
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

    	    editItemHeading.innerText = "Edit Item";
        	itemSubmitButton.innerText = "Edit";

	        document.getElementById("item-type").value = item.type;

    	    document.getElementById("item-source").value =
        	    item.type === "youtube"
            	    ? `https://www.youtube.com/watch?v=${item.source}`
                	: item.source ?? "";

	        document.getElementById("item-isbn").value = item.isbn ?? "";
    	    document.getElementById("item-title").value = item.title;
        	document.getElementById("item-date").value = item.date;
	        document.getElementById("item-memo").value = item.memo ?? "";

    	    updateItemForm();

	        editItemModal.classList.remove("hidden");
    	    itemMenu.classList.add("hidden");
		} catch (error) {
			console.error("Failed to open detail edit modal", error);
			alert("Failed to open detail edit modal. Please try again.");
		}
    }

    async function deleteItem() {
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
        	itemMenu.classList.add("hidden");
    
	        await renderOverall(currentFolderId);
		} catch (error) {
			console.error("Failed to delete item:", error);
			alert("Failed to delete item. Please try again.");
			return;
		}
    }

    function openControlFolderModal() {
        editingFolderId = currentFolderId;
        folderMenu.classList.remove("hidden");
    }

    function openControlItemModal(e) {
        const ellipsis = e.target.closest(".item-menu");

        if (!ellipsis) {
            itemMenu.classList.add("hidden");
            return;
        }

        const item = ellipsis.closest(".item-card");
        const itemId = Number(item.dataset.itemId);
        editingItemId = itemId;
        
        const rect = ellipsis.getBoundingClientRect();

        itemMenu.style.position = "absolute";
        itemMenu.style.top = `${rect.bottom + window.scrollY}px`;
        itemMenu.style.left = `${rect.left + window.scrollX - 20}px`;
        itemMenu.classList.remove("hidden");
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