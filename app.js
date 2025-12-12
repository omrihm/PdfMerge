// PDF Merger Application
class PDFMerger {
    constructor() {
        this.files = [];
        this.maxTotalSize = 100 * 1024 * 1024; // 100MB limit
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.fileListContainer = document.getElementById('fileListContainer');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.outputName = document.getElementById('outputName');
        this.mergeBtn = document.getElementById('mergeBtn');
        this.statusArea = document.getElementById('statusArea');
    }

    bindEvents() {
        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.clearAllBtn.addEventListener('click', this.clearAllFiles.bind(this));
        this.mergeBtn.addEventListener('click', this.mergePDFs.bind(this));

        // Enable drag and drop reordering
        this.fileList.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.fileList.addEventListener('dragover', this.handleDragOver.bind(this));
        this.fileList.addEventListener('dragenter', this.handleDragEnter.bind(this));
        this.fileList.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.fileList.addEventListener('drop', this.handleDrop.bind(this));
        this.fileList.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-over');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
    }

    processFiles(files) {
        // Filter only PDF files
        const pdfFiles = Array.from(files).filter(file => 
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );

        // Show error for non-PDF files
        const nonPdfFiles = Array.from(files).filter(file => 
            file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')
        );

        if (nonPdfFiles.length > 0) {
            this.showStatus(`Error: Only PDF files are allowed. ${nonPdfFiles.length} file(s) were ignored.`, 'error');
            return;
        }

        if (pdfFiles.length === 0) {
            this.showStatus('No valid PDF files found.', 'error');
            return;
        }

        // Add files to our list
        pdfFiles.forEach(file => {
            this.addFileToList(file);
        });

        // Update UI
        this.updateFileList();
        this.checkFileSizeLimit();
        
        // Reset the file input to allow selecting the same files again
        // This is a workaround for some browsers that don't trigger change event
        // when the same files are selected consecutively
        setTimeout(() => {
            this.fileInput.value = '';
        }, 10);
    }

    addFileToList(file) {
        // Check if file is already added
        const existingIndex = this.files.findIndex(f => f.name === file.name && f.size === file.size);
        if (existingIndex === -1) {
            this.files.push({
                file: file,
                name: file.name,
                size: file.size,
                pages: null // Will be populated when we read the PDF
            });
        }
    }

    updateFileList() {
        // Clear existing list
        this.fileList.innerHTML = '';

        // Add each file to the list
        this.files.forEach((fileObj, index) => {
            const fileItem = this.createFileItem(fileObj, index);
            this.fileList.appendChild(fileItem);
        });

        // Show/hide clear all button
        this.clearAllBtn.style.display = this.files.length > 0 ? 'inline-block' : 'none';
    }

    createFileItem(fileObj, index) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.setAttribute('draggable', true);
        fileItem.setAttribute('data-index', index);

        // Format file size
        const fileSize = this.formatFileSize(fileObj.size);

        // Get page count if available
        const pageCountText = fileObj.pages ? `(${fileObj.pages} pages)` : '';

        fileItem.innerHTML = `
            <div class="drag-handle">⋮⋮</div>
            <div class="file-info">
                <span class="file-name">${fileObj.name}</span>
                <div class="file-details">
                    <span>${fileSize}</span>
                    <span>${pageCountText}</span>
                </div>
            </div>
            <button class="remove-btn" data-index="${index}">×</button>
        `;

        // Add event listener for remove button
        const removeBtn = fileItem.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFile(index);
        });

        return fileItem;
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
        this.checkFileSizeLimit();
    }

    clearAllFiles() {
        this.files = [];
        this.updateFileList();
        this.showStatus('', 'info');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    checkFileSizeLimit() {
        const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
        
        if (totalSize > this.maxTotalSize) {
            this.showStatus('Warning: Total file size exceeds 50MB limit. Please remove some files.', 'error');
            this.mergeBtn.disabled = true;
        } else {
            this.showStatus('', 'info');
            this.mergeBtn.disabled = false;
        }
    }

    showStatus(message, type) {
        this.statusArea.textContent = message;
        this.statusArea.className = `status-area ${type}`;
        if (message) {
            this.statusArea.style.display = 'block';
        } else {
            this.statusArea.style.display = 'none';
        }
    }

    // Handle drag and drop reordering
    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        const draggedItem = e.target;
        draggedItem.classList.add('dragging');
        e.dataTransfer.setData('text/html', draggedItem.innerHTML);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        const target = e.target.closest('.file-item');
        if (target) {
            target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const target = e.target.closest('.file-item');
        if (target) {
            target.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const target = e.target.closest('.file-item');
        if (!target) return;

        const draggedItem = document.querySelector('.dragging');
        if (!draggedItem) return;

        const draggedIndex = parseInt(draggedItem.getAttribute('data-index'));
        const targetIndex = parseInt(target.getAttribute('data-index'));

        if (draggedIndex !== targetIndex) {
            // Reorder the files array
            const draggedFile = this.files[draggedIndex];
            this.files.splice(draggedIndex, 1);
            this.files.splice(targetIndex, 0, draggedFile);
            
            // Update UI
            this.updateFileList();
        }

        // Remove dragging classes
        draggedItem.classList.remove('dragging');
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    handleDragEnd() {
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('dragging');
            item.classList.remove('drag-over');
        });
    }

    async mergePDFs() {
        if (this.files.length === 0) {
            this.showStatus('Please select at least one PDF file.', 'error');
            return;
        }

        const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > this.maxTotalSize) {
            this.showStatus('Total file size exceeds 50MB limit.', 'error');
            return;
        }

        // Disable merge button during processing
        this.mergeBtn.disabled = true;
        this.mergeBtn.textContent = 'Merging...';

        try {
            // Show processing status
            this.showStatus('Processing PDFs...', 'info');

            // Create a new PDF document
            const pdfDoc = await PDFLib.PDFDocument.create();

            // Process each file in order
            for (const fileObj of this.files) {
                const arrayBuffer = await fileObj.file.arrayBuffer();
                const pdfDocSource = await PDFLib.PDFDocument.load(arrayBuffer);
                
                // Get number of pages for display
                const totalPages = pdfDocSource.getPageCount();
                fileObj.pages = totalPages;

                // Copy pages from source to destination
                const copiedPages = await pdfDoc.copyPages(pdfDocSource, pdfDocSource.getPageIndices());
                copiedPages.forEach(page => {
                    pdfDoc.addPage(page);
                });
            }

            // Save the merged document
            const mergedPdfBytes = await pdfDoc.save();
            
            // Create a blob and trigger download
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = this.outputName.value || 'merged.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Show success message
            this.showStatus('Your PDFs were merged successfully!', 'success');
        } catch (error) {
            console.error('Error merging PDFs:', error);
            this.showStatus('Error: Failed to merge PDFs. ' + (error.message || 'Unknown error'), 'error');
        } finally {
            // Re-enable button
            this.mergeBtn.disabled = false;
            this.mergeBtn.textContent = 'Merge PDFs';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFMerger();
});