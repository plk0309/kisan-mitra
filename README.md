# 🌾 Kisan Mitra — AI Agriculture Assistant

An AI-powered agriculture assistant for Indian farmers, built with FastAPI, Next.js, and RAG (Retrieval Augmented Generation).

## Live Features
- 🤖 **RAG Chatbot** — Hindi/English Q&A over ICAR wheat guides, PM-KISAN, PMFBY, KCC schemes
- 🔍 **Disease Detection** — Upload a leaf photo, get disease name + treatment in Hindi
- 💰 **Mandi Prices** — Real-time AGMARKNET prices with MSP comparison for UP mandis

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Python 3.11 |
| LLM | Groq LLaMA 3.1-8B + LLaMA 4 Scout (vision) |
| RAG | FAISS + sentence-transformers (all-MiniLM-L6-v2) + Cohere reranking |
| Frontend | Next.js 14, TypeScript, Framer Motion |
| Deployment | Railway (backend) + Vercel (frontend) |

## Project Structure
kisan-mitra/

├── backend/

│   ├── app/

│   │   ├── routers/       # chat, diagnose, prices

│   │   └── services/      # config

│   ├── rag/               # FAISS index builder + retriever

│   ├── ml/                # disease classification

│   └── main.py

├── frontend/

│   └── app/

│       ├── page.tsx       # chat page

│       ├── diagnose/      # disease detection

│       └── prices/        # mandi prices

└── data/

└── processed/         # chunked knowledge base
## Setup

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python rag/build_index.py
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `backend/.env` and fill in:
- `GROQ_API_KEY` — from console.groq.com
- `COHERE_API_KEY` — from cohere.com

## Roadmap
- [ ] Voice input (faster-whisper STT)
- [ ] WhatsApp bot integration
- [ ] IoT soil sensor dashboard
- [ ] Crop yield prediction
- [ ] Weather advisory