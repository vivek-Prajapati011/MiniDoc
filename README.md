# MiniDoc - File Management API

A simple Express.js backend API for file and directory management operations.

## 🚀 Overview

MiniDoc provides REST API endpoints for:
- 📁 **Browse directories** - List files and folders
- 📤 **Upload files** - Store files in the storage directory
- 📥 **Download files** - Retrieve files from storage
- ✏️ **Rename files** - Change file/folder names
- 🗑️ **Delete files** - Remove files and folders

## 🛠️ Tech Stack

- **Node.js** with Express.js framework
- **CORS** enabled for cross-origin requests
- **File System** operations for storage management
- **ES Modules** (import/export syntax)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## 🚀 Getting Started

### Installation

1. Navigate to the MiniDoc directory:
   ```bash
   cd MiniDoc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📚 API Endpoints

### Directory Operations

#### List Root Directory
```http
GET /directory
```
Returns a JSON array of files and folders in the root Storage directory.

**Response:**
```json
[
  {"name": "cat3.png", "isDirectory": false},
  {"name": "images", "isDirectory": true},
  {"name": "document.pdf", "isDirectory": false}
]
```

#### List Subdirectory
```http
GET /directory/:dirname
```
Returns files and folders in the specified subdirectory.

**Example:** `GET /directory/images`

### File Operations

#### Upload File
```http
POST /files/:filename
```
Uploads a file to the storage directory.

**Example:** `POST /files/myfile.txt`

#### Download/View File
```http
GET /files/:filename
```
Downloads or views a file.

**Query Parameters:**
- `action=download` - Forces file download with attachment header

**Example:** `GET /files/image.jpg?action=download`

#### Rename File
```http
PATCH /files/:filename
```
Renames a file or folder.

**Request Body:**
```json
{
  "newFilename": "newname.txt"
}
```

#### Delete File
```http
DELETE /files/:filename
```
Deletes a file or folder (recursively for directories).

## 📁 Project Structure

```
MiniDoc/
├── app.js              # Main Express server
├── Storage/            # File storage directory
│   ├── images/         # Image files
│   ├── cat3.png
│   ├── document.pdf
│   └── video.mp4
├── package.json
└── README.md
```

## 🔧 Configuration

- **Port**: 3000 (default)
- **Storage Path**: `./Storage/` (relative to app.js)
- **CORS**: Enabled for all origins
- **File Upload**: Stream-based for large files

## 💡 Usage Examples

### List directory contents
```bash
curl http://localhost:3000/directory
```

### Upload a file
```bash
curl -X POST -F "file=@example.txt" http://localhost:3000/files/example.txt
```

### Download a file
```bash
curl http://localhost:3000/files/example.txt
```

### Force download
```bash
curl "http://localhost:3000/files/example.txt?action=download"
```

### Rename a file
```bash
curl -X PATCH -H "Content-Type: application/json" \
  -d '{"newFilename":"newname.txt"}' \
  http://localhost:3000/files/example.txt
```

### Delete a file
```bash
curl -X DELETE http://localhost:3000/files/example.txt
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process using port 3000
   npx kill-port 3000
   ```

2. **Storage directory not found**
   - Ensure `Storage/` directory exists in the project root
   - Check file permissions

3. **CORS errors**
   - CORS is enabled by default
   - If issues persist, check client-side configuration

### Error Responses

The API returns appropriate HTTP status codes:
- `200` - Success
- `404` - File/Directory not found
- `500` - Server error

Error response format:
```json
{
  "message": "Error description"
}
```

## 🔄 Development

- Use `npm run dev` for development with nodemon auto-restart
- The server serves files from the `Storage/` directory
- All file operations are relative to the Storage folder
- Supports both files and directories

## 📝 License

ISC

---

## 🎯 Quick Start Summary

1. `npm install` - Install dependencies
2. `npm start` - Start server on port 3000
3. `curl http://localhost:3000/directory` - Test API
4. Upload, download, rename, and delete files via REST endpoints