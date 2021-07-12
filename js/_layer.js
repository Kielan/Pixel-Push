// HTML element that contains the layer entries
let layerList;
// A single layer entry (used as a prototype to create the new ones)
let layerListEntry;
// NEXTPULL: remove the drag n drop system and use Sortable.js instead
let layerDragSource = null;

// Number of layers at the beginning
let layerCount = 1;
// Current max z index (so that I know which z-index to assign to new layers)
let maxZIndex = 3;

// When a layer is deleted, its id is added to this array and can be reused
let unusedIDs = [];
// Id for the next added layer
let currentID = layerCount;
// Layer menu
let layerOptions = document.getElementById("layer-properties-menu");
// Is the user currently renaming a layer?
let isRenamingLayer = false;
// I need to save this, trust me
let oldLayerName = null;

let dragStartLayer;

// Binding the add layer button to the function
Input.on('click',"add-layer-button", addLayer, false);

/** Handler class for a single canvas (a single layer)
 *
 * @param width Canvas width
 * @param height Canvas height
 * @param canvas HTML canvas element
 */
class Layer {
    constructor(width, height, canvas, menuEntry) {
        this.canvasSize = [width, height];
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.isSelected = false;
        this.isVisible = true;
        this.isLocked = false;
        this.menuEntry = menuEntry;

        let id = unusedIDs.pop();
        console.log("id creato: " + id);

        if (id == null) {
            id = currentID;
            currentID++;
        }

        this.id = "layer" + id;

        // Binding the events
        if (menuEntry != null) {
            this.name = menuEntry.getElementsByTagName("p")[0].innerHTML;
            menuEntry.id = "layer" + id;
            menuEntry.onmouseover = () => this.hover();
            menuEntry.onmouseout = () => this.unhover();
            menuEntry.onclick = () => this.selectLayer();
            menuEntry.getElementsByTagName("button")[0].onclick = () => this.toggleLock();
            menuEntry.getElementsByTagName("button")[1].onclick = () => this.toggleVisibility();

            menuEntry.addEventListener("mouseup", this.openOptionsMenu, false);
            menuEntry.addEventListener("dragstart", this.layerDragStart, false);
            menuEntry.addEventListener("drop", this.layerDragDrop, false);
            menuEntry.addEventListener("dragover", this.layerDragOver, false);
            menuEntry.addEventListener("dragleave", this.layerDragLeave, false);
            menuEntry.addEventListener("dragend", this.layerDragEnd, false);

            menuEntry.getElementsByTagName("canvas")[0].getContext('2d').imageSmoothingEnabled = false;
        }

        this.initialize();
    }

    // Initializes the canvas
    initialize() {
        //resize canvas
        this.canvas.width = this.canvasSize[0];
        this.canvas.height = this.canvasSize[1];
        this.canvas.style.width = (this.canvas.width*zoom)+'px';
        this.canvas.style.height = (this.canvas.height*zoom)+'px';

        //show canvas
        this.canvas.style.display = 'block';

        //center canvas in window
        this.canvas.style.left = 64+canvasView.clientWidth/2-(this.canvasSize[0]*zoom/2)+'px';
        this.canvas.style.top = 48+canvasView.clientHeight/2-(this.canvasSize[1]*zoom/2)+'px';

        this.context.imageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
    }

    hover() {
        // Hides all the layers but the current one
        for (let i=1; i<layers.length - nAppLayers; i++) {
            if (layers[i] !== this) {
                layers[i].canvas.style.opacity = 0.3;
            }
        }
    }

    unhover() {
        // Shows all the layers again
        for (let i=1; i<layers.length - nAppLayers; i++) {
            if (layers[i] !== this) {
                layers[i].canvas.style.opacity = 1;
            }
        }
    }

    setID(id) {
        this.id = id;
        if (this.menuEntry != null) {
            this.menuEntry.id = id;
        }
    }

