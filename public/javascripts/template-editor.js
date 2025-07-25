// Initialize the Fabric.js canvas with selection enabled
const canvas = new fabric.Canvas("canvas", {
  selection: true, // Enable selection of objects on the canvas
});

// Default fonts to populate dropdowns
const defaultFonts = [
  "Arial",
  "Courier New",
  "Georgia",
  "Times New Roman",
  "Verdana",
];

// Function to populate template selector dynamically
function populateTemplates() {
  const dropdown = $("#templateSelector");
  dropdown.empty(); // Clear existing options
  for (let i = 1; i <= 40; i++) {
    const option = `<option value="/templates/${i}.png">Template ${i}</option>`;
    dropdown.append(option);
  }

  // Auto-preview template when selection changes
  dropdown.on("change", function () {
    const selectedTemplate = $(this).val();
    $("#templatePreview").html(
      `<img src="${selectedTemplate}" alt="Template Preview" style="width: 100px; height: auto;">`
    );
  });

  // Set default selection
  dropdown.val("/templates/1.png").trigger("change");
}

// Function to load and populate font selectors
function populateFontSelectors() {
  fetch("/template-editor/get-fonts") // Fetch fonts from server
    .then((response) => response.json())
    .then((fonts) => {
      fonts.forEach((font) => {
        loadFont(font.name, font.url);
        addFontOption(font.name);
      });
    })
    .catch(() => {
      // Fallback to default fonts if API fails
      defaultFonts.forEach((font) => addFontOption(font));
    });
}

// Load font dynamically
function loadFont(fontName, fontUrl) {
  const style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = `
      @font-face {
        font-family: '${fontName}';
        src: url('${fontUrl}');
      }
    `;
  document.head.appendChild(style);
}

// Add font to dropdown selectors
function addFontOption(fontName) {
  const option = `<option value="${fontName}" style="font-family: ${fontName};">${fontName}</option>`;
  $("#nameFontSelector, #detailsFontSelector").append(option);
}

// Update font preview
function updateFontPreview(selector, previewId) {
  const selectedFont = $(selector).val();
  $(previewId).css("font-family", selectedFont).text("Preview");
}

// Load a selected template onto the canvas
function loadTemplate(templatePath) {
  fabric.Image.fromURL(templatePath, function (bgImg) {
    const templateWidth = bgImg.width;
    const templateHeight = bgImg.height;

    resizeCanvas(templateWidth, templateHeight);

    bgImg.scaleToWidth(canvas.width);
    bgImg.scaleToHeight(canvas.height);
    canvas.setBackgroundImage(bgImg, canvas.renderAll.bind(canvas));
  });
}

// Resize canvas while maintaining aspect ratio
function resizeCanvas(templateWidth, templateHeight) {
  const maxWidth = window.innerWidth * 0.9;
  const maxHeight = window.innerHeight * 0.8;

  let newWidth = maxWidth;
  let newHeight = (newWidth * templateHeight) / templateWidth;

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = (newHeight * templateWidth) / templateHeight;
  }

  canvas.setWidth(newWidth);
  canvas.setHeight(newHeight);
  canvas.renderAll();
}

// Load default template on page load
$(document).ready(function () {
  populateTemplates();
  populateFontSelectors();

  // Load default template on startup
  loadTemplate($("#templateSelector").val());

  // Template change listener
  $("#loadTemplate").on("click", function () {
    loadTemplate($("#templateSelector").val());
  });

  // Font preview update on change
  $("#nameFontSelector, #detailsFontSelector").on("change", function () {
    updateFontPreview(this, `#${this.id}Preview`);
  });
});

// Add text with selected font and color
$("#addDetails").on("click", function () {
  const selectedFont = $("#detailsFontSelector").val() || "Arial";
  const selectedColor = $("#colorPicker").val();
  const text = new fabric.IText("Text", {
    left: 40,
    top: 100,
    fontFamily: selectedFont,
    fill: selectedColor,
  });
  canvas.add(text);
});

// Upload and add image to canvas
$("#imageLoader").on("change", function (e) {
  const reader = new FileReader();
  reader.onload = function (event) {
    fabric.Image.fromURL(event.target.result, function (img) {
      img.scaleToWidth(canvas.getWidth() / 4);
      canvas.add(img);
    });
  };
  reader.readAsDataURL(e.target.files[0]);
});

// Toggle free drawing mode
$("#draw").on("click", function () {
  canvas.isDrawingMode = !canvas.isDrawingMode;
  $(this).text(canvas.isDrawingMode ? "Disable Free Draw" : "Enable Free Draw");
  canvas.freeDrawingBrush.color = $("#colorPicker").val();
});

// Remove selected object
$("#remove").on("click", function () {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    canvas.remove(activeObject);
  } else {
    alert("Please select an object to remove.");
  }
});

// High-resolution PNG export
function saveCanvas(highQuality = true, redirectUrl = "/certificate") {
  const scaleFactor = highQuality ? 4 : 1;
  const dataUrl = canvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: scaleFactor,
  });
  const byteString = atob(dataUrl.split(",")[1]);
  const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    arrayBuffer[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([arrayBuffer], { type: mimeString });

  // Send data to backend
  const formData = new FormData();
  formData.append("image", blob, "output.png");
  formData.append("templateName", $("#templateSelector").val());

  fetch("/template-editor/save-png", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.text())
    .then(() => {
      window.location.href = redirectUrl;
    })
    .catch((error) => console.error("Error saving PNG:", error));
}

$("#savePng").on("click", function () {
  saveCanvas(true, "/multiple-certificate");
});

$("#SingleCer").on("click", function () {
  saveCanvas(true, "/single-certificate");
});

// Handle object selection and enable/disable remove button
canvas.on("selection:created", function () {
  $("#remove").prop("disabled", false);
});

canvas.on("selection:cleared", function () {
  $("#remove").prop("disabled", true);
});
// Fix for canvas stretching issues
window.addEventListener("load", function () {
  // This ensures the canvas maintains proper aspect ratio
  const canvas = document.getElementById("canvas");
  const canvasContainer = document.querySelector(".canvas-container");

  // Remove any overflow styles that might be causing scrollbars
  if (canvasContainer) {
    canvasContainer.style.overflow = "visible";
  }

  // Using fabric.js canvas if available
  if (window._canvas) {
    window._canvas.on("after:render", function () {
      canvas.style.width = "auto";
      canvas.style.height = "auto";
    });
  }
});
