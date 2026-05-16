# AI Passport Photo Background Removal Backend

Node.js, Express, MongoDB, Mongoose, multer, and Axios backend for removing image backgrounds through the remove.bg API.

## Setup

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Update `.env` with your MongoDB connection and `BG_REMOVE_API_KEY`.

## Endpoint

`POST /api/remove-bg`

Send `multipart/form-data` with one file field named `image`.

Successful response:

```json
{
  "success": true,
  "originalImage": "http://localhost:5000/uploads/example.jpg",
  "processedImage": "http://localhost:5000/output/example.png",
  "jobId": "65...",
  "message": "Background removed successfully"
}
```

## Validation

Allowed formats: `jpg`, `jpeg`, `png`, `webp`.

Default maximum file size: `10MB`, configurable with `MAX_FILE_SIZE_MB`.

Errors are returned as JSON with `success`, `message`, and `code`.
