import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY environment variable");
}

export const groq = new Groq({ apiKey });

export const groqModel = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
