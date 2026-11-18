import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { pipeline } from "@xenova/transformers";
import { config } from "./config.js";

let embedder = null;
let index = []; // [{ text, vector }]

async function getEmbedder() {
  if (!embedder) embedder = await pipeline("feature-extraction", config.rag.embedModel);
  return embedder;
}

async function embed(text) {
  const model = await getEmbedder();
  const out = await model(text, { pooling: "mean", normalize: true });
  return Array.from(out.data);
}

// Split PDF text into chunks of roughly chunkSize characters
function chunkText(text, size) {
  const paras = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const p of paras) {
    if ((current + " " + p).length > size && current) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? current + " " + p : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function initRag() {
  const { pdf: pdfPath, ragIndex } = config.paths;
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Products PDF not found at ${pdfPath}. Put your file there.`);
  }
  const mtime = fs.statSync(pdfPath).mtimeMs;

  // Reuse cached index if the PDF has not changed
  if (fs.existsSync(ragIndex)) {
    const cached = JSON.parse(fs.readFileSync(ragIndex, "utf8"));
    if (cached.mtime === mtime) {
      index = cached.chunks;
      console.log(`RAG: loaded ${index.length} chunks from cache`);
      return;
    }
  }

  console.log("RAG: reading PDF and building index (first run downloads the embedding model)...");
  const data = await pdf(fs.readFileSync(pdfPath));
  const chunks = chunkText(data.text, config.rag.chunkSize);
  index = [];
  for (const text of chunks) index.push({ text, vector: await embed(text) });
  fs.writeFileSync(ragIndex, JSON.stringify({ mtime, chunks: index }));
  console.log(`RAG: indexed ${index.length} chunks`);
}

const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0); // vectors are normalized

export async function searchDocs(query, k = config.rag.topK) {
  const q = await embed(query);
  return index
    .map((c) => ({ text: c.text, score: dot(q, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
