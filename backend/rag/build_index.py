import os
import json
import pickle
import fitz  # PyMuPDF
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

CHUNK_SIZE = 400
CHUNK_OVERLAP = 50
DATA_DIR = Path("../data")
MODELS_DIR = Path("../models")
PROCESSED_DIR = DATA_DIR / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def chunk_text(text: str, source: str) -> list[dict]:
    words = text.split()
    chunks = []
    i = 0
    chunk_id = 0
    while i < len(words):
        chunk_words = words[i:i + CHUNK_SIZE]
        chunk_text = " ".join(chunk_words)
        if len(chunk_text.strip()) > 50:
            chunks.append({
                "id": f"{source}_{chunk_id}",
                "text": chunk_text,
                "source": source
            })
            chunk_id += 1
        i += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks

def build_index_from_pdfs(pdf_folder: str):
    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    all_chunks = []
    pdf_dir = Path(pdf_folder)

    pdf_files = list(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDFs found in {pdf_folder}")
        print("Creating a sample knowledge base for testing...")
        all_chunks = get_sample_chunks()
    else:
        for pdf_path in pdf_files:
            print(f"Processing: {pdf_path.name}")
            text = extract_text_from_pdf(str(pdf_path))
            chunks = chunk_text(text, pdf_path.stem)
            all_chunks.extend(chunks)
            print(f"  -> {len(chunks)} chunks extracted")

    print(f"\nTotal chunks: {len(all_chunks)}")
    print("Generating embeddings...")

    texts = [c["text"] for c in all_chunks]
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)
    embeddings = np.array(embeddings).astype("float32")

    faiss.normalize_L2(embeddings)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    index_path = MODELS_DIR / "faiss_agri.index"
    metadata_path = MODELS_DIR / "faiss_metadata.pkl"
    chunks_path = PROCESSED_DIR / "chunks.jsonl"

    faiss.write_index(index, str(index_path))

    with open(metadata_path, "wb") as f:
        pickle.dump(all_chunks, f)

    with open(chunks_path, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print(f"\nIndex saved to {index_path}")
    print(f"Metadata saved to {metadata_path}")
    print(f"Total vectors indexed: {index.ntotal}")

def get_sample_chunks() -> list[dict]:
    sample_data = [
        {"id": "wheat_1", "source": "wheat_guide", "text": "Wheat is the most important rabi crop in India. It is sown in October-November and harvested in March-April. Major wheat growing states are Uttar Pradesh, Punjab, Haryana, Madhya Pradesh and Rajasthan."},
        {"id": "wheat_2", "source": "wheat_guide", "text": "Wheat requires cool weather during growing season and warm dry weather at the time of ripening. The ideal temperature for wheat germination is 20-25 degrees Celsius. It requires 50-75 cm annual rainfall."},
        {"id": "wheat_3", "source": "wheat_guide", "text": "Popular wheat varieties in UP include HD-2967, HD-3086, PBW-343, GW-322, and K-307. HD-2967 is highly resistant to yellow rust and gives yield of 45-50 quintals per hectare under irrigated conditions."},
        {"id": "wheat_4", "source": "wheat_guide", "text": "Wheat requires 4-6 irrigations. First irrigation called crown root irrigation should be given 20-25 days after sowing. Second irrigation at tillering stage 40-45 days. Third at jointing stage 60-65 days. Fourth at flowering stage 80-85 days."},
        {"id": "wheat_5", "source": "wheat_guide", "text": "For wheat crop nitrogen phosphorus potassium fertilizer recommendation is 120:60:40 kg per hectare. Apply full dose of phosphorus and potassium at sowing time. Apply nitrogen in three splits - half at sowing, quarter at first irrigation, quarter at second irrigation."},
        {"id": "wheat_6", "source": "disease_guide", "text": "Yellow rust or stripe rust of wheat is caused by Puccinia striiformis. Symptoms are yellow colored stripes on leaves. It appears in cool and moist weather conditions. Spray Propiconazole 25 EC at 0.1 percent or Tebuconazole 250 EW at 0.1 percent to control yellow rust."},
        {"id": "wheat_7", "source": "disease_guide", "text": "Brown rust or leaf rust of wheat is caused by Puccinia triticina. Orange brown pustules appear on leaves. It spreads rapidly in warm humid conditions. Use resistant varieties like HD-2967. Spray Mancozeb 75 WP at 2 gram per liter of water."},
        {"id": "wheat_8", "source": "disease_guide", "text": "Loose smut of wheat is caused by Ustilago tritici. Infected ears turn into black powdery mass. Use treated seeds with Carboxin 75 WP at 2 gram per kg seed or Vitavax at 2.5 gram per kg seed for prevention."},
        {"id": "wheat_9", "source": "pest_guide", "text": "Termite is a major pest of wheat in UP. They cut roots and stems of young plants. Apply Chlorpyriphos 20 EC at 3 liters per hectare in irrigation water. Treat seeds with Imidacloprid 600 FS at 2 ml per kg seed before sowing."},
        {"id": "wheat_10", "source": "pest_guide", "text": "Aphids attack wheat crop at milky stage. They suck sap from leaves and spike. Spray Dimethoate 30 EC at 1 liter per hectare or Imidacloprid 17.8 SL at 150 ml per hectare when infestation crosses economic threshold level."},
        {"id": "pmkisan_1", "source": "pm_kisan", "text": "PM-KISAN scheme provides income support of 6000 rupees per year to all farmer families. Amount is paid in three equal installments of 2000 rupees each. Farmers need Aadhaar card, land records and bank account to register. Register at pmkisan.gov.in or nearest CSC center."},
        {"id": "pmkisan_2", "source": "pm_kisan", "text": "PM Fasal Bima Yojana PMFBY provides crop insurance to farmers at very low premium. For rabi crops like wheat farmer pays only 1.5 percent of sum insured as premium. Remaining premium is paid by government. Apply through bank or online at pmfby.gov.in before crop sowing."},
        {"id": "kcc_1", "source": "kcc_guide", "text": "Kisan Credit Card KCC provides short term credit to farmers for crop cultivation expenses. Credit limit is fixed based on land holding and crop. Interest rate is 7 percent per annum. Farmers get 3 percent interest subvention making effective rate 4 percent. Apply at any nationalized bank or cooperative bank."},
        {"id": "soil_1", "source": "soil_guide", "text": "Soil health card scheme provides information about nutrient status of farm soil. It gives recommendations for fertilizers and soil amendments. Farmers should get soil tested every 2 years. Collect soil sample from 0-20 cm depth from 8-10 different spots in field and mix well."},
        {"id": "msp_1", "source": "msp_guide", "text": "Minimum Support Price MSP for wheat in 2024-25 is 2275 rupees per quintal. Government procures wheat through FCI and state agencies. Farmers can sell wheat at procurement centers after registering on UP agriculture portal upagripardarshi.gov.in."},
    ]
    return sample_data

if __name__ == "__main__":
    build_index_from_pdfs("../data/raw")