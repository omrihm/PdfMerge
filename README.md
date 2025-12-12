# PDF Merger - Internal Tool

A client-side web application for merging multiple PDF files into one document, running entirely in the browser without uploading files to any server.

## Features

- **Fully Client-Side**: All processing happens in your browser - no files are uploaded to any server
- **Simple Interface**: Drag and drop or click to select PDF files
- **File Management**:
  - View selected files with names and sizes
  - Reorder files using drag and drop
  - Remove individual files
  - Clear all files
- **Merge Options**:
  - Specify output filename
  - Merge all files in the displayed order
- **Security**: No external dependencies except for the pdf-lib library loaded from CDN
- **Responsive Design**: Works on desktop browsers (Chrome, Edge, Safari)

## How to Use

1. Open the application in a browser (Chrome, Edge, or Safari)
2. Drag and drop PDF files onto the drop zone or click to browse
3. Review the selected files in the list
4. Reorder files if needed using drag handles
5. Enter desired output filename (defaults to "merged.pdf")
6. Click "Merge PDFs" to combine all files
7. Download the merged PDF when complete

## Technical Details

### Architecture
- Built with vanilla HTML, CSS, and JavaScript
- Uses [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation (client-side)
- No backend or server components
- All processing happens in the browser

### Browser Support
- Chrome (latest)
- Edge (latest)
- Safari (macOS) - with graceful degradation
- Firefox (tested)

### Limitations
- Maximum total file size: 100MB
- Only PDF files are accepted
- Requires JavaScript to be enabled
- Large files may take some time to process depending on browser performance

### Privacy & Security
- No files are uploaded to any server
- No analytics or tracking
- All operations occur locally in your browser
- No external dependencies except for pdf-lib from CDN

## Running Locally

To run this application locally:

1. Clone or download the repository
2. Serve the files using any static web server:
   ```bash
   # Using Python (if available)
   python -m http.server 8000
   
   # Or using Node.js with http-server
   npx http-server
   
   # Or using PHP (if available)
   php -S localhost:8000
   ```

3. Open your browser to `http://localhost:8000`

## Deployment

This application can be deployed to any static web hosting service:
- GitHub Pages
- Netlify
- AWS S3 Static Website Hosting
- Any web server capable of serving static files

Simply upload the `index.html`, `styles.css`, and `app.js` files to your hosting service.

## Extensibility

The application is built with extensibility in mind. Future enhancements could include:
- Splitting PDFs by page range
- Rotating pages
- Compressing PDFs
- Adding watermarks
- Password protection