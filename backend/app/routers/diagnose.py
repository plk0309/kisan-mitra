from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from groq import Groq
from rag.retriever import retriever
from app.services.config import settings
import base64

router = APIRouter(prefix="/diagnose", tags=["diagnose"])
client = Groq(api_key=settings.GROQ_API_KEY)

DISEASE_TREATMENTS = {
    "yellow_rust": {
        "hi": "पीला रतुआ (Yellow Rust) — Propiconazole 25 EC का 0.1% घोल बनाकर छिड़काव करें। 1 लीटर पानी में 1 ml दवाई मिलाएं।",
        "en": "Yellow Rust — Spray Propiconazole 25 EC at 0.1%. Mix 1ml in 1 litre water."
    },
    "brown_rust": {
        "hi": "भूरा रतुआ (Brown Rust) — Mancozeb 75 WP 2 ग्राम प्रति लीटर पानी में मिलाकर छिड़काव करें।",
        "en": "Brown Rust — Spray Mancozeb 75 WP at 2g per litre water."
    },
    "leaf_blight": {
        "hi": "पत्ती झुलसा (Leaf Blight) — Carbendazim 50 WP 1 ग्राम प्रति लीटर पानी में मिलाकर छिड़काव करें।",
        "en": "Leaf Blight — Spray Carbendazim 50 WP at 1g per litre water."
    },
    "healthy": {
        "hi": "फसल स्वस्थ है। नियमित निगरानी जारी रखें।",
        "en": "Crop is healthy. Continue regular monitoring."
    }
}

class DiagnoseResponse(BaseModel):
    disease: str
    disease_hindi: str
    confidence: float
    severity: str
    treatment_hi: str
    treatment_en: str
    is_healthy: bool

@router.post("", response_model=DiagnoseResponse)
async def diagnose(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP images allowed")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Max 5MB.")

    image_data = base64.standard_b64encode(contents).decode("utf-8")
    ext = file.content_type

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{ext};base64,{image_data}"
                            }
                        },
                        {
                            "type": "text",
                            "text": """You are an expert plant pathologist specializing in Indian wheat crops.
Analyze this leaf image and respond ONLY in this exact JSON format, nothing else:
{
  "disease": "yellow_rust|brown_rust|leaf_blight|healthy|unknown",
  "disease_hindi": "रोग का हिंदी नाम",
  "confidence": 0.95,
  "severity": "mild|moderate|severe|none",
  "observation": "Brief observation in English about what you see in the image"
}

Disease guide:
- yellow_rust: Yellow stripes/pustules on leaves, stripe pattern
- brown_rust: Orange-brown circular pustules scattered on leaves  
- leaf_blight: Brown irregular dead patches/lesions on leaves
- healthy: Green healthy leaf with no disease symptoms
- unknown: Cannot determine from image (blurry, not a leaf, etc)"""
                        }
                    ]
                }
            ],
            max_tokens=300,
            temperature=0.1,
        )

        import json, re
        raw = response.choices[0].message.content.strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON in response")

        result = json.loads(json_match.group())
        disease = result.get("disease", "unknown")
        treatment = DISEASE_TREATMENTS.get(disease, {
            "hi": "कृपया नज़दीकी कृषि केंद्र से संपर्क करें।",
            "en": "Please contact your nearest agriculture center."
        })

        return DiagnoseResponse(
            disease=disease,
            disease_hindi=result.get("disease_hindi", "अज्ञात"),
            confidence=float(result.get("confidence", 0.5)),
            severity=result.get("severity", "unknown"),
            treatment_hi=treatment["hi"],
            treatment_en=treatment["en"],
            is_healthy=(disease == "healthy")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")