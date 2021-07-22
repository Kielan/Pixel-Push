var currentMouseEvent;
var lastMouseMovePos;

//mousedown - start drawing
window.addEventListener("mousedown", function (mouseEvent) {
	// Saving the event in case something else needs it
	currentMouseEvent = mouseEvent;
	canDraw = true;

	//if no document has been created yet, or this is a dialog open, or the currentLayer is locked
	if (!documentCreated || Dialogue.isOpen() || currentLayer.isLocked || !currentLayer.isVisible) return;
	//prevent right mouse clicks and such, which will open unwanted menus
	//mouseEvent.preventDefault();

	lastMouseClickPos = getCursorPosition(mouseEvent);

	//left or right click ?
	if (mouseEvent.which == 1) {
		if (Input.spacePressed())
			currentTool = tool.pan;
		else if (mouseEvent.altKey)
			currentTool = tool.eyedropper;
		else if (mouseEvent.target.className == 'drawingCanvas' &&
			(currentTool.name == 'pencil' || currentTool.name == 'eraser' || currentTool.name == 'rectangle' || currentTool.name == 'ellipse' || currentTool.name === 'line'))
		    new HistoryState().EditCanvas();
		else if (currentTool.name == 'moveselection') {
			if (!cursorInSelectedArea() && 
				((mouseEvent.target.id == 'canvas-view') || mouseEvent.target.className == 'drawingCanvas')) {
				tool.pencil.switchTo();
				canDraw = false;
			}
		}		

		if (!currentLayer.isLocked && !currentLayer.isVisible && canDraw) {
			draw(mouseEvent);
		}
	}
	else if (mouseEvent.which == 2) {
		tool.pan.brushSize = currentTool.brushSize;
		currentTool = tool.pan;
	}
	else if (currentTool.name == 'pencil' && mouseEvent.which == 3) {
		currentTool = tool.resizebrush;
		tool.pencil.previousBrushSize = tool.pencil.brushSize;
	}
	else if (currentTool.name == 'eraser' && mouseEvent.which == 3) {
	    currentTool = tool.resizeeraser;
	    tool.eraser.previousBrushSize = tool.eraser.brushSize;
    }
	// TODO: [ELLIPSE] Do we need similar logic related to ellipse?
	else if (currentTool.name == 'rectangle' && mouseEvent.which == 3) {
		currentTool = tool.resizerectangle;
		tool.rectangle.previousBrushSize = tool.rectangle.brushSize;
	}
	else if (currentTool.name == 'line' && mouseEvent.which == 3) {
		currentTool = tool.resizeline;
		tool.line.previousBrushSize = tool.line.brushSize;
	}

	if (currentTool.name == 'eyedropper' && mouseEvent.target.className == 'drawingCanvas')
	    eyedropperPreview.style.display = 'block';

	return false;
}, false);



