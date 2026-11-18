# RAG Agent (Node)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and add your free API key
3. Put your catalog PDF at `data/products.pdf`
4. `npm start` then open http://localhost:3000

## API
- `POST /ask`   body: `{ "message": "add bluetooth in cart", "history": [] }`  -> `{ answer, toolsUsed }`
- `GET  /cart`  -> `{ items, total, count }`

Cart is stored in `data/cart.xlsx` (created automatically).
The PDF index is cached in `data/rag-index.json` and rebuilt when the PDF changes.

## Structure
- src/rag.js    PDF -> chunks -> local embeddings -> similarity search
- src/cart.js   Excel read/write
- src/tools.js  tool descriptions + the real functions
- src/agent.js  model call + tool loop
- src/server.js endpoints
