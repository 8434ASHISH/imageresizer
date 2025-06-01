document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadContent = document.getElementById('upload-content');
    const fileInfo = document.getElementById('file-info');
    const filename = document.getElementById('filename');
    const filesize = document.getElementById('filesize');
    const originalDimensions = document.getElementById('original-dimensions');
    const imagePreview = document.getElementById('image-preview');
    const changeFile = document.getElementById('change-file');
    const resizeOptions = document.getElementById('resize-options');
    const resizeMethodRadios = document.querySelectorAll('input[name="resize-method"]');
    const pixelsOptions = document.getElementById('pixels-options');
    const kbOptions = document.getElementById('kb-options');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const maintainRatio = document.getElementById('maintain-ratio');
    const targetKbInput = document.getElementById('target-kb');
    const resizeBtn = document.getElementById('resize-btn');
    const convertPdfBtn = document.getElementById('convert-pdf');
    const resultSection = document.getElementById('result-section');
    const resultContainer = document.getElementById('result-container');
    
    // Global variables
    let originalImage = null;
    let originalWidth = 0;
    let originalHeight = 0;
    let originalAspectRatio = 0;
    
    // Event Listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    changeFile.addEventListener('click', resetFileInput);
    
    // Resize method toggle
    resizeMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'pixels') {
                pixelsOptions.classList.remove('hidden');
                kbOptions.classList.add('hidden');
            } else {
                pixelsOptions.classList.add('hidden');
                kbOptions.classList.remove('hidden');
            }
        });
    });
    
    // Maintain aspect ratio logic
    maintainRatio.addEventListener('change', function() {
        if (this.checked && originalAspectRatio) {
            heightInput.value = Math.round(widthInput.value / originalAspectRatio);
        }
    });
    
    widthInput.addEventListener('input', function() {
        if (maintainRatio.checked && originalAspectRatio) {
            heightInput.value = Math.round(this.value / originalAspectRatio);
        }
    });
    
    heightInput.addEventListener('input', function() {
        if (maintainRatio.checked && originalAspectRatio) {
            widthInput.value = Math.round(this.value * originalAspectRatio);
        }
    });
    
    // Resize button
    resizeBtn.addEventListener('click', resizeImage);
    convertPdfBtn.addEventListener('click', convertToPdf);
    
    // Functions
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('border-indigo-500');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('border-indigo-500');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect({ target: fileInput });
        }
    }
    
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPG, PNG, WEBP)');
            return;
        }
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit. Please choose a smaller file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage = new Image();
            originalImage.onload = function() {
                originalWidth = this.width;
                originalHeight = this.height;
                originalAspectRatio = originalWidth / originalHeight;
                
                // Update UI
                filename.textContent = file.name;
                filesize.textContent = formatFileSize(file.size);
                originalDimensions.textContent = `${originalWidth} × ${originalHeight} px`;
                imagePreview.src = event.target.result;
                
                // Set default resize values
                widthInput.value = originalWidth;
                heightInput.value = originalHeight;
                
                // Show file info and options
                uploadContent.classList.add('hidden');
                fileInfo.classList.remove('hidden');
                resizeOptions.classList.remove('hidden');
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    function resetFileInput() {
        fileInput.value = '';
        uploadContent.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        resizeOptions.classList.add('hidden');
        resultSection.classList.add('hidden');
        resultContainer.innerHTML = '';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }
    
    function resizeImage() {
        if (!originalImage) return;
        
        const width = parseInt(widthInput.value) || originalWidth;
        const height = parseInt(heightInput.value) || originalHeight;
        
        // Validate dimensions
        if (width <= 0 || height <= 0) {
            alert('Please enter valid dimensions');
            return;
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0, width, height);
        
        // Get output formats
        const outputFormats = [];
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            outputFormats.push(checkbox.value);
        });
        
        // Clear previous results
        resultContainer.innerHTML = '';
        
        // Process each format
        outputFormats.forEach(format => {
            let mimeType, extension;
            switch(format) {
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    extension = 'jpg';
                    break;
                case 'png':
                    mimeType = 'image/png';
                    extension = 'png';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    extension = 'webp';
                    break;
                default:
                    return;
            }
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL(mimeType, 0.9);
            
            // Create result item
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item bg-gray-50 p-3';
            
            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = `Resized ${format.toUpperCase()}`;
            img.className = 'mb-2';
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'flex justify-between text-sm text-gray-600';
            
            const dimensionsSpan = document.createElement('span');
            dimensionsSpan.textContent = `${width} × ${height} px`;
            
            const formatSpan = document.createElement('span');
            formatSpan.textContent = format.toUpperCase();
            
            const downloadBtn = document.createElement('a');
            downloadBtn.href = dataUrl;
            downloadBtn.download = `resized_${width}x${height}.${extension}`;
            downloadBtn.className = 'mt-2 w-full px-3 py-1 bg-indigo-600 text-white text-center rounded hover:bg-indigo-700';
            downloadBtn.textContent = 'Download';
            
            infoDiv.appendChild(dimensionsSpan);
            infoDiv.appendChild(formatSpan);
            
            resultItem.appendChild(img);
            resultItem.appendChild(infoDiv);
            resultItem.appendChild(downloadBtn);
            
            resultContainer.appendChild(resultItem);
        });
        
        // Show results
        resultSection.classList.remove('hidden');
    }
    
    function convertToPdf() {
        if (!originalImage) return;
        
        alert('PDF conversion would be implemented with a PDF library in a full implementation. This is a placeholder.');
        // In a real implementation, we would use a library like pdf-lib or jsPDF
        // to create a PDF with the image and provide download
    }
    
    // Initialize language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.addEventListener('change', function() {
            // In a full implementation, this would change the UI language
            alert(`Language changed to ${this.options[this.selectedIndex].text}. Full i18n implementation would go here.`);
        });
    }
});
