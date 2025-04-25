# DressSense Backend APIs

This backend provides endpoints for generating clothing item features, generating outfit recommendations, and managing user wardrobes. Below is a summary of the available API endpoints and their usage.

---

## Table of Contents
- [Setup](#setup)
- [Endpoints](#endpoints)
  - [POST `/upload`](#post-upload)
  - [GET `/list`](#get-list)
  - [POST `/delete`](#post-delete)
  - [POST `/update`](#post-update)
  - [POST `/favorite`](#post-favorite)
  - [POST `/recommend`](#post-recommend)
  - [POST `/save-outfit`](#post-save-outfit)
  - [GET `/list-outfits`](#get-list-outfits)
- [Notes](#notes)

---

## Setup

1. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2. Configure AWS credentials and environment variables in a `.env` file.
3. Run the backend:
    ```bash
    python app.py
    ```

---

## Endpoints

### POST `/upload`
Uploads a new clothing item image and metadata.
- **Request:** `multipart/form-data` with `file` (image) and item attributes.
- **Response:**
  - `200 OK` with JSON containing item info if successful.
  - `400 Bad Request` on error.

### GET `/list`
Lists all clothing items for the current user.
- **Response:**
  - `200 OK` with JSON list of clothing items.

### POST `/delete`
Deletes a clothing item by its `item_id`.
- **Request:** JSON body with `url` or `item_id`.
- **Response:**
  - `200 OK` on success.
  - `400 Bad Request` on error.

### POST `/update`
Updates attributes of an existing clothing item.
- **Request:** JSON body with updated item fields.
- **Response:**
  - `200 OK` with updated item info.
  - `400 Bad Request` on error.

### POST `/favorite`
Toggles the favorite status of a clothing item.
- **Request:** JSON body with `id` and `favorite` (bool).
- **Response:**
  - `200 OK` with new favorite status.

### POST `/recommend`
Gets outfit recommendations based on the user's wardrobe and preferences.
- **Request:** JSON body with `user_prompt` (optional).
- **Response:**
  - `200 OK` with recommended outfits, explanations, and styling tips.

### POST `/save-outfit`
Saves a recommended outfit to the user's saved outfits.
- **Request:** JSON body with outfit details.
- **Response:**
  - `200 OK` on success.

### GET `/list-outfits`
Lists all saved outfits for the current user.
- **Response:**
  - `200 OK` with list of saved outfits.

---

## Notes
- All endpoints return JSON responses.
- Ensure AWS credentials and environment variables are properly set for database and storage access.
- For more details, see the docstrings in `app.py`.
