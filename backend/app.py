import json
import boto3
import logging
import os
import io
import re
import uuid
from datetime import datetime, timezone  # For timestamping
from flask import Flask, request, jsonify
from flask_cors import CORS
from rembg import remove  # For removing image backgrounds
from transformers import LlamaTokenizerFast  # In case you need this later
from transformers import AutoTokenizer  # Fixed: Import AutoTokenizer

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

# DynamoDB configuration – Ensure your table "ClothingItems" exists with primary key "id"
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table("ClothingItems")

# Instantiate the SageMaker Runtime client and the AutoTokenizer once.
sagemaker_client = boto3.client("sagemaker-runtime", region_name=AWS_REGION)
tokenizer = AutoTokenizer.from_pretrained("deepseek-ai/DeepSeek-R1-Distill-Llama-8B", trust_remote_code=True)

# ------------------------ Helper Functions ------------------------

def run_recognition(temp_file_path, s3_url, product_name) -> dict:
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
- Functional Features (e.g., water resistant, moisture-wicking, insulated, etc.)
- How it can be styled (2-3 sentences describing how the piece can be worn)
- Additional Notes (2-3 sentences describing the overall aesthetic of the piece and its essence)

Return ONLY the JSON object with the attribute names as keys.
Image URL: {s3_url}
Product Name: {product_name}
    """
    logger.info(f"Classification prompt:\n{prompt}")

    try:
        response = sagemaker_client.invoke_endpoint(
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
        generated_text = result[0].get('generated_text', '') if isinstance(result, list) else result.get('generated_text', '')
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

def create_detailed_item_description(item: dict, item_id: str) -> str:
    description_parts = [f"[Item {item_id}]", f"{item['Primary Color']} {item['Type of Clothing']}"]
    if item.get('Pattern') not in ["Solid", "Not applicable"]:
        description_parts[1] = f"{item['Pattern']} {description_parts[1]}"
    if item.get('Style') not in ["Not specified", "Not applicable"]:
        description_parts.append(f"{item['Style']} style")
    if item.get('Neckline') not in ["Not specified", "Not applicable"]:
        description_parts.append(f"{item['Neckline']} neckline")
    if item.get('Accent Color(s)') not in ["Not specified", "Not applicable"]:
        description_parts.append(f"with {item['Accent Color(s)']} accents")
    if item.get('Brand') not in ["Not specified", "Not applicable"]:
        description_parts.append(f"from {item['Brand']}")
    return ", ".join(description_parts)

def create_outfit_recommendation_prompt(clothing_items: list) -> str:
    inventory_by_category = {}
    for idx, item in enumerate(clothing_items):
        category = item["Category"]
        if category not in inventory_by_category:
            inventory_by_category[category] = []
        inventory_by_category[category].append(create_detailed_item_description(item, str(idx)))

    inventory_text = ""
    for category, items in inventory_by_category.items():
        inventory_text += f"\n{category}:\n"
        for item in items:
            inventory_text += f"- {item}\n"

    prompt = f"""As a fashion stylist, please create outfit combinations using the following detailed inventory of clothing items. Each item is marked with a unique identifier [Item ###].

AVAILABLE INVENTORY:
{inventory_text}

INSTRUCTIONS:
1. Only recommend items that are explicitly listed in the inventory above.
2. Each outfit should include: at least 1 top, 1 bottom, and 1 footwear (optional outerwear depending on the occasion/weather).
3. The recommendation should follow the JSON format:
{{
    "Outfit": [item_id numbers],
    "Explanation": "1-2 sentences explaining why this outfit works",
    "Styling Tips": "1-2 sentences on additional styling suggestions"
}}

FORMAT:
- "Outfit": Array of IDs (without the "Item" prefix)
- "Explanation" and "Styling Tips": Concise sentences.

Respond with valid JSON.
"""
    return prompt

def parse_rec_response(response_str: str) -> dict:
    outfit_match = re.search(r"\"Outfit\":\s*(\[[^\]]+\])", response_str)
    explanation_match = re.search(r"\"Explanation\":\s*\"([^\"]+)\"", response_str)
    styling_match = re.search(r"\"Styling Tips\":\s*\"([^\"]+)\"", response_str)
    
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
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        return jsonify({"error": "Only image files are allowed"}), 400

    unique_id = str(uuid.uuid4())
    unique_filename = f"{unique_id}_{file.filename}"
    file_key = f"user-uploads/{unique_filename}"

    try:
        user_input_name = request.form.get("name")
        if not user_input_name:
            scan_response = table.scan()
            current_count = len(scan_response.get("Items", []))
            product_name = f"Clothing Piece {current_count + 1}"
        else:
            product_name = user_input_name

        input_bytes = file.read()
        output_bytes = remove(input_bytes)
        output_file = io.BytesIO(output_bytes)
        output_file.seek(0)

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
        logger.info(f"Uploaded file to S3: {s3_url}")

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
            "status": "pending",
            "processed_at": None,
            "error_message": None
        }
        table.put_item(Item=placeholder_item)
        logger.info(f"Created placeholder record: {json.dumps(placeholder_item)}")

        temp_path = f"/tmp/{unique_filename}"
        with open(temp_path, "wb") as temp_file:
            temp_file.write(output_bytes)

        metadata = run_recognition(temp_path, s3_url, product_name)
        os.remove(temp_path)

        update_expression = (
            "SET #nm = :name, category = :category, #ty = :type, brand = :brand, "
            "size = :size, #sty = :style, color = :color, "
            "material = :material, fitted_market_value = :fitted_market_value, "
            "#st = :status, processed_at = :processed_at"
        )
        expression_attribute_values = {
            ":name": product_name,
            ":category": metadata.get("Category", "unknown"),
            ":type": metadata.get("Type of clothing", "unknown"),
            ":brand": metadata.get("Brand", "unknown"),
            ":size": "N/A",
            ":style": metadata.get("Style", "unknown"),
            ":color": metadata.get("Primary Color", "unknown"),
            ":material": metadata.get("Fabric Material", "unknown"),
            ":fitted_market_value": "N/A",
            ":status": "processed",
            ":processed_at": datetime.now(timezone.utc).isoformat()
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
        logger.info(f"Updated record {unique_id} with classification results.")

        updated_item = table.get_item(Key={"id": unique_id}).get("Item")
        return jsonify({
            "message": "Upload and classification successful",
            "item": updated_item
        })

    except Exception as e:
        logger.error(f"Error in /upload: {str(e)}")
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
        s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
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
        data = request.get_json()  # Expecting {'user_prompt': '...'}
        user_prompt = data.get("user_prompt", "")
        logger.info(f"User prompt received: {user_prompt}")
        
        # Use a separate DynamoDB table for recommendations if desired.
        dynamodb_rec = boto3.resource('dynamodb', region_name=AWS_REGION)
        rec_table = dynamodb_rec.Table("recommendation-test")
        response = rec_table.scan()
        items = response.get('Items', [])
        logger.info(f"Total items scanned from recommendation-test: {len(items)}")
        
        # Filter items to only those with an "analysis" field so that ordering is preserved.
        valid_items = [item for item in items if "analysis" in item]
        logger.info(f"Total valid items (with analysis field): {len(valid_items)}")
        
        clothing_items = [json.loads(item["analysis"]) for item in valid_items]
        
        sys_prompt = create_outfit_recommendation_prompt(clothing_items)
        logger.info(f"System prompt created:\n{sys_prompt}")
        
        const_messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        def build_chat_prompt(messages):
            # Use Python's .upper() method
            return "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in messages])
        
        text = build_chat_prompt(const_messages)
        logger.info(f"Built chat prompt:\n{text}")
        
        payload = {
            "inputs": text,
            "parameters": {
                "max_new_tokens": 1024,
                "do_sample": True,
                "temperature": 0.7
            }
        }
        
        model_response = sagemaker_client.invoke_endpoint(
            EndpointName="endpoint-quick-start-kag8m",
            ContentType="application/json",
            Body=json.dumps(payload)
        )
        result = json.loads(model_response['Body'].read())
        generated_text = result.get("generated_text", "")
        logger.info(f"Generated text from model: {generated_text}")

        try:
            rec_output = parse_rec_response(generated_text)
        except Exception as parse_error:
            logger.error(f"Error parsing recommendation output: {str(parse_error)}")
            logger.error("Full generated text for debugging:")
            logger.error(generated_text)
            return jsonify({"error": "Invalid response format from recommendation model."}), 500

        logger.info(f"Parsed recommendation output: {rec_output}")
        
        # Map numeric indices returned by the model to actual S3 URLs using the valid_items order.
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
