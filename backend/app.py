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

# Constants
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
ATTRIBUTE_KEYS = [
    "category",
    "type",
    "brand",
    "size",
    "style",
    "color",
    "material",
    "fitted_market_value",
    "accent_colors",
    "pattern",
    "shape",
    "fit",
    "neckline",
    "key_design_elements",
    "occasion_suitability",
    "weather_appropriateness",
    "fabric_weight",
    "functional_features",
    "additional_notes"
]

# DynamoDB field definitions
DYNAMO_FIELDS = [
    ("#nm", "name", ":name", "name"),
    ("#category", "category", ":category", "category"),
    ("#ty", "type", ":type", "type"),
    ("#br", "brand", ":brand", "brand"),
    ("#size", "size", ":size", "size"),
    ("#sty", "style", ":style", "style"),
    ("#pr", "color", ":primary_color", "color"),
    ("#mat", "material", ":material", "material"),
    ("#st", "status", ":status", "status"),
    ("#processed_at", "processed_at", ":processed_at", "processed_at"),
    ("#ac", "accent_colors", ":accent_colors", "accent_colors"),
    ("#pat", "pattern", ":pattern", "pattern"),
    ("#sh", "shape", ":shape", "shape"),
    ("#fit", "fit", ":fit", "fit"),
    ("#nl", "neckline", ":neckline", "neckline"),
    ("#kde", "key_design_elements", ":key_design_elements", "key_design_elements"),
    ("#oc", "occasion_suitability", ":occasion_suitability", "occasion_suitability"),
    ("#wa", "weather_appropriateness", ":weather_appropriateness", "weather_appropriateness"),
    ("#fw", "fabric_weight", ":fabric_weight", "fabric_weight"),
    ("#ff", "functional_features", ":functional_features", "functional_features"),
    ("#an", "additional_notes", ":additional_notes", "additional_notes"),
]

# Helper to build update_expression, attribute names, and values
def build_dynamo_update(metadata, product_name):
    update_parts = []
    names = {}
    values = {}

    for abv, full, val_key in DYNAMO_FIELDS:
        update_parts.append(f"{abv} = {val_key}")
        names[abv] = full
        if val_key == ":name":
            values[val_key] = product_name
        elif val_key == ":status":
            values[val_key] = "processed"
        elif val_key == ":processed_at":
            from datetime import datetime, timezone
            values[val_key] = datetime.now(timezone.utc).isoformat()
        else:
            values[val_key] = metadata.get(full, "unknown")

    update_expression = "SET " + ", ".join(update_parts)
    return update_expression, names, values

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
    """
    Compress an image to ensure it stays under a specified size limit (default 5MB).

    Args:
        image_bytes (bytes): The original image in bytes.
        max_size (int, optional): Maximum allowed image size in bytes. Defaults to 5MB.
        quality (int, optional): Initial JPEG quality. Defaults to 85.

    Returns:
        bytes: Compressed image in JPEG format.
    """
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

def run_recognition(temp_file_path):
    """
    Calls the Qwen VL model with the provided image file and returns the recognition result.

    Args:
        temp_file_path (str): Path to the temporary image file.

    Returns:
        dict: Recognition result from the model.
    """
    with open(temp_file_path, "rb") as image_file:
        image_bytes = image_file.read()
        
        # Compress if over MAX_IMAGE_SIZE (leave some headroom)
        if len(image_bytes) > MAX_IMAGE_SIZE:
            image_bytes = compress_image(image_bytes)
            
        # Convert to base64 (expected model input format)
        image_base64 = "data:image;base64," + base64.b64encode(image_bytes).decode("utf-8")

        # Call Qwen VL model
        response = sagemaker_client.invoke_endpoint(
            EndpointName="qwen-inference",
            ContentType="application/json",
            Body=json.dumps({"image": image_base64})
        )
        print("Raw response:", response)

        # Retrieve generate text and log
        generated_text = response["generated_text"]
        logger.info(f"Model response:\n{generated_text}")

        # Parse JSON
        try:
            # Find clean json string
            start_index = generated_text.find("{")
            end_index = generated_text.rfind("}") + 1

            # If no valid json found, return None
            if start_index == -1 or end_index == 0:
                logger.error("No valid JSON found in model output.")
                return None

            # Extract json string
            valid_json_string = generated_text[start_index:end_index]

            # Load json
            features = json.loads(valid_json_string)
            logger.info(f"Extracted features: {features}")

            return features

        except json.JSONDecodeError as e:
            logger.error(f"Error parsing extracted JSON: {e}")
            return None

