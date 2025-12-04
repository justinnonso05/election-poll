// import fetch from "node-fetch";

// const API_KEY = process.env.GOOGLE_API_KEY;
// if (!API_KEY) {
//   console.error("❌ Missing GOOGLE_API_KEY in environment variables.");
//   process.exit(1);
// }

// // ✅ Use the key in query params, not in Authorization header
// const MODELS_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

// async function listGeminiModels() {
//   try {
//     const response = await fetch(MODELS_URL);
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`HTTP ${response.status}: ${errorText}`);
//     }

//     const data = await response.json();
//     const models = data.models || [];

//     if (models.length === 0) {
//       console.log("⚠️ No models found for your API key.");
//       return;
//     }

//     console.log("\n✅ Available Gemini Models:\n");
//     models.forEach((model) => {
//       const supportsGenerateContent = model.supportedGenerationMethods?.includes("generateContent");
//       console.log(`🧩 Model: ${model.name}`);
//       console.log(`   Display Name: ${model.displayName}`);
//       console.log(`   Description: ${model.description}`);
//       console.log(`   Supports generateContent: ${supportsGenerateContent ? "✅ Yes" : "❌ No"}`);
//       console.log("—".repeat(60));
//     });
//   } catch (err) {
//     console.error("❌ Error fetching model list:", err.message);
//   }
// }

// listGeminiModels();


import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
const emb = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});
const vec = await emb.embedQuery("Student welfare policies and campus development");
console.log(vec.length)

