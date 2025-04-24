import json
import boto3
import logging
import os
import io
import re
import uuid
from PIL import Image  
import base64
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from rembg import remove
from transformers import AutoTokenizer
from botocore.config import Config
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    filename=os.path.join(os.path.dirname(__file__), 'app.log'),
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger()
logger.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)

# Initialize AWS resources
dynamodb = boto3.resource("dynamodb", region_name=os.getenv("AWS_REGION"))
outfits_table = dynamodb.Table('outfits')
clothing_items_table = dynamodb.Table("clothing-items")

s3_client = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

sagemaker_client = boto3.client(
    "sagemaker-runtime",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

bedrock_runtime = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_REGION"),
    config=Config(retries={"max_attempts": 3})
)

def compress_image(image_bytes, max_size=5*1024*1024, quality=85):
    """Compress image to stay under Claude's 5MB limit"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality)
        
        # Reduce quality incrementally if still too large
        while len(output.getvalue()) > max_size and quality > 10:
            quality -= 5
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=quality)
            
        logger.info(f"Compressed image from {len(image_bytes)} to {len(output.getvalue())} bytes")
        return output.getvalue()
    except Exception as e:
        logger.error(f"Error compressing image: {e}")
        return image_bytes  # Fallback to original if compression fails

def run_recognition(temp_file_path, s3_url, product_name) -> dict:
    """
    Calls Claude 3.5 Sonnet with image and text prompt.
    """
    with open(temp_file_path, "rb") as image_file:
        image_bytes = image_file.read()
        
        # NEW: Compress if over 4MB (leave some headroom)
        if len(image_bytes) > 4*1024*1024:
            image_bytes = compress_image(image_bytes)
            
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = f"""
You are a fashion expert and product description generator.
Return ONE JSON object (no code fences, no extra text after the JSON).
The JSON must have exactly this structure:

{{
  "analysis": {{
    "Category": "",
    "Type of clothing": "",
    "Primary Color": "",
    "Accent Color(s)": "",
    "Pattern": "",
    "Shape": "",
    "Fit": "",
    "Neckline": "",
    "Key Design Elements": "",
    "Brand": "",
    "Style": "",
    "Occasion": "",
    "Weather Appropriateness": "",
    "Fabric Material": "",
    "Fabric Weight": "",
    "Functional Features": ""
  }},
  "extra_notes": ""
}}