//mouseup - end drawing
window.addEventListener("mouseup", function (mouseEvent) {
	// Saving the event in case something else needs it
	currentMouseEvent = mouseEvent;

	TopMenuModule.closeMenu();
	
	if (currentLayer != null && !Util.isChildOfByClass(mouseEvent.target, "layers-menu-entry")) {
		currentLayer.closeOptionsMenu();	
	}

	// If the user finished placing down a line, clear the tmp canvas and copy the data to the current layer
	if (currentTool.name === "line") {
		const tmpCanvas = TMPLayer.canvas;
		currentLayer.context.drawImage(tmpCanvas, 0, 0);

		const tmpContext = TMPLayer.context;
		tmpContext.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
	}

	if (!documentCreated || Dialogue.isOpen() || !currentLayer.isVisible || currentLayer.isLocked) return;

	if (currentTool.name == 'eyedropper' && mouseEvent.target.className == 'drawingCanvas') {
		var cursorLocation = getCursorPosition(mouseEvent);
		var selectedColor = getEyedropperColor(cursorLocation);
		const rgbColor = {r:selectedColor[0],g:selectedColor[1],b:selectedColor[2]};
		var newColor = Color.rgbToHex(rgbColor);

		ColorModule.updateCurrentColor('#' + newColor);
		
		let colors = document.getElementsByClassName('color-button');
	    for (let i = 0; i < colors.length; i++) {

	      //if picked color matches this color
	      if (newColor == colors[i].jscolor.toString()) {
	        //remove current color selection
	        let selectedColor = document.querySelector("#colors-menu li.selected")
	        if (selectedColor) selectedColor.classList.remove("selected");

	      	//set current color

			for (let i=2; i<layers.length; i++) {
				layers[i].context.fillStyle = '#' + newColor;
			}

	      	//make color selected
	      	colors[i].parentElement.classList.add('selected');

	        //hide eyedropper
	        eyedropperPreview.style.display = 'none';
	      }
	    }
	}
	else if (currentTool.name == 'fill' && mouseEvent.target.className == 'drawingCanvas') {

		//get cursor postion
		var cursorLocation = getCursorPosition(mouseEvent);

		//offset to match cursor point
		cursorLocation[0] += 2;
		cursorLocation[1] += 12;

    	//fill starting at the location
		fill(cursorLocation);
		currentLayer.updateLayerPreview();
	}
	else if (currentTool.name == 'zoom' && mouseEvent.target.className == 'drawingCanvas') {
		let mode;
		if (mouseEvent.which == 1){
			mode = "in";
        }
    }
    else if (currentTool == 'zoom' && mouseEvent.target.className == 'drawingCanvas') {
        let mode;
        if (mouseEvent.which == 1){
            mode = 'in';
        }
        else if (mouseEvent.which == 3){
            mode = 'out';
        }

        changeZoom(mode, getCursorPosition(mouseEvent));

        for (let i=1; i<layers.length; i++) {
            layers[i].copyData(layers[0]);
        }
	}
	else if (currentTool.name == 'rectselect' && isRectSelecting) {
		endRectSelection(mouseEvent);
	}
	else if (currentTool.name == 'rectangle' && isDrawingRect) {
		endRectDrawing(mouseEvent);
		currentLayer.updateLayerPreview();
	}
	else if (currentTool.name == 'ellipse' && isDrawingEllipse) {
		endEllipseDrawing(mouseEvent);
		currentLayer.updateLayerPreview();
	}

	currentTool = currentToolTemp;

	currentTool.updateCursor();
	var cursorLocation = getCursorPosition(mouseEvent);
	currentTool.moveBrushPreview(cursorLocation);


}, false);

function setPreviewPosition(preview, size){
	let toAdd = 0;

	// This prevents the brush to be placed in the middle of pixels
	if (size % 2 == 0) {
		toAdd = 0.5;
	}

    preview.style.left = (
        currentLayer.canvas.offsetLeft
        + Math.floor(cursor[0]/zoom) * zoom
        - Math.floor(size / 2) * zoom + toAdd
    ) + 'px';
    preview.style.top = (
        currentLayer.canvas.offsetTop
        + Math.floor(cursor[1]/zoom) * zoom
        - Math.floor(size / 2) * zoom + toAdd
    ) + 'px';
}


// OPTIMIZABLE: redundant || mouseEvent.target.className in currentTool ifs

//mouse is moving on canvas
window.addEventListener("mousemove", draw, false);
window.addEventListener("mousedown", draw, false);

