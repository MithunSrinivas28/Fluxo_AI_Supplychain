
# Fluxo — Project Context

## Stack
- Frontend: MERN + TypeScript
- Backend: Python FastAPI (RAG microservice)
- LLM: Groq API with LLaMA 3
- Data: 44,928 rows supply chain CSV, pandas-based retrieval

## Rules
- Always type-hint Python functions
- Prefer async FastAPI routes
- Never modify data ingestion pipeline without confirming
- Keep RAG retrieval logic in /services/rag.py
- Use conventional commits (feat:, fix:, chore:)

## Do NOT
- Install new packages without asking
- Touch docker-compose.yml without confirming
- Refactor working code unless asked
