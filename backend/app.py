import json
import boto3
import logging
import os
import io
import re
import uuid
from datetime import datetime, timezone  # <-- Added timezone here
from flask import Flask, request, jsonify
from flask_cors import CORS
from rembg import remove  # Remove image background

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)

# AWS Configurations
AWS_REGION = "us-east-1"
S3_BUCKET = "dresssense-bucket-jorge"

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# DynamoDB configuration – ensure your table "ClothingItems" exists with primary key "id"
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table("ClothingItems")

def run_recognition(temp_file_path, s3_url) -> dict:
    prompt = f"""
You are a fashion expert and product description generator. Your task is to analyze clothing product images and generate detailed and accurate descriptions. Include the following attributes in your descriptions:
- Category (either Outerwear, Top, Bottom, or Footwear)
- Type of clothing
- Primary Color
- Accent Color(s)
- Pattern
- Shape
- Fit (e.g., slim-fit, oversized, relaxed, etc.)
- Neckline (e.g., Crew, v-neck, scoop, not applicable, etc.)
- Key design elements (describe relevant elements. e.g., buttons, zippers, pleats, embellishments, stitching patterns, etc.)
- Brand (if specified)
- Style (e.g., streetwear, minimalist, athleisure, classic/traditional, etc.)
- Occasion suitability (e.g., casual, formal, sporty, etc.)
- Weather appropriateness (e.g., warm, cold, all-season)
- Fabric Material (e.g., cotton, wool, silk, denim, etc.)
- Fabric Weight
- Functional Features (e.g. water resistant, moisture-wicking, insulated, etc.)
- How it can be styled (2-3 sentences describing how the piece can be worn)
- Additional Notes (2-3 sentences describing the overall aesthetic of the piece and its essence)

Return ONLY the JSON object with the attribute names as keys.
Image URL: {s3_url}
    """
    logger.info(f"Classification prompt:\n{prompt}")

    sagemaker = boto3.client('sagemaker-runtime', region_name=AWS_REGION)
    try:
        response = sagemaker.invoke_endpoint(
            EndpointName='endpoint-quick-start-fywsd',
            ContentType='application/json',
            Accept='application/json',
            Body=json.dumps({
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 512,
                    "temperature": 0.7
                }
            })
        )
        response_body = response['Body'].read().decode()
        logger.info(f"Raw model output: {response_body}")
        result = json.loads(response_body)
        if isinstance(result, list):
            generated_text = result[0].get('generated_text', '')
        else:
            generated_text = result.get('generated_text', '')
        logger.info(f"Model response: {generated_text}")
        try:
            features = json.loads(generated_text)
        except Exception as e:
            logger.error(f"Error parsing JSON: {str(e)}")
            json_match = re.search(r'\{[\s\S]*\}', generated_text)
            if json_match:
                try:
                    features = json.loads(json_match.group())
                except Exception as e2:
                    logger.error(f"Error parsing extracted JSON: {str(e2)}")
                    features = {}
            else:
                features = {}
        return features
    except Exception as e:
        logger.error(f"Error invoking endpoint: {str(e)}")
        return {}

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        return jsonify({"error": "Only image files are allowed"}), 400

    # Generate a unique id and filename
    unique_id = str(uuid.uuid4())
    unique_filename = f"{unique_id}_{file.filename}"
    file_key = f"user-uploads/{unique_filename}"

    try:
        # Read file, remove background, and prepare for S3 upload
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
        s3_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{file_key}"

        # Create a placeholder record in DynamoDB with "pending" status
        placeholder_item = {
            "id": unique_id,
            "s3_url": s3_url,
            "category": "pending",
            "type": "pending",
            "brand": "pending",
            "size": "pending",
            "style": "pending",
            "color": "pending",
            "material": "pending",
            "fitted_market_value": "pending",
            "status": "pending",
            "processed_at": None,
            "error_message": None
        }
        table.put_item(Item=placeholder_item)
        logger.info(f"Created placeholder record: {json.dumps(placeholder_item)}")

        # Optionally, save the file temporarily for recognition
        temp_path = f"/tmp/{unique_filename}"
        with open(temp_path, "wb") as temp_file:
            temp_file.write(output_bytes)

        # Run classification synchronously using the Qwen model endpoint
        metadata = run_recognition(temp_path, s3_url)
        os.remove(temp_path)  # Clean up temporary file

        # Update the DynamoDB record with classification results.
        # Alias reserved keywords: "type" -> "#ty", "style" -> "#sty", "status" -> "#st"
        update_expression = (
            "SET category = :category, #ty = :type, brand = :brand, "
            "size = :size, #sty = :style, color = :color, "
            "material = :material, fitted_market_value = :fitted_market_value, "
            "#st = :status, processed_at = :processed_at"
        )
        expression_attribute_values = {
            ":category": metadata.get("Category", "unknown"),
            ":type": metadata.get("Type of clothing", "unknown"),
            ":brand": metadata.get("Brand", "unknown"),
            ":size": "N/A",  # If size is not provided, default to "N/A"
            ":style": metadata.get("Style", "unknown"),
            ":color": metadata.get("Primary Color", "unknown"),
            ":material": metadata.get("Fabric Material", "unknown"),
            ":fitted_market_value": "N/A",  # If estimated value is not provided, default to "N/A"
            ":status": "processed",
            ":processed_at": datetime.now(timezone.utc).isoformat()  # Using timezone.utc here
        }
        expression_attribute_names = {"#ty": "type", "#sty": "style", "#st": "status"}
        table.update_item(
            Key={"id": unique_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names
        )
        logger.info(f"Updated record {unique_id} with classification results.")

        # Retrieve the updated record to return in the response
        updated_item = table.get_item(Key={"id": unique_id}).get("Item")

        return jsonify({
            "message": "Upload and classification successful",
            "item": updated_item
        })

    except Exception as e:
        logger.error(f"Error in /upload: {str(e)}")
        # If an error occurs, update the record with error status if possible
        try:
            table.update_item(
                Key={"id": unique_id},
                UpdateExpression="SET #st = :status, error_message = :error",
                ExpressionAttributeValues={
                    ":status": "failed",
                    ":error": str(e)
                },
                ExpressionAttributeNames={"#st": "status"}
            )
        except Exception as inner_e:
            logger.error(f"Error updating error status in DynamoDB: {str(inner_e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/list", methods=["GET"])
def list_files():
    try:
        # Scan the entire table (for production, consider pagination)
        response = table.scan()
        items = response.get("Items", [])
        return jsonify({"files": items})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete", methods=["POST"])
def delete_file():
    data = request.get_json()
    url = data.get("url", "")
    if not url or "amazonaws.com/" not in url:
        return jsonify({"error": "Invalid S3 URL"}), 400

    try:
        # Derive the S3 key from the URL
        key = url.split(".com/")[-1]
        # Delete the object from S3
        s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
        # Delete DynamoDB record(s) matching the s3_url (using a scan here)
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("s3_url").eq(url)
        )
        items = response.get("Items", [])
        if items:
            for item in items:
                table.delete_item(Key={"id": item["id"]})
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/update", methods=["POST"])
def update_item():
    data = request.get_json()
    item_id = data.get("id")
    if not item_id:
        return jsonify({"error": "No item ID provided"}), 400

    # Build update expression from allowed fields
    update_expression = "SET "
    expression_attribute_values = {}
    allowed_fields = ["category", "type", "brand", "size", "style", "color", "material", "fitted_market_value"]
    for field in allowed_fields:
        if field in data:
            update_expression += f"{field} = :{field}, "
            expression_attribute_values[f":{field}"] = data[field]
    update_expression = update_expression.rstrip(", ")
    try:
        table.update_item(
            Key={"id": item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )
        updated_item = table.get_item(Key={"id": item_id}).get("Item")
        return jsonify(updated_item), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/favorite", methods=["POST"])
def toggle_favorite():
    data = request.get_json()
    item_id = data.get("id")
    favorite = data.get("favorite")
    if item_id is None or favorite is None:
        return jsonify({"error": "Missing parameters"}), 400
    try:
        table.update_item(
            Key={"id": item_id},
            UpdateExpression="SET favorite = :fav",
            ExpressionAttributeValues={":fav": favorite}
        )
        updated_item = table.get_item(Key={"id": item_id}).get("Item")
        return jsonify(updated_item), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