function draw (mouseEvent) {
	if (!Dialogue.isOpen())
	{
		lastMouseMovePos = getCursorPosition(mouseEvent);
		// Saving the event in case something else needs it
		currentMouseEvent = mouseEvent;

		var cursorLocation = lastMouseMovePos;

		//if a document hasnt yet been created or the current layer is locked, exit this function
		if (!documentCreated || Dialogue.isOpen() || !currentLayer.isVisible || currentLayer.isLocked) return;

		// Moving brush preview
		currentTool.moveBrushPreview(cursorLocation);
		// Hiding eyedropper, will be shown if it's needed
		eyedropperPreview.style.display = 'none';

		if (currentTool.name == 'pencil') {
			//hide brush preview outside of canvas / canvas view
			if (mouseEvent.target.className == 'drawingCanvas'|| mouseEvent.target.className == 'drawingCanvas')
			brushPreview.style.visibility = 'visible';
			else
			brushPreview.style.visibility = 'hidden';

			//draw line to current pixel
			if (Input.isDragging()) {
				if (mouseEvent.target.className == 'drawingCanvas' || mouseEvent.target.className == 'drawingCanvas') {
					line(Math.floor(lastMouseClickPos[0]/zoom),
						 Math.floor(lastMouseClickPos[1]/zoom),
						 Math.floor(cursorLocation[0]/zoom),
						 Math.floor(cursorLocation[1]/zoom), 
						 tool.pencil.brushSize
					);
					lastMouseClickPos = cursorLocation;
				}
			}

			//get lightness value of color
			var selectedColor = currentLayer.context.getImageData(Math.floor(cursorLocation[0]/zoom),Math.floor(cursorLocation[1]/zoom),1,1).data;
			var colorLightness = Math.max(selectedColor[0],selectedColor[1],selectedColor[2])

			//for the darkest 75% of colors, change the brush preview to dark mode
			if (colorLightness>64) brushPreview.classList.remove('dark');
			else brushPreview.classList.add('dark');

			currentLayer.updateLayerPreview();
		}
		// Decided to write a different implementation in case of differences between the brush and the eraser tool
		else if (currentTool.name == 'eraser') {
			//hide brush preview outside of canvas / canvas view
			if (mouseEvent.target.className == 'drawingCanvas' || mouseEvent.target.className == 'drawingCanvas')
				brushPreview.style.visibility = 'visible';
			else
				brushPreview.style.visibility = 'hidden';

			//draw line to current pixel
			if (Input.isDragging()) {
				if (mouseEvent.target.className == 'drawingCanvas' || mouseEvent.target.className == 'drawingCanvas') {
					line(Math.floor(lastMouseClickPos[0]/zoom),Math.floor(lastMouseClickPos[1]/zoom),Math.floor(cursorLocation[0]/zoom),Math.floor(cursorLocation[1]/zoom), currentTool.brushSize);
					lastMouseClickPos = cursorLocation;
				}
			}

			currentLayer.updateLayerPreview();
		}
		else if (currentTool.name == 'rectangle')
		{
			//hide brush preview outside of canvas / canvas view
			if (mouseEvent.target.className == 'drawingCanvas'|| mouseEvent.target.className == 'drawingCanvas')
			brushPreview.style.visibility = 'visible';
			else
			brushPreview.style.visibility = 'hidden';

			if (!isDrawingRect && Input.isDragging()) {
				startRectDrawing(mouseEvent);
			}
			else if (Input.isDragging()){
				updateRectDrawing(mouseEvent);
			}
		}
		else if (currentTool.name == 'ellipse')
		{
			//hide brush preview outside of canvas / canvas view
			if (mouseEvent.target.className == 'drawingCanvas'|| mouseEvent.target.className == 'drawingCanvas')
			brushPreview.style.visibility = 'visible';
			else
			brushPreview.style.visibility = 'hidden';

			if (!isDrawingEllipse && Input.isDragging()) {
				startEllipseDrawing(mouseEvent);
			}
			else if (Input.isDragging()){
				updateEllipseDrawing(mouseEvent);
			}
		}
		else if (currentTool.name == 'pan' && Input.isDragging()) {
			// Setting first layer position
			layers[0].setCanvasOffset(layers[0].canvas.offsetLeft + (cursorLocation[0] - lastMouseClickPos[0]), layers[0].canvas.offsetTop + (cursorLocation[1] - lastMouseClickPos[1]));
			// Copying that position to the other layers
			for (let i=1; i<layers.length; i++) {
				layers[i].copyData(layers[0]);
			}
			// Updating cursorLocation with new layer position
			lastMouseMovePos = getCursorPosition(mouseEvent);
			cursorLocation = lastMouseMovePos;
			// Moving brush preview
			currentTool.moveBrushPreview(cursorLocation);
		}
		else if (currentTool.name == 'eyedropper' && Input.isDragging() && mouseEvent.target.className == 'drawingCanvas') {

			const selectedColor = getEyedropperColor(cursorLocation);
			const rgbColor = {r:selectedColor[0],g:selectedColor[1],b:selectedColor[2]};
			
			eyedropperPreview.style.borderColor = '#' + Color.rgbToHex(rgbColor);
			eyedropperPreview.style.display = 'block';

			eyedropperPreview.style.left = cursorLocation[0] + currentLayer.canvas.offsetLeft - 30 + 'px';
			eyedropperPreview.style.top = cursorLocation[1] + currentLayer.canvas.offsetTop - 30 + 'px';

			const colorLightness = Math.max(selectedColor[0],selectedColor[1],selectedColor[2]);

			//for the darkest 50% of colors, change the eyedropper preview to dark mode
			if (colorLightness>127) eyedropperPreview.classList.remove('dark');
			else eyedropperPreview.classList.add('dark');
		}
		else if (currentTool.name == 'resizebrush' && Input.isDragging()) {
			//get new brush size based on x distance from original clicking location
			var distanceFromClick = cursorLocation[0] - lastMouseClickPos[0];
			//var roundingAmount = 20 - Math.round(distanceFromClick/10);
			//this doesnt work in reverse...  because... it's not basing it off of the brush size which it should be
			var brushSizeChange = Math.round(distanceFromClick/10);
			var newBrushSize = tool.pencil.previousBrushSize + brushSizeChange;

			//set the brush to the new size as long as its bigger than 1
			tool.pencil.brushSize = Math.max(1,newBrushSize);

			//fix offset so the cursor stays centered
			tool.pencil.moveBrushPreview(lastMouseClickPos);
			currentTool.updateCursor();
		}
		else if (currentTool.name == 'resizeeraser' && Input.isDragging()) {
			//get new brush size based on x distance from original clicking location
			var distanceFromClick = cursorLocation[0] - lastMouseClickPos[0];
			//var roundingAmount = 20 - Math.round(distanceFromClick/10);
			//this doesnt work in reverse...  because... it's not basing it off of the brush size which it should be
			var eraserSizeChange = Math.round(distanceFromClick/10);
			var newEraserSizeChange = tool.eraser.previousBrushSize + eraserSizeChange;

			//set the brush to the new size as long as its bigger than 1
			tool.eraser.brushSize = Math.max(1,newEraserSizeChange);
			
			//fix offset so the cursor stays centered
			tool.eraser.moveBrushPreview(lastMouseClickPos);
			currentTool.updateCursor();
		}
		else if (currentTool.name == 'resizerectangle' && Input.isDragging()) {
			//get new brush size based on x distance from original clicking location
			var distanceFromClick = cursorLocation[0] - lastMouseClickPos[0];
			//var roundingAmount = 20 - Math.round(distanceFromClick/10);
			//this doesnt work in reverse...  because... it's not basing it off of the brush size which it should be
			var rectangleSizeChange = Math.round(distanceFromClick/10);
			// TODO: [ELLIPSE] Do we need similar logic related to ellipse?
			var newRectangleSize = tool.rectangle.previousBrushSize + rectangleSizeChange;

			//set the brush to the new size as long as its bigger than 1
			// TODO: [ELLIPSE] Do we need similar logic related to ellipse?
			tool.rectangle.brushSize = Math.max(1,newRectangleSize);

			//fix offset so the cursor stays centered
			// TODO: [ELLIPSE] Do we need similar logic related to ellipse?
			tool.rectangle.moveBrushPreview(lastMouseClickPos);
			currentTool.updateCursor();
		}
		else if (currentTool.name == 'resizeline' && Input.isDragging()) {
			//get new brush size based on x distance from original clicking location
			var distanceFromClick = cursorLocation[0] - lastMouseClickPos[0];
			//var roundingAmount = 20 - Math.round(distanceFromClick/10);
			//this doesnt work in reverse...  because... it's not basing it off of the brush size which it should be
			var lineSizeChange = Math.round(distanceFromClick/10);
			var newLineSize = tool.line.previousBrushSize + lineSizeChange;

			//set the brush to the new size as long as its bigger than 1
			tool.line.brushSize = Math.max(1, newLineSize);

			//fix offset so the cursor stays centered
			tool.line.moveBrushPreview(lastMouseClickPos);
			currentTool.updateCursor();
		}
		else if (currentTool.name == 'rectselect') {
			if (Input.isDragging() && !isRectSelecting && mouseEvent.target.className == 'drawingCanvas') {
				isRectSelecting = true;
				startRectSelection(mouseEvent);
			}
			else if (Input.isDragging() && isRectSelecting) {
				updateRectSelection(mouseEvent);
			}
			else if (isRectSelecting) {
				endRectSelection();
			}
		}
		else if (currentTool.name == 'moveselection') {
			// Updating the cursor (move if inside rect, cross if not)
			currentTool.updateCursor();

			// If I'm dragging, I move the preview
			if (Input.isDragging() && cursorInSelectedArea()) {
				updateMovePreview(getCursorPosition(mouseEvent));
			}
		}
		else if (currentTool.name === "line") {
			if (mouseEvent.target.className == 'drawingCanvas'|| mouseEvent.target.className == 'drawingCanvas') {
				brushPreview.style.visibility = 'visible';
			} else {
				brushPreview.style.visibility = 'hidden';
			}
			if (Input.isDragging()) {
				if (mouseEvent.target.className == 'drawingCanvas' || mouseEvent.target.className == 'drawingCanvas') {
					diagLine(lastMouseClickPos, zoom, cursorLocation);
				}
			}
			currentLayer.updateLayerPreview();
		}
	}

	if (mouseEvent.target.className == 'drawingCanvas')
		currentTool.updateCursor();
	else
		canvasView.style.cursor = 'default';
}

//mousewheel scroll
canvasView.addEventListener("wheel", function(mouseEvent){
	let mode;
	if (mouseEvent.deltaY < 0){
		mode = 'in';
	}
	else if (mouseEvent.deltaY > 0) {
		mode = 'out';
	}

	// Changing zoom and position of the first layer
	changeZoom(mode, getCursorPosition(mouseEvent));

	for (let i=1; i<layers.length; i++) {
		// Copying first layer's data into the other layers
		layers[i].copyData(layers[0]);
	}
});