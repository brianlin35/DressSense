from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import boto3
import os
import io
from rembg import remove  # Remove image background
import json

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

# Configure SQLAlchemy with SQLite (for prototyping)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///clothing.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# AWS S3 Configuration
AWS_REGION = "us-east-1"
S3_BUCKET = "dresssense-bucket-jorge"

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)

# Define a database model for a clothing item
class ClothingItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    s3_url = db.Column(db.String, nullable=False)
    category = db.Column(db.String)
    type = db.Column(db.String)
    brand = db.Column(db.String)
    size = db.Column(db.String)
    style = db.Column(db.String)
    color = db.Column(db.String)
    material = db.Column(db.String)
    fitted_market_value = db.Column(db.String)

    def to_dict(self):
        return {
            "id": self.id,
            "s3_url": self.s3_url,
            "category": self.category,
            "type": self.type,
            "brand": self.brand,
            "size": self.size,
            "style": self.style,
            "color": self.color,
            "material": self.material,
            "fitted_market_value": self.fitted_market_value,
        }

# Create the database tables (do this once)
with app.app_context():
    db.create_all()

# Placeholder recognition function (replace with your actual model inference)
def run_recognition(image_path) -> dict:
    # In a real scenario, you'd run your model inference here.
    # For now, return dummy metadata.
    return {
        "category": "Top",
        "type": "T-Shirt",
        "brand": "BrandX",
        "size": "M",
        "style": "Casual",
        "color": "Black",
        "material": "Cotton",
        "fitted_market_value": "$50"
    }

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        return jsonify({"error": "Only image files are allowed"}), 400

    file_key = f"user-uploads/{file.filename}"

    try:
        # Read image bytes and remove background
        input_bytes = file.read()
        output_bytes = remove(input_bytes)
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

        # Optionally, save the file temporarily to disk to run recognition
        # Here we assume rembg processed bytes are in output_bytes.
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as temp_file:
            temp_file.write(output_bytes)

        # Run your recognition model to extract features
        metadata = run_recognition(temp_path)
        os.remove(temp_path)  # Clean up temp file

        # Save the result to the database
        clothing_item = ClothingItem(
            s3_url=file_url,
            category=metadata.get("category"),
            type=metadata.get("type"),
            brand=metadata.get("brand"),
            size=metadata.get("size"),
            style=metadata.get("style"),
            color=metadata.get("color"),
            material=metadata.get("material"),
            fitted_market_value=metadata.get("fitted_market_value")
        )
        db.session.add(clothing_item)
        db.session.commit()

        # Return the S3 URL and metadata as response
        response_data = clothing_item.to_dict()
        response_data["message"] = "Upload successful"
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/list", methods=["GET"])
def list_files():
    try:
        # For simplicity, we fetch from the database rather than directly listing S3 objects.
        items = ClothingItem.query.all()
        items_list = [item.to_dict() for item in items]
        return jsonify({"files": items_list})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete", methods=["POST"])
def delete_file():
    data = request.get_json()
    url = data.get("url", "")
    if not url or "amazonaws.com/" not in url:
        return jsonify({"error": "Invalid S3 URL"}), 400

    key = url.split(".com/")[-1]
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
        # Also remove from database
        item = ClothingItem.query.filter_by(s3_url=url).first()
        if item:
            db.session.delete(item)
            db.session.commit()
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    @app.route("/update", methods=["POST"])
    def update_item():
        data = request.get_json()
        item_id = data.get("id")
        if not item_id:
            return jsonify({"error": "No item ID provided"}), 400

        # Extract new metadata
        category = data.get("category", "")
        type_ = data.get("type", "")
        brand = data.get("brand", "")
        size = data.get("size", "")
        style = data.get("style", "")
        color = data.get("color", "")
        material = data.get("material", "")
        fitted_market_value = data.get("fitted_market_value", "")

        # Find the record in the DB
        item = ClothingItem.query.get(item_id)
        if not item:
            return jsonify({"error": "Item not found"}), 404

        # Update fields
        item.category = category
        item.type = type_
        item.brand = brand
        item.size = size
        item.style = style
        item.color = color
        item.material = material
        item.fitted_market_value = fitted_market_value

        # Commit changes
        db.session.commit()

        return jsonify(item.to_dict()), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
