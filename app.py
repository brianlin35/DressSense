from flask import Flask, render_template, request, jsonify
import boto3
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load AWS credentials
load_dotenv('.env.local')

app = Flask(__name__)

# AWS Configuration
AWS_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
S3_REGION = os.environ.get("AWS_REGION", "us-east-1")
S3_BUCKET = os.environ.get("AWS_BUCKET_NAME")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=S3_REGION
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    """Handles image uploads to S3 and returns the public URL."""
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "No file selected"}), 400

    filename = secure_filename(file.filename)
    try:
        # Upload file to S3
        s3.upload_fileobj(
            file,
            S3_BUCKET,
            filename,
            ExtraArgs={"ContentType": file.content_type}
        )
        # Construct public S3 URL
        file_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"
        return jsonify({"status": "success", "url": file_url})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/list-images', methods=['GET'])
def list_images():
    """Retrieves all images from S3 and returns their URLs."""
    try:
        response = s3.list_objects_v2(Bucket=S3_BUCKET)
        if 'Contents' not in response:
            return jsonify({"images": []})

        image_urls = [
            f"https://{S3_BUCKET}.s3.amazonaws.com/{item['Key']}"
            for item in response['Contents']
        ]
        return jsonify({"images": image_urls})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