Notes:
1. "Category" must be one of: Outerwear, Top, Bottom, Footwear.
2. End the response with the final brace.
3. Do not repeat the prompt.
4. Do not include any text outside the JSON object.
    """

    try:
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",  # Changed to jpeg
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt.strip()
                        }
                    ]
                }
            ]
        }

        response = bedrock_runtime.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body)
        )

        result_str = response["body"].read().decode("utf-8")
        result_json = json.loads(result_str)
        generated_text = result_json["content"][0]["text"]

        logger.info(f"Model response:\n{generated_text}")

        # Clean the response by removing any text outside the JSON
        try:
            features = json.loads(generated_text)
            return features
        except json.JSONDecodeError:
            json_start = generated_text.find('{')
            json_end = generated_text.rfind('}') + 1
            if json_start == -1 or json_end == 0:
                logger.error("No valid JSON found in model output.")
                return None  # Changed from empty dict

            json_str = generated_text[json_start:json_end]
            try:
                features = json.loads(json_str)
                return features
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing extracted JSON: {e}")
                return None

    except Exception as e:
        logger.error(f"Error during Claude invocation: {e}")
        return None  # Changed from empty dict

def create_detailed_item_description(item: dict, item_id: str) -> str:
    """Build the short descriptor for each item used in the prompt."""
    # item is the nested analysis from DynamoDB, e.g. item["analysis"]["Category"]
    primary_color = item.get('Primary Color', 'N/A')
    type_of_clothing = item.get('Type of clothing', 'N/A')
    pattern = item.get('Pattern', '')
    style = item.get('Style', '')
    neckline = item.get('Neckline', '')
    accent = item.get('Accent Color(s)', '')
    brand = item.get('Brand', '')

    desc = [f"[Item {item_id}]", f"{primary_color} {type_of_clothing}"]
    if pattern.lower() not in ["solid", "not applicable", "n/a"]:
        desc[1] = f"{pattern} {desc[1]}"
    if style.lower() not in ["not specified", "not applicable", "n/a"]:
        desc.append(f"{style} style")
    if neckline.lower() not in ["not specified", "not applicable", "n/a"]:
        desc.append(f"{neckline} neckline")
    if accent.lower() not in ["not specified", "not applicable", "n/a"]:
        desc.append(f"with {accent} accents")
    if brand.lower() not in ["not specified", "not applicable", "n/a"]:
        desc.append(f"from {brand}")
    return ", ".join(desc)

def create_outfit_recommendation_prompt(clothing_items: list) -> str:
    """
    Build a system prompt from the "analysis" objects in clothing_items.
    Each clothing_item is the parsed JSON from the DB: item["analysis"].
    """
    inventory_by_category = {}
    for idx, analysis in enumerate(clothing_items):
        category = analysis.get("Category", "Unknown")
        if category not in inventory_by_category:
            inventory_by_category[category] = []
        item_description = create_detailed_item_description(analysis, str(idx))
        inventory_by_category[category].append(item_description)

    inventory_text = ""
    for category, items in inventory_by_category.items():
        inventory_text += f"\n{category}:\n"
        for item_line in items:
            inventory_text += f"- {item_line}\n"

    prompt = f"""As a fashion stylist, please create outfit combinations using the following detailed inventory of clothing items. Each item is marked with a unique identifier [Item ###].

AVAILABLE INVENTORY:
{inventory_text}

INSTRUCTIONS:
1. Only recommend items that are explicitly listed in the inventory above.
2. Each outfit should include: at least 1 top, 1 bottom, and 1 footwear (optional outerwear depending on the occasion/weather).
3. The recommendation should follow the JSON format exactly as shown below:
{{
    "Outfit": [item_id numbers],
    "Explanation": "1-2 sentences explaining why this outfit works",
    "Styling Tips": "1-2 sentences on additional styling suggestions"
}}

FORMAT:
- "Outfit": Array of IDs (without the "Item" prefix)
- "Explanation" and "Styling Tips": Concise sentences.

Return only the JSON object with the attribute names as keys. 
Do not include any extra text, markdown formatting, or explanation outside of the JSON.
"""
    return prompt

def parse_rec_response(response_str: str) -> dict:
    """
    Given the model's raw text, extract the "Outfit", "Explanation", and "Styling Tips" fields as JSON.
    """
    outfit_match = re.search(r"\"Outfit\":\s*(\[[^\]]*\])", response_str)
    explanation_match = re.search(r"\"Explanation\":\s*\"([^\"]*)\"", response_str)
    styling_match = re.search(r"\"Styling Tips\":\s*\"([^\"]*)\"", response_str)
    
    if not (outfit_match and explanation_match and styling_match):
        raise ValueError("Invalid response format from recommendation model.")
    
    outfit_ids = json.loads(outfit_match.group(1))
    explanation = explanation_match.group(1)
    styling_tips = styling_match.group(1)
    
    return {
        "outfit": outfit_ids,
        "explanation": explanation,
        "styling": styling_tips
    }

# ------------------------ Endpoints ------------------------
@app.route("/upload", methods=["POST"])
def upload_file():
    files = request.files.getlist("file")
    if not files or len(files) == 0:
        return jsonify({"error": "No file part"}), 400

    for file in files:
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            return jsonify({"error": "Only image files are allowed"}), 400

    provided_name = request.form.get("name", "").strip()
    scan_response = table.scan()
    current_count = len(scan_response.get("Items", []))
    uploaded_items = []

    for index, file in enumerate(files):
        unique_id = str(uuid.uuid4())
        unique_filename = f"{unique_id}_{file.filename}"
        file_key = f"user-uploads/{unique_filename}"

        if not provided_name or provided_name.lower() == "untitled":
            product_name = f"Clothing Piece {current_count + index + 1}"
        else:
            product_name = f"{provided_name} {current_count + index + 1}" if len(files) > 1 else provided_name

        # Process image
        input_bytes = file.read()
        output_bytes = remove(input_bytes)
        output_file = io.BytesIO(output_bytes)
        output_file.seek(0)

        # Upload to S3
        s3_client.upload_fileobj(
            output_file,
            os.getenv("S3_BUCKET"),
            file_key,
            ExtraArgs={
                'ContentType': 'image/jpeg',  # Changed to jpeg
                'ContentDisposition': 'inline'
            }
        )
        s3_url = f"https://{os.getenv("S3_BUCKET")}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{file_key}"
        logger.info(f"Uploaded file to S3: {s3_url}")

        # Create placeholder record
        placeholder_item = {
            "id": unique_id,
            "name": product_name,
            "s3_url": s3_url,
            "category": "pending",
            "type": "pending",
            "brand": "pending",
            "size": "pending",
            "style": "pending",
            "color": "pending",
            "material": "pending",
            "fitted_market_value": "pending",
            "status": "processing",  # Changed from pending
            "processed_at": None,
            "error_message": None
        }
        table.put_item(Item=placeholder_item)

        # Save file temporarily and run image recognition
        temp_path = f"/tmp/{unique_filename}"
        with open(temp_path, "wb") as temp_file:
            temp_file.write(output_bytes)

        metadata = run_recognition(temp_path, s3_url, product_name)
        os.remove(temp_path)

        # NEW: Handle failed processing
        if metadata is None:
            table.update_item(
                Key={"id": unique_id},
                UpdateExpression="SET #st = :status, error_message = :error",
                ExpressionAttributeValues={
                    ":status": "failed",
                    ":error": "Image processing failed - possibly too large"
                },
                ExpressionAttributeNames={"#st": "status"}
            )
            continue  # Skip to next file

        analysis_data = metadata.get("analysis", {})

        # Update record with analysis
        update_expression = (
            "SET #nm = :name, category = :category, #ty = :type, brand = :brand, "
            "size = :size, #sty = :style, color = :color, "
            "material = :material, fitted_market_value = :fitted_market_value, "
            "#st = :status, processed_at = :processed_at, analysis = :analysis"
        )
        expression_attribute_values = {
            ":name": product_name,
            ":category": analysis_data.get("Category", "unknown"),
            ":type": analysis_data.get("Type of clothing", "unknown"),
            ":brand": analysis_data.get("Brand", "unknown"),
            ":size": "N/A",
            ":style": analysis_data.get("Style", "unknown"),
            ":color": analysis_data.get("Primary Color", "unknown"),
            ":material": analysis_data.get("Fabric Material", "unknown"),
            ":fitted_market_value": "N/A",
            ":status": "processed",
            ":processed_at": datetime.now(timezone.utc).isoformat(),
            ":analysis": json.dumps(analysis_data)
        }
        expression_attribute_names = {
            "#nm": "name",
            "#ty": "type",
            "#sty": "style",
            "#st": "status"
        }

        table.update_item(
            Key={"id": unique_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names
        )

        item = table.get_item(Key={"id": unique_id}).get("Item")
        uploaded_items.append(item)

    return jsonify({
        "message": "Upload and classification successful",
        "items": uploaded_items
    })

@app.route("/list", methods=["GET"])
def list_files():
    try:
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
        key = url.split(".com/")[-1]
        s3_client.delete_object(Bucket=os.getenv("S3_BUCKET"), Key=key)
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

    update_expression = "SET "
    expression_attribute_values = {}
    expression_attribute_names = {}
    allowed_fields = ["name", "category", "type", "brand", "size", "style", "color", "material", "fitted_market_value"]

    for field in allowed_fields:
        if field in data:
            if field == "type":
                update_expression += f"#ty = :{field}, "
                expression_attribute_names["#ty"] = "type"
            elif field == "style":
                update_expression += f"#sty = :{field}, "
                expression_attribute_names["#sty"] = "style"
            elif field == "name":
                update_expression += f"#nm = :{field}, "
                expression_attribute_names["#nm"] = "name"
            else:
                update_expression += f"{field} = :{field}, "
            expression_attribute_values[f":{field}"] = data[field]

    update_expression = update_expression.rstrip(", ")

    if update_expression == "SET":
        return jsonify({"error": "No valid fields provided for update."}), 400

    try:
        table.update_item(
            Key={"id": item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names
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

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        data = request.get_json()  
        user_prompt = data.get("user_prompt", "")
        logger.info(f"User prompt received: {user_prompt}")
        
        # Read from ClothingItems
        response = table.scan()
        items = response.get('Items', [])
        logger.info(f"Total items scanned from ClothingItems: {len(items)}")
        
        # Filter items with analysis field
        valid_items = [item for item in items if "analysis" in item]
        logger.info(f"Total valid items (with analysis field): {len(valid_items)}")
        
        # Convert analysis string back to dict
        clothing_items = []
        for vitem in valid_items:
            try:
                analysis_dict = json.loads(vitem["analysis"])
                clothing_items.append(analysis_dict)
            except:
                clothing_items.append({})

        sys_prompt = create_outfit_recommendation_prompt(clothing_items)
        logger.info(f"System prompt created:\n{sys_prompt}")
        
        # Prepare the messages for Claude model
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"{sys_prompt}\n\n{user_prompt}"
                    }
                ]
            }
        ]

        # Prepare the body for Bedrock
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": messages,
            "temperature": 0.7,
            "top_p": 0.9
        }

        # Invoke the Bedrock model
        response = bedrock_runtime.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            body=json.dumps(body)
        )
        
        result = json.loads(response['body'].read().decode())
        generated_text = result["content"][0]["text"]
        logger.info(f"Generated text from model: {generated_text}")

        try:
            rec_output = parse_rec_response(generated_text)
        except Exception as parse_error:
            logger.error(f"Error parsing recommendation output: {str(parse_error)}")
            logger.error("Full generated text for debugging:")
            logger.error(generated_text)
            return jsonify({"error": "Invalid response format from recommendation model."}), 500

        logger.info(f"Parsed recommendation output: {rec_output}")
        
        # Map numeric indices to actual items
        resolved_outfit_urls = []
        if "outfit" in rec_output and isinstance(rec_output["outfit"], list):
            for idx in rec_output["outfit"]:
                logger.info(f"Processing index: {idx}")
                if isinstance(idx, int) and idx < len(valid_items):
                    s3_url = valid_items[idx]["s3_url"]
                    logger.info(f"Resolved index {idx} to S3 URL: {s3_url}")
                    resolved_outfit_urls.append(s3_url)
                else:
                    logger.error(f"Index {idx} out of range; total valid items: {len(valid_items)}")
            rec_output["outfit"] = resolved_outfit_urls
        else:
            logger.error("Recommendation output does not contain a valid 'outfit' array.")
            return jsonify({"error": "Invalid recommendation output from model."}), 500

        return jsonify(rec_output)

    except Exception as e:
        logger.error(f"Error in /recommend endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/save-outfit', methods=['POST'])
def save_outfit():
    data = request.get_json()
    print("Saving outfit:", data)

    try:
        item = {
            "id": str(data.get("id", str(uuid.uuid4()))),
            "images": data["images"],
            "prompt": data["prompt"],
            "createdAt": data["createdAt"],
        }
        outfits_table.put_item(Item=item)
        return jsonify({"message": "Outfit saved successfully"}), 200
    except Exception as e:
        print("DynamoDB Error:", e)
        return jsonify({"error": str(e)}), 500
    
@app.route('/list-outfits', methods=['GET'])
def list_outfits():
    try:
        response = outfits_table.scan()
        items = response.get("Items", [])
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