def create_detailed_item_description(item: dict, item_id: str):
    """
    Builds a detailed description for a clothing item to be used in prompts.

    Args:
        item (dict): Clothing item attributes.
        item_id (str): Unique identifier for the item.

    Returns:
        str: Detailed item description string.
    """
    NULL_ATTRIBUTES = ["Not specified", "Not applicable", "N/A", "pending"]
    
    # Load all needed attributes into variables using ATTRIBUTE_KEYS
    type_of_clothing = item.get('type')
    brand = item.get('brand')
    style = item.get('style')
    color = item.get('color')
    material = item.get('material')
    accent_colors = item.get('accent_colors')
    pattern = item.get('pattern')
    shape = item.get('shape')
    fit = item.get('fit')
    neckline = item.get('neckline')
    key_design_elements = item.get('key_design_elements')
    occasion_suitability = item.get('occasion_suitability')
    weather_appropriateness = item.get('weather_appropriateness')
    fabric_weight = item.get('fabric_weight')
    functional_features = item.get('functional_features')
    additional_notes = item.get('additional_notes')

    # List of attributes to include in the description
    description_parts = []
    
    # Start with the ID reference
    description_parts.append(f"[Item {item_id}]")

    # Basic item description (example: "Striped red t-shirt")
    base_desc = f"{color} {type_of_clothing}"
    if pattern and pattern not in NULL_ATTRIBUTES:
        base_desc = f"{pattern} {base_desc}"
    description_parts.append(base_desc)

    # Add other more detailed attributes if they exist and not null
    if style and style not in NULL_ATTRIBUTES:
        description_parts.append(f"{style} style")

    if material and material not in NULL_ATTRIBUTES:
        material_desc = material
        if fabric_weight and fabric_weight not in NULL_ATTRIBUTES:
            material_desc = f"{fabric_weight} {material_desc}"
        description_parts.append(material_desc)

    if fit and fit not in NULL_ATTRIBUTES:
        description_parts.append(f"{fit} fit")
    
    if neckline and neckline not in NULL_ATTRIBUTES:
        description_parts.append(f"{neckline} neckline")

    if accent_colors and accent_colors not in NULL_ATTRIBUTES:
        description_parts.append(f"with {accent_colors} accents")

    if key_design_elements and key_design_elements not in NULL_ATTRIBUTES:
        description_parts.append(f"featuring {key_design_elements}")

    if functional_features and functional_features not in NULL_ATTRIBUTES:
        description_parts.append(f"({functional_features})")

    if brand and brand not in NULL_ATTRIBUTES:
        description_parts.append(f"from {brand}")

    if shape and shape not in NULL_ATTRIBUTES:
        description_parts.append(f"{shape} shape")

    if occasion_suitability and occasion_suitability not in NULL_ATTRIBUTES:
        description_parts.append(f"suitable for {occasion_suitability}")

    if weather_appropriateness and weather_appropriateness not in NULL_ATTRIBUTES:
        description_parts.append(f"suitable for {weather_appropriateness} weather")

    full_description = ", ".join([part for part in description_parts])

    if additional_notes and additional_notes not in NULL_ATTRIBUTES:
        full_description += "\n    " + f"Additional Notes: {additional_notes}"

    return full_description

def create_outfit_recommendation_prompt(clothing_items: list):
    """
    Builds a system prompt string from a list of clothing items for outfit recommendation.

    Args:
        clothing_items (list): List of clothing item dictionaries.

    Returns:
        str: System prompt for the recommendation model.
    """
    # Group items by category
    inventory_by_category = {} # key: category, value: list of item descriptions strings
    for idx, item in enumerate(clothing_items):
        category = item.get("category", "Unknown")
        if category not in inventory_by_category:
            inventory_by_category[category] = []
        
        # Create detailed description for each item
        item_description = create_detailed_item_description(item, str(idx))
        inventory_by_category[category].append(item_description)

    # Build inventory text. List available items by category
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

def parse_rec_response(response_str: str):
    """
    Parses the raw model response string to extract the 'Outfit', 'Explanation', and 'Styling Tips' fields as JSON.

    Args:
        response_str (str): Raw text response from the recommendation model.

    Returns:
        dict: Parsed fields as a dictionary.
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
    """
    Endpoint to upload a new clothing item image and metadata.
    Accepts multipart/form-data with an image file and item attributes.

    Returns:
        JSON response indicating success or failure, and item information if successful.
    """
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
        s3_url = f"https://{os.getenv('S3_BUCKET')}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{file_key}"
        logger.info(f"Uploaded file to S3: {s3_url}")

        # Create placeholder record
        placeholder_item = {
            "id": unique_id,
            "name": product_name,
            "s3_url": s3_url,
            "status": "processing",
            "processed_at": None,
            "error_message": None,
            "category": "pending",
            "type": "pending",
            "brand": "pending",
            "size": "pending",
            "style": "pending",
            "color": "pending",
            "material": "pending",
            "fitted_market_value": "pending",
            "accent_colors": "pending",
            "pattern": "pending",
            "shape": "pending",
            "fit": "pending",
            "neckline": "pending",
            "key_design_elements": "pending",
            "occasion_suitability": "pending",
            "weather_appropriateness": "pending",
            "fabric_weight": "pending",
            "functional_features": "pending",
            "additional_notes": "pending"
        }

        clothing_item_table.put_item(Item=placeholder_item)

        # Save file temporarily and run image recognition
        temp_path = f"/tmp/{unique_filename}"
        with open(temp_path, "wb") as temp_file:
            temp_file.write(output_bytes)

        metadata = run_recognition(temp_path, s3_url, product_name)
        os.remove(temp_path)

        # NEW: Handle failed processing
        if metadata is None:
            clothing_item_table.update_item(
                Key={"id": unique_id},
                UpdateExpression="SET #st = :status, error_message = :error",
                ExpressionAttributeValues={
                    ":status": "failed",
                    ":error": "Image processing failed - possibly too large"
                },
                ExpressionAttributeNames={"#st": "status"}
            )
            continue  # Skip to next file

        # Update record with analysis
        update_expression = (
            "SET #nm = :name, #category = :category, #ty = :type, #br = :brand, "
            "#size = :size, #sty = :style, #pr = :primary_color, #mat = :material, "
            "#fmv = :fitted_market_value, #st = :status, #processed_at = :processed_at, analysis = :analysis, "
            "#ac = :accent_colors, #pat = :pattern, #sh = :shape, #fit = :fit, #nl = :neckline, "
            "#kde = :key_design_elements, #oc = :occasion_suitability, #wa = :weather_appropriateness, "
            "#fw = :fabric_weight, #ff = :functional_features, #an = :additional_notes"
        )
        expression_attribute_names = {
            "#nm": "name",
            "#category": "category",
            "#ty": "type",
            "#br": "brand",
            "#size": "size",
            "#sty": "style",
            "#pr": "color",
            "#mat": "material",
            "#st": "status",
            "#processed_at": "processed_at",
            "#ac": "accent_colors",
            "#pat": "pattern",
            "#sh": "shape",
            "#fit": "fit",
            "#nl": "neckline",
            "#kde": "key_design_elements",
            "#oc": "occasion_suitability",
            "#wa": "weather_appropriateness",
            "#fw": "fabric_weight",
            "#ff": "functional_features",
            "#an": "additional_notes"
        }
        expression_attribute_values = {
            ":name": product_name,
            ":status": "processed",
            ":processed_at": datetime.now(timezone.utc).isoformat(),
            ":category": metadata.get("category", "unknown"),
            ":type": metadata.get("type", "unknown"),
            ":brand": metadata.get("brand", "unknown"),
            ":style": metadata.get("style", "unknown"),
            ":primary_color": metadata.get("color", "unknown"),
            ":accent_colors": metadata.get("accent_colors", "unknown"),
            ":pattern": metadata.get("pattern", "unknown"),
            ":shape": metadata.get("shape", "unknown"),
            ":fit": metadata.get("fit", "unknown"),
            ":neckline": metadata.get("neckline", "unknown"),
            ":key_design_elements": metadata.get("key_design_elements", "unknown"),
            ":material": metadata.get("material", "unknown"),
            ":occasion_suitability": metadata.get("occasion_suitability", "unknown"),
            ":weather_appropriateness": metadata.get("weather_appropriateness", "unknown"),
            ":fabric_weight": metadata.get("fabric_weight", "unknown"),
            ":functional_features": metadata.get("functional_features", "unknown"),
            ":additional_notes": metadata.get("additional_notes", "unknown")
        }

        clothing_items_table.update_item(
            Key={"clothing-item-id": unique_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
        )

        item = clothing_items_table.get_item(Key={"clothing-item-id": unique_id}).get("Item")
        uploaded_items.append(item)

    return jsonify({
        "message": "Upload and classification successful",
        "items": uploaded_items
    })

@app.route("/list", methods=["GET"])
def list_files():
    """
    Endpoint to list all clothing item files for the current user.

    Returns:
        JSON response with a list of clothing items.
    """
    try:
        response = clothing_item_table.scan()
        items = response.get("Items", [])
        return jsonify({"files": items})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete", methods=["POST"])
def delete_file():
    """
    Endpoint to delete a clothing item by its item_id.

    Returns:
        JSON response indicating success or failure.
    """
    data = request.get_json()
    url = data.get("url", "")
    if not url or "amazonaws.com/" not in url:
        return jsonify({"error": "Invalid S3 URL"}), 400

    try:
        key = url.split(".com/")[-1]
        s3_client.delete_object(Bucket=os.getenv("S3_BUCKET"), Key=key)
        response = clothing_item_table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("s3_url").eq(url)
        )
        items = response.get("Items", [])
        if items:
            for item in items:
                clothing_item_table.delete_item(Key={"clothing-item-id": item["clothing-item-id"]})
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/update", methods=["POST"])
def update_item():
    """
    Endpoint to update the attributes of an existing clothing item.

    Returns:
        JSON response indicating success or failure, and updated item info if successful.
    """
    data = request.get_json()
    item_id = data.get("id")
    if not item_id:
        return jsonify({"error": "No item ID provided"}), 400

    update_expression = "SET "
    expression_attribute_values = {}
    expression_attribute_names = {}
    allowed_fields = ["name"] + ATTRIBUTE_KEYS

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
        clothing_item_table.update_item(
            Key={"clothing-item-id": item_id},
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
    """
    Endpoint to toggle the 'favorite' status of a clothing item.

    Returns:
        JSON response indicating success or failure, and new favorite status.
    """
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
    """
    Endpoint to get outfit recommendations based on user wardrobe and preferences.

    Returns:
        JSON response with recommended outfits, explanations, and styling tips.
    """
    try:
        data = request.get_json()  
        user_prompt = data.get("user_prompt", "")
        logger.info(f"User prompt received: {user_prompt}")
        
        # Read from Clothing Items Table
        response = clothing_item_table.scan()
        items = response.get('Items', [])
        logger.info(f"Total items scanned from Clothing Items Table: {len(items)}")

        # Create outfit recommendation prompt using wardrobe items
        sys_prompt = create_outfit_recommendation_prompt(items)
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
                if isinstance(idx, int) and idx < len(items):
                    s3_url = items[idx]["s3_url"]
                    logger.info(f"Resolved index {idx} to S3 URL: {s3_url}")
                    resolved_outfit_urls.append(s3_url)
                else:
                    logger.error(f"Index {idx} out of range; total valid items: {len(items)}")
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
    """
    Endpoint to save a recommended outfit to the user's saved outfits list.

    Returns:
        JSON response indicating success or failure, and outfit info if successful.
    """
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
    """
    Endpoint to list all saved outfits for the current user.

    Returns:
        JSON response with a list of saved outfits.
    """
    try:
        response = outfits_table.scan()
        items = response.get("Items", [])
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
