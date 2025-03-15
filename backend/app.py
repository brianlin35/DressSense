# backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import os

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from frontend (Next.js)

AWS_REGION = "us-east-1"
S3_BUCKET = "dresssense-bucket-jorge"

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)

@app.route("/upload", methods=["POST"])
def upload_file():
    """Handles file uploads to S3."""
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    file_key = f"user-uploads/{file.filename}"

    try:
        s3_client.upload_fileobj(file, S3_BUCKET, file_key)
        file_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{file_key}"
        return jsonify({"message": "Upload successful", "url": file_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/list", methods=["GET"])
def list_files():
    try:
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix="user-uploads/")
        files = []
        if "Contents" in response:
            files = [
                f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{obj['Key']}"
                for obj in response["Contents"]
            ]
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/")
def home():
    return "Hello from Flask!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