    // Resizes canvas
    resize() {
        let newWidth = (this.canvas.width * zoom) + 'px';
        let newHeight = (this.canvas.height *zoom)+ 'px';

        this.canvas.style.width = newWidth;
        this.canvas.style.height = newHeight;
    }

    setCanvasOffset (offsetLeft, offsetTop) {
        //horizontal offset
        var minXOffset = -this.canvasSize[0] * zoom;
        var maxXOffset = window.innerWidth - 300;
    
        if 	(offsetLeft < minXOffset)
            this.canvas.style.left = minXOffset +'px';
        else if (offsetLeft > maxXOffset)
            this.canvas.style.left = maxXOffset +'px';
        else
            this.canvas.style.left = offsetLeft +'px';
    
        //vertical offset
        var minYOffset = -this.canvasSize[1] * zoom + 164;
        var maxYOffset = window.innerHeight - 100;
    
        if 	(offsetTop < minYOffset)
            this.canvas.style.top = minYOffset +'px';
        else if (offsetTop > maxYOffset)
            this.canvas.style.top = maxYOffset +'px';
        else
            this.canvas.style.top = offsetTop +'px';
    }

    // Copies the otherLayer's position and size
    copyData(otherLayer) {
        this.canvas.style.width = otherLayer.canvas.style.width;
        this.canvas.style.height = otherLayer.canvas.style.height;
        
        this.canvas.style.left = otherLayer.canvas.style.left;
        this.canvas.style.top = otherLayer.canvas.style.top;
    }

    openOptionsMenu(event) {
        if (event.which == 3) {
            let selectedId;
            let target = event.target;

            while (target != null && target.classList != null && !target.classList.contains("layers-menu-entry")) {
                target = target.parentElement;
            }

            selectedId = target.id;

            layerOptions.style.visibility = "visible";
            layerOptions.style.top = "0";
            layerOptions.style.marginTop = "" + (event.clientY - 25) + "px";

            getLayerByID(selectedId).selectLayer();
        }
    }

    closeOptionsMenu(event) {
        layerOptions.style.visibility = "hidden";
        currentLayer.menuEntry.getElementsByTagName("p")[0].setAttribute("contenteditable", false);
        isRenamingLayer = false;

        if (oldLayerName != null) {
            let name = this.menuEntry.getElementsByTagName("p")[0].innerHTML;
            this.name = name;

            new HistoryStateRenameLayer(oldLayerName, name, currentLayer);
            oldLayerName = null;
        }
    }

    selectLayer(layer) {
        if (layer == null) {
            // Deselecting the old layer
            currentLayer.deselectLayer();

            // Selecting the current layer
            this.isSelected = true;
            this.menuEntry.classList.add("selected-layer");
            currentLayer = getLayerByName(this.menuEntry.getElementsByTagName("p")[0].innerHTML);
        }
        else {
            currentLayer.deselectLayer();

            layer.isSelected = true;
            layer.menuEntry.classList.add("selected-layer");
            currentLayer = layer;
        }
    }

    toggleLock() {
        if (this.isLocked) {
            this.unlock();
        }
        else {
            this.lock();
        }
    }

    toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        }
        else {
            this.show();
        }
    }

    deselectLayer() {
        this.isSelected = false;
        this.menuEntry.classList.remove("selected-layer");
    }

    lock() {
        this.isLocked = true;
        this.menuEntry.getElementsByClassName("layer-button")[0].style.visibility = "visible";

        this.menuEntry.getElementsByClassName("default-icon")[0].style.display = "none";
        this.menuEntry.getElementsByClassName("edited-icon")[0].style.display = "inline-block";
    }

    unlock() {
        this.isLocked = false;
        this.menuEntry.getElementsByClassName("layer-button")[0].style.visibility = "hidden";

        this.menuEntry.getElementsByClassName("default-icon")[0].style.display = "inline-block";
        this.menuEntry.getElementsByClassName("edited-icon")[0].style.display = "none";
    }

    show() {
        this.isVisible = true;
        this.canvas.style.visibility = "visible";
        this.menuEntry.getElementsByClassName("layer-button")[1].style.visibility = "hidden";

        // Changing icon
        this.menuEntry.getElementsByClassName("default-icon")[1].style.display = "inline-block";
        this.menuEntry.getElementsByClassName("edited-icon")[1].style.display = "none";
    }

    hide() {
        this.isVisible = false;
        this.canvas.style.visibility = "hidden";
        this.menuEntry.getElementsByClassName("layer-button")[1].style.visibility = "visible";

        // Changing icon
        this.menuEntry.getElementsByClassName("default-icon")[1].style.display = "none";
        this.menuEntry.getElementsByClassName("edited-icon")[1].style.display = "inline-block";
    }

    updateLayerPreview() {
        // Getting the canvas
        let destination = this.menuEntry.getElementsByTagName("canvas")[0];
        let widthRatio = this.canvasSize[0] / this.canvasSize[1];
        let heightRatio = this.canvasSize[1] / this.canvasSize[0];

        // Computing width and height for the preview image
        let previewWidth = destination.width;
        let previewHeight = destination.height;

        // If the sprite is rectangular, I apply the ratio to the preview as well
        if (widthRatio < 1) {
            previewWidth = destination.width * widthRatio;
        }
        else if (widthRatio > 1) {
            previewHeight = destination.height * heightRatio;
        }

        // La appiccico sulla preview
        destination.getContext('2d').clearRect(0, 0, destination.width, destination.height);
        destination.getContext('2d').drawImage(this.canvas,
            // This is necessary to center the preview in the canvas
            (destination.width - previewWidth) / 2, (destination.height - previewHeight) / 2,
            previewWidth, previewHeight);
    }
}

function flatten(onlyVisible) {
    if (!onlyVisible) {
        // Selecting the first layer
        let firstLayer = layerList.firstElementChild;
        let nToFlatten = layerList.childElementCount - 1;
        getLayerByID(firstLayer.id).selectLayer();

        for (let i = 0; i < nToFlatten; i++) {
            merge();
        }

        new HistoryStateFlattenAll(nToFlatten);
    }
    else {
        // Getting all the visible layers
        let visibleLayers = [];
        let nToFlatten = 0;

        for (let i=0; i<layers.length; i++) {
            if (layers[i].menuEntry != null && layers[i].isVisible) {
                visibleLayers.push(layers[i]);
            }
        }

        // Sorting them by z-index
        visibleLayers.sort((a, b) => (a.canvas.style.zIndex > b.canvas.style.zIndex) ? -1 : 1);
        // Selecting the last visible layer (the only one that won't get deleted)
        visibleLayers[visibleLayers.length - 1].selectLayer();

        // Merging all the layer but the last one
        for (let i=0; i<visibleLayers.length - 1; i++) {
            nToFlatten++;
            console.log(visibleLayers[i].menuEntry.nextElementSibling);
            new HistoryStateFlattenTwoVisibles(
                visibleLayers[i + 1].context.getImageData(0, 0, visibleLayers[i].canvasSize[0], visibleLayers[i].canvasSize[1]),
                visibleLayers[i].menuEntry.nextElementSibling,
                layers.indexOf(visibleLayers[i]),
                visibleLayers[i], visibleLayers[i + 1]
            );

            mergeLayers(visibleLayers[i + 1].context, visibleLayers[i].context);

            // Deleting the above layer
            visibleLayers[i].canvas.remove();
            visibleLayers[i].menuEntry.remove();
            layers.splice(layers.indexOf(visibleLayers[i]), 1);
        }

        new HistoryStateFlattenVisible(nToFlatten);
        // Updating the layer preview
        currentLayer.updateLayerPreview();
    }
}

