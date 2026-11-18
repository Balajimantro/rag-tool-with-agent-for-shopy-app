import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const config = {
  port: process.env.PORT || 3000,
  llm: {
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1",
    model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
  },
  paths: {
    pdf: path.join(root, "data", "products.pdf"),
    ragIndex: path.join(root, "data", "rag-index.json"),
    cart: path.join(root, "data", "cart.xlsx"),
    public: path.join(root, "public"),
  },
  rag: { chunkSize: 500, topK: 4, embedModel: "Xenova/all-MiniLM-L6-v2" },
  maxAgentSteps: 6,
};
