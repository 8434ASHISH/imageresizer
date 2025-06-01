const { jsPDF } = window.jspdf;

let originalImage = null;
let resizedImage = null;

document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.addEventListener('change', previewImage);
});

// Toggle KB input visibility
function toggleKBInput() {
    const kbRadio = document.querySelector('input[value="kb"]');
    const kbInput = document.querySelector('.kb-input');
    kbInput.style.display = kbRadio.checked ? 'block' : 'none';
    if (!kbRadio.checked) {
        document.getElementById('kbValue').value = '';
    }
}

// Image preview functionality
function previewImage() {
    const fileInput = document.getElementById('imageUpload');
    const preview = document.getElementById('imagePreview');
    const fileInfo = document.getElementById('fileInfo');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage = new Image();
            originalImage.onload = function() {
                preview.src = e.target.result;
                preview.style.display = 'block';
                fileInfo.textContent = `${file.name}<br>${(file.size / 1024).toFixed(2)} KB<br>${originalImage.width}×${originalImage.height} pixels`;
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Optimized image resizing function
function resizeImage() {
    const resizeType = document.querySelector('input[name="resizeType"]:checked').value;
    const aspectRatio = document.getElementById('aspectRatio').checked;
    let widthPx = parseInt(document.getElementById('widthPx').value) || originalImage.width;
    let heightPx = parseInt(document.getElementById('heightPx').value) || originalImage.height;
    const kbValue = parseInt(document.getElementById('kbValue').value);
    const outputFormat = document.querySelector('input[name="outputFormat"]:checked').value;
    const preview = document.getElementById('imagePreview');
    const resultInfo = document.getElementById('resultInfo');
    const pdfOption = document.getElementById('pdfOption');

    if (!originalImage) {
        alert('Please upload an image first!');
        return;
    }

    if (resizeType === 'kb' && (!kbValue || kbValue < 1)) {
        alert('Please enter a valid KB value!');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (resizeType === 'pixels') {
        // Maintain aspect ratio if checkbox is checked
        if (aspectRatio) {
            const originalRatio = originalImage.width / originalImage.height;
            if (widthPx && !heightPx) {
                heightPx = Math.round(widthPx / originalRatio);
            } else if (heightPx && !widthPx) {
                widthPx = Math.round(heightPx * originalRatio);
            } else if (widthPx && heightPx) {
                // Use the dimension that would make the image smaller to avoid stretching
                const targetRatio = widthPx / heightPx;
                if (originalRatio > targetRatio) {
                    heightPx = Math.round(widthPx / originalRatio);
                } else {
                    widthPx = Math.round(heightPx * originalRatio);
                }
            }
        }

        // Set canvas dimensions
        canvas.width = widthPx;
        canvas.height = heightPx;

        // High-quality downscaling
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    } 
    else if (resizeType === 'kb') {
        // Start with original dimensions and adjust quality
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

        let quality = 0.95; // Start with high quality
        let step = 0.05; // Smaller steps for more precision
        let dataURL;
        let iterations = 0;
        const maxIterations = 20; // Safety limit

        // Binary search approach for better performance
        let low = 0.1;
        let high = 1.0;
        let bestQuality = quality;
        let bestSize = Infinity;

        while (iterations < maxIterations) {
            dataURL = canvas.toDataURL(`image/${outputFormat}`, quality);
            const currentSizeKB = dataURL.length / 1024;
            
            // Track the closest match that doesn't exceed target
            if (currentSizeKB <= kbValue * 1.05 && currentSizeKB > bestSize) {
                bestSize = currentSizeKB;
                bestQuality = quality;
            }
            
            if (currentSizeKB > kbValue) {
                high = quality;
                quality = (low + high) / 2;
            } else {
                low = quality;
                quality = (low + high) / 2;
            }
            
            // Break if we're close enough
            if (Math.abs(currentSizeKB - kbValue) < kbValue * 0.05) {
                break;
            }
            
            iterations++;
        }

        // Use the best quality found
        if (bestSize !== Infinity) {
            dataURL = canvas.toDataURL(`image/${outputFormat}`, bestQuality);
        }

        resizedImage = dataURL;
        preview.src = resizedImage;
        resultInfo.textContent = `Resized to ${Math.round(dataURL.length / 1024)} KB (target: ${kbValue} KB)`;
        resultInfo.style.display = 'block';
        pdfOption.style.display = 'block';
        return;
    }

    // For pixel resizing
    resizedImage = canvas.toDataURL(`image/${outputFormat}`, 0.95); // High quality
    preview.src = resizedImage;
    resultInfo.textContent = `Resized to ${canvas.width}x${canvas.height} pixels (${Math.round(resizedImage.length / 1024)} KB)`;
    resultInfo.style.display = 'block';
    pdfOption.style.display = 'block';
}

// Convert to PDF function
function convertToPDF() {
    if (!resizedImage) {
        alert('Please resize an image first!');
        return;
    }

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
    });
    
    const img = new Image();
    img.src = resizedImage;
    
    img.onload = () => {
        // Calculate dimensions to fit A4 page (210x297mm) with margins
        const maxWidth = 190; // 190mm width (210 - 10mm margins)
        const maxHeight = 277; // 277mm height (297 - 10mm margins)
        
        let width = img.width * 0.264583; // Convert pixels to mm (96dpi)
        let height = img.height * 0.264583;
        
        // Maintain aspect ratio while fitting to page
        if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
        }
        
        if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = width * ratio;
        }
        
        // Center the image on the page
        const x = (210 - width) / 2;
        const y = (297 - height) / 2;
        
        doc.addImage(img, 'JPEG', x, y, width, height);
        doc.save('resized_image.pdf');
    };
}

// Download resized image
function downloadImage() {
    if (!resizedImage) {
        alert('Please resize an image first!');
        return;
    }
    const format = document.querySelector('input[name="outputFormat"]:checked').value;
    const link = document.createElement('a');
    link.href = resizedImage;
    link.download = `resized_image.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download PDF function
function downloadPDF() {
    convertToPDF();
}
