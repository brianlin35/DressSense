from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import os
import io
from rembg import remove  # Import the rembg function

app = Flask(__name__)
CORS(app)

# AWS S3 Configuration
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
    # Check if a file is present in the request
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    # Validate that the file is an image by checking its extension
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        return jsonify({"error": "Only image files are allowed"}), 400

    file_key = f"user-uploads/{file.filename}"

    try:
        # Read image bytes from the file
        input_bytes = file.read()
        
        # Remove the background using rembg
        output_bytes = remove(input_bytes)
        
        # Create a BytesIO object from the processed image bytes
        output_file = io.BytesIO(output_bytes)
        output_file.seek(0)

        # Upload the processed image to S3
        s3_client.upload_fileobj(
            output_file,
            S3_BUCKET,
            file_key,
            ExtraArgs={
                'ContentType': file.content_type,
                'ContentDisposition': 'inline'
            }
        )
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

@app.route("/delete", methods=["POST"])
def delete_file():
    data = request.get_json()
    url = data.get("url", "")
    if not url or "amazonaws.com/" not in url:
        return jsonify({"error": "Invalid S3 URL"}), 400

    # Extract the S3 key from the URL (everything after '.com/')
    key = url.split(".com/")[-1]
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
