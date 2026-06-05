class PDFMerger {
    constructor() {
        this.files = [];
        this.maxTotalSize = 100 * 1024 * 1024; // 100MB
        this.draggedIndex = null;

        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.chooseFilesBtn = document.getElementById('chooseFilesBtn');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.outputName = document.getElementById('outputName');
        this.mergeBtn = document.getElementById('mergeBtn');
        this.statusArea = document.getElementById('statusArea');
        this.emptyState = document.getElementById('emptyState');
    }

    bindEvents() {
        // Drop zone: prevent default browser behavior
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        this.dropZone.addEventListener('dragenter', () => this.dropZone.classList.add('drag-over'));
        this.dropZone.addEventListener('dragover', () => this.dropZone.classList.add('drag-over'));
        this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('drag-over'));
        this.dropZone.addEventListener('drop', (e) => this.handleFileDrop(e));

        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.fileInput.click();
            }
        });

        this.chooseFilesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.clearAllBtn.addEventListener('click', () => this.clearAllFiles());
        this.mergeBtn.addEventListener('click', () => this.mergePDFs());

        // Reordering inside file list
        this.fileList.addEventListener('dragstart', (e) => this.handleItemDragStart(e));
        this.fileList.addEventListener('dragover', (e) => this.handleItemDragOver(e));
        this.fileList.addEventListener('dragleave', (e) => this.handleItemDragLeave(e));
        this.fileList.addEventListener('drop', (e) => this.handleItemDrop(e));
        this.fileList.addEventListener('dragend', () => this.handleItemDragEnd());
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileDrop(e) {
        this.dropZone.classList.remove('drag-over');
        const droppedFiles = e.dataTransfer?.files;
        this.processFiles(droppedFiles);
    }

    handleFileSelect(e) {
        const selectedFiles = e.target.files;
        this.processFiles(selectedFiles);
        // Let users re-select the same files
        this.fileInput.value = '';
    }

    processFiles(filesLike) {
        const files = Array.from(filesLike || []);
        if (!files.length) {
            return;
        }

        const pdfFiles = files.filter((file) =>
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );

        const nonPdfCount = files.length - pdfFiles.length;
        if (nonPdfCount > 0) {
            this.showStatus(`Only PDF files are allowed. ${nonPdfCount} file(s) were ignored.`, 'error');
        }

        if (!pdfFiles.length) {
            return;
        }

        for (const file of pdfFiles) {
            this.addFile(file);
        }

        this.updateUI();

        if (pdfFiles.length > 0) {
            this.showStatus(`${pdfFiles.length} file(s) added.`, 'info');
        }
    }

    addFile(file) {
        const exists = this.files.some((f) => f.name === file.name && f.size === file.size);
        if (exists) {
            return;
        }

        this.files.push({
            file,
            name: file.name,
            size: file.size,
            pages: null
        });
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateUI();
        if (!this.files.length) {
            this.clearStatus();
        }
    }

    clearAllFiles() {
        this.files = [];
        this.updateUI();
        this.clearStatus();
    }

    sanitizeOutputFileName() {
        let name = (this.outputName.value || '').trim();
        if (!name) name = 'merged';
        // Remove common invalid path chars
        name = name.replace(/[\\/:*?"<>|]/g, '_');
        if (!name.toLowerCase().endsWith('.pdf')) {
            name += '.pdf';
        }
        this.outputName.value = name;
        return name;
    }

    totalSize() {
        return this.files.reduce((sum, item) => sum + item.size, 0);
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 Bytes';
        const units = ['Bytes', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unit = 0;
        while (value >= 1024 && unit < units.length - 1) {
            value /= 1024;
            unit += 1;
        }
        return `${value.toFixed(value < 10 && unit > 0 ? 2 : 0)} ${units[unit]}`;
    }

    updateUI() {
        const hasFiles = this.files.length > 0;
        const totalSize = this.totalSize();
        const overLimit = totalSize > this.maxTotalSize;

        this.renderFileList();

        this.clearAllBtn.style.display = hasFiles ? 'inline-block' : 'none';
        this.mergeBtn.disabled = !hasFiles || overLimit;

        if (overLimit) {
            this.showStatus('Total file size exceeds 100MB limit. Remove some files and try again.', 'error');
        }
    }

    renderFileList() {
        this.fileList.innerHTML = '';

        if (!this.files.length) {
            const p = document.createElement('p');
            p.id = 'emptyState';
            p.className = 'empty-state';
            p.textContent = 'No files selected yet.';
            this.fileList.appendChild(p);
            return;
        }

        this.files.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'file-item';
            row.draggable = true;
            row.dataset.index = String(index);

            const pages = item.pages ? `${item.pages} pages` : 'Pages: pending';

            row.innerHTML = `
                <div class="drag-handle" aria-hidden="true">⋮⋮</div>
                <div class="file-info">
                    <span class="file-name" title="${this.escapeHtml(item.name)}">${this.escapeHtml(item.name)}</span>
                    <div class="file-details">
                        <span>${this.formatFileSize(item.size)}</span>
                        <span>${pages}</span>
                    </div>
                </div>
                <button type="button" class="remove-btn" aria-label="Remove ${this.escapeHtml(item.name)}" data-index="${index}">×</button>
            `;

            const removeBtn = row.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile(index);
            });

            this.fileList.appendChild(row);
        });
    }

    handleItemDragStart(e) {
        const item = e.target.closest('.file-item');
        if (!item) return;

        this.draggedIndex = Number(item.dataset.index);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
    }

    handleItemDragOver(e) {
        e.preventDefault();
        const item = e.target.closest('.file-item');
        if (item) {
            item.classList.add('drag-over');
        }
        e.dataTransfer.dropEffect = 'move';
    }

    handleItemDragLeave(e) {
        const item = e.target.closest('.file-item');
        if (item) item.classList.remove('drag-over');
    }

    handleItemDrop(e) {
        e.preventDefault();
        const target = e.target.closest('.file-item');
        if (!target || this.draggedIndex === null) return;

        const targetIndex = Number(target.dataset.index);
        if (Number.isNaN(targetIndex) || targetIndex === this.draggedIndex) {
            this.handleItemDragEnd();
            return;
        }

        const [moved] = this.files.splice(this.draggedIndex, 1);
        this.files.splice(targetIndex, 0, moved);

        this.draggedIndex = null;
        this.updateUI();
        this.showStatus('File order updated.', 'info');
    }

    handleItemDragEnd() {
        this.draggedIndex = null;
        this.fileList.querySelectorAll('.file-item').forEach((item) => {
            item.classList.remove('dragging', 'drag-over');
        });
    }

    clearStatus() {
        this.statusArea.textContent = '';
        this.statusArea.className = 'status-area';
        this.statusArea.style.display = 'none';
    }

    showStatus(message, type = 'info') {
        if (!message) {
            this.clearStatus();
            return;
        }

        this.statusArea.textContent = message;
        this.statusArea.className = `status-area ${type}`;
        this.statusArea.style.display = 'block';
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async mergePDFs() {
        if (this.files.length < 1) {
            this.showStatus('Please select at least one PDF file.', 'error');
            return;
        }

        if (this.totalSize() > this.maxTotalSize) {
            this.showStatus('Total file size exceeds 100MB limit.', 'error');
            return;
        }

        this.mergeBtn.disabled = true;
        this.mergeBtn.textContent = 'Merging...';

        try {
            this.showStatus('Processing PDFs...', 'info');

            const mergedPdf = await PDFLib.PDFDocument.create();

            for (const item of this.files) {
                const bytes = await item.file.arrayBuffer();
                const sourcePdf = await PDFLib.PDFDocument.load(bytes);

                item.pages = sourcePdf.getPageCount();

                const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const outputBytes = await mergedPdf.save();
            const blob = new Blob([outputBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const outputName = this.sanitizeOutputFileName();

            const a = document.createElement('a');
            a.href = url;
            a.download = outputName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.updateUI();
            this.showStatus('Your PDFs were merged successfully.', 'success');
        } catch (error) {
            console.error('Error merging PDFs:', error);
            this.showStatus(`Failed to merge PDFs: ${error?.message || 'Unknown error'}`, 'error');
        } finally {
            this.mergeBtn.textContent = 'Merge PDFs';
            this.updateUI();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PDFMerger();
});