function merge(saveHistory = true) {
    // Saving the layer that should be merged
    let toMerge = currentLayer;
    let toMergeIndex = layers.indexOf(toMerge);
    // Getting layer below
    let layerBelow = getLayerByID(currentLayer.menuEntry.nextElementSibling.id);

    // If I have something to merge with
    if (layerBelow != null) {
        // Selecting that layer
        layerBelow.selectLayer();

        if (saveHistory) {
            new HistoryStateMergeLayer(toMergeIndex, toMerge,
                layerBelow.context.getImageData(0, 0, layerBelow.canvasSize[0], layerBelow.canvasSize[1]),
                layerBelow);
        }

        mergeLayers(currentLayer.context, toMerge.context);

        // Deleting the above layer
        toMerge.canvas.remove();
        toMerge.menuEntry.remove();
        layers.splice(toMergeIndex, 1);

        // Updating the layer preview
        currentLayer.updateLayerPreview();
    }
}

function deleteLayer(saveHistory = true) {
    // Cannot delete all the layers
    if (layers.length != 4) {
        let layerIndex = layers.indexOf(currentLayer);
        let toDelete = layers[layerIndex];
        let previousSibling = toDelete.menuEntry.previousElementSibling;
        // Adding the ids to the unused ones
        console.log("id cancellato: " + toDelete.id);
        unusedIDs.push(toDelete.id);

        // Selecting the next layer
        if (layerIndex != (layers.length - 4)) {
            layers[layerIndex + 1].selectLayer();
        }
        // or the previous one if the next one doesn't exist
        else {
            layers[layerIndex - 1].selectLayer();
        }

        // Deleting canvas and entry
        toDelete.canvas.remove();
        toDelete.menuEntry.remove();

        // Removing the layer from the list
        layers.splice(layerIndex, 1);

        if (saveHistory) {
            new HistoryStateDeleteLayer(toDelete, previousSibling, layerIndex);
        }
    }

    // Closing the menu
    currentLayer.closeOptionsMenu();
}

function duplicateLayer(event, saveHistory = true) {
    let layerIndex = layers.indexOf(currentLayer);
    let toDuplicate = currentLayer;
    let menuEntries = layerList.children;

    // Increasing z-indexes of the layers above
    for (let i=getMenuEntryIndex(menuEntries, toDuplicate.menuEntry) - 1; i>=0; i--) {
        getLayerByID(menuEntries[i].id).canvas.style.zIndex++;
    }
    maxZIndex+=2;

    // Creating a new canvas
    let newCanvas = document.createElement("canvas");
    // Setting up the new canvas
    canvasView.append(newCanvas);
    newCanvas.style.zIndex = parseInt(currentLayer.canvas.style.zIndex) + 2;
    newCanvas.classList.add("drawingCanvas");

	if (!layerListEntry) return console.warn('skipping adding layer because no document');

    // Clone the default layer
    let toAppend = currentLayer.menuEntry.cloneNode(true);
    // Setting the default name for the layer
    toAppend.getElementsByTagName('p')[0].innerHTML += " copy";
    // Removing the selected class
    toAppend.classList.remove("selected-layer");
    // Adding the layer to the list
    layerCount++;

    // Creating a layer object
    let newLayer = new Layer(currentLayer.canvasSize[0], currentLayer.canvasSize[1], newCanvas, toAppend);
    newLayer.context.fillStyle = currentLayer.context.fillStyle;
    newLayer.copyData(currentLayer);

    layers.splice(layerIndex, 0, newLayer);
    
    // Insert it before the Add layer button
    layerList.insertBefore(toAppend, currentLayer.menuEntry);

    // Copy the layer content
    newLayer.context.putImageData(currentLayer.context.getImageData(
        0, 0, currentLayer.canvasSize[0], currentLayer.canvasSize[1]), 0, 0);
    newLayer.updateLayerPreview();
    // Basically "if I'm not adding a layer because redo() is telling meto do so", then I can save the history
    if (saveHistory) {
        new HistoryStateDuplicateLayer(newLayer, currentLayer);
    }
}

function renameLayer(event) {
    let layerIndex = layers.indexOf(currentLayer);
    let toRename = currentLayer;
    let p = currentLayer.menuEntry.getElementsByTagName("p")[0];

    oldLayerName = p.innerHTML;

    p.setAttribute("contenteditable", true);
    p.classList.add("layer-name-editable");
    p.focus();

    simulateInput(65, true, false, false);

    isRenamingLayer = true;
}

function getMenuEntryIndex(list, entry) {
    for (let i=0; i<list.length; i++) {
        if (list[i] === entry) {
            return i;
        }
    }

    return -1;
}

// Finds a layer given its name
function getLayerByName(name) {
    for (let i=0; i<layers.length; i++) {
        if (layers[i].menuEntry != null) {
            if (layers[i].menuEntry.getElementsByTagName("p")[0].innerHTML == name) {
                return layers[i];
            }
        }
    }

    return null;
}

// Finds a layer given its id
function getLayerByID(id) {
    for (let i=0; i<layers.length; i++) {
        if (layers[i].menuEntry != null) {
            if (layers[i].menuEntry.id == id) {
                return layers[i];
            }
        }
    }

    return null;
}

function addLayer(id, saveHistory = true) {
    // layers.length - 3
    let index = layers.length - 3;
    // Creating a new canvas
    let newCanvas = document.createElement("canvas");
    // Setting up the new canvas
    canvasView.append(newCanvas);
    maxZIndex+=2;
    newCanvas.style.zIndex = maxZIndex;
    newCanvas.classList.add("drawingCanvas");

	if (!layerListEntry) return console.warn('skipping adding layer because no document');

    // Clone the default layer
    let toAppend = layerListEntry.cloneNode(true);
    // Setting the default name for the layer
    toAppend.getElementsByTagName('p')[0].innerHTML = "Layer " + layerCount;
    // Removing the selected class
    toAppend.classList.remove("selected-layer");
    // Adding the layer to the list
    layerCount++;

    // Creating a layer object
    let newLayer = new Layer(currentLayer.canvasSize[0], currentLayer.canvasSize[1], newCanvas, toAppend);
    newLayer.context.fillStyle = currentLayer.context.fillStyle;
    newLayer.copyData(currentLayer);

    layers.splice(index, 0, newLayer);
    
    // Insert it before the Add layer button
    layerList.insertBefore(toAppend, layerList.childNodes[0]);

    if (id != null && typeof(id) == "string") {
        newLayer.setID(id);
    }
    // Basically "if I'm not adding a layer because redo() is telling meto do so", then I can save the history
    if (saveHistory) {
        new HistoryStateAddLayer(newLayer, index);
    }

    return newLayer;
}

/** Saves the layer that is being moved when the dragging starts
 * 
 * @param {*} event 
 */
function layerDragStart(event) {
    dragStartLayer = getLayerByID(layerList.children[event.oldIndex].id);
}

/** Sets the z indexes of the layers when the user drops the layer in the menu
 * 
 * @param {*} event 
 */
function layerDragDrop(event) {
    let oldIndex = event.oldDraggableIndex;
    let newIndex = event.newDraggableIndex;

    let movedZIndex = dragStartLayer.canvas.style.zIndex;

    if (oldIndex > newIndex)
    {
        for (let i=newIndex; i<oldIndex; i++) {
            getLayerByID(layerList.children[i].id).canvas.style.zIndex = getLayerByID(layerList.children[i + 1].id).canvas.style.zIndex;
        }
    }
    else
    {
        for (let i=newIndex; i>oldIndex; i--) {
            getLayerByID(layerList.children[i].id).canvas.style.zIndex = getLayerByID(layerList.children[i - 1].id).canvas.style.zIndex;
        }
    }

    getLayerByID(layerList.children[oldIndex].id).canvas.style.zIndex = movedZIndex;

    dragging = false;
}

layerList = document.getElementById("layers-menu");

// Making the layers list sortable
new Sortable(document.getElementById("layers-menu"), {
    animation: 100,
    filter: ".layer-button",
    draggable: ".layers-menu-entry",
    onStart: layerDragStart,
    onEnd: layerDragDrop
});