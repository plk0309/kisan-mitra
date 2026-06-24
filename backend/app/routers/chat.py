from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
from rag.retriever import retriever
from app.services.config import settings
import json

router = APIRouter(prefix="/chat", tags=["chat"])
client = Groq(api_key=settings.GROQ_API_KEY)

SYSTEM_PROMPT = """You are Kisan Mitra (किसान मित्र), a helpful agriculture assistant for Indian farmers, especially wheat farmers in Uttar Pradesh.

Rules:
- Answer in simple Hindi mixed with English (Hinglish) that farmers can understand
- Be specific and practical — give exact quantities, timings, and product names
- Always mention safety warnings when discussing pesticides or chemicals
- If you don't know something, say so clearly — never guess about dosages
- Keep answers concise — farmers are busy people
- Use the provided context to answer. If context doesn't cover the question, use your general knowledge but mention it
- For government schemes, always mention where to apply (website or office)

Context from knowledge base:
{context}"""

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

class ChatResponse(BaseModel):
    response: str
    sources: list[str]

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    relevant_chunks = retriever.retrieve(request.message, top_k=5)
    context = "\n\n".join([
        f"[Source: {c['source']}]\n{c['text']}"
        for c in relevant_chunks
    ])
    sources = list(set([c["source"] for c in relevant_chunks]))

    messages = [{"role": "system", "content": SYSTEM_PROMPT.format(context=context)}]
    for msg in request.history[-6:]:
        messages.append(msg)
    messages.append({"role": "user", "content": request.message})

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        max_tokens=1024,
        temperature=0.3,
    )

    answer = response.choices[0].message.content
    return ChatResponse(response=answer, sources=sources)

@router.post("/stream")
async def chat_stream(request: ChatRequest):
    relevant_chunks = retriever.retrieve(request.message, top_k=5)
    context = "\n\n".join([
        f"[Source: {c['source']}]\n{c['text']}"
        for c in relevant_chunks
    ])

    messages = [{"role": "system", "content": SYSTEM_PROMPT.format(context=context)}]
    for msg in request.history[-6:]:
        messages.append(msg)
    messages.append({"role": "user", "content": request.message})

    def generate():
        stream = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=1024,
            temperature=0.3,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                token = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")