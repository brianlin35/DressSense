import os
import torch
from qwen_vl_utils import process_vision_info
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
from flask import Flask, request, jsonify

MODEL_DIR = os.environ.get("MODEL_DIR", "/opt/ml/model")
model = Qwen2_5_VLForConditionalGeneration.from_pretrained(MODEL_DIR, torch_dtype=torch.float16, device_map="auto")
processor = AutoProcessor.from_pretrained(MODEL_DIR)

SYSTEM_PROMPT = """
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
- Additional Notes (2-3 sentences describing the overall aesthetic of the piece and its essence)

Your descriptions should be professional and detailed enough to help a recommendation system that suggests outfit combinations based on occasion, style, and weather.
Format your response in JSON with the attribute name as the key and the corresponding description as the value.
"""

app = Flask(__name__)

@app.route("/invocations", methods=["POST"])
def predict():
    # Expecting multipart/form-data with 'image' field
    if "image" not in request.files:
        return jsonify({"error": "Missing image"}), 400

    image_file = request.files["image"]

    # Save image temporarily (or process in-memory)
    image_path = "/tmp/input_image"
    image_file.save(image_path)

    # Build messages: system prompt, then user image
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image_path}
            ],
        },
    ]

    # Preparation for inference
    text = processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    image_inputs, video_inputs = process_vision_info(messages)
    inputs = processor(
        text=[text],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    )
    inputs = inputs.to(model.device)

    # Inference: Generation of the output
    generated_ids = model.generate(**inputs, max_new_tokens=512)
    generated_ids_trimmed = [
        out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
    ]
    output_text = processor.batch_decode(
        generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
    )

    return jsonify({"generated_text": output_text[0]})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)