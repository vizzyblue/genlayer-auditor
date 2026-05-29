import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it via Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for Auditing Code
app.post("/api/audit", async (req, res) => {
  try {
    const { code, fileName = "UntitledCode" } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Please provide valid code content for analysis" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert security auditor and white-hat security researcher. 
Your goal is to perform a detailed security audit on the submitted code. 
Verify potential security risks, vulnerabilities, and coding flaws. This can include:
- Smart contract vulnerabilities if the code targets solidity, vyper, rust/wasm, python, etc.
- Insecure coding practices (OWASP Top 10, CWE).
- Cryptographic flaws, buffer overflows, SQL injection, XSS, insecure auth, race conditions.
Score the code from 0 (heavily vulnerable) to 100 (fully secure). 
Provide a list of vulnerabilities with line numbers, description, severity, and clear suggestions to fix.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Audit the following code snippet named "${fileName}":\n\n\`\`\`\n${code}\n\`\`\``,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.INTEGER, 
              description: "A security score from 0 to 100, where 100 is fully secure and 0 is heavily compromised" 
            },
            remarks: { 
              type: Type.STRING, 
              description: "General remarks and overall feedback on the quality, security level, and robustness of the code. State what language was detected and a overall security posture summary." 
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                high: { type: Type.INTEGER, description: "Number of High severity vulnerabilities" },
                medium: { type: Type.INTEGER, description: "Number of Medium severity vulnerabilities" },
                low: { type: Type.INTEGER, description: "Number of Low severity vulnerabilities" }
              },
              required: ["high", "medium", "low"]
            },
            vulnerabilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The name or type of the vulnerability" },
                  severity: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
                  category: { type: Type.STRING, description: "Vulnerability category, e.g. Access Control, Cryptography, Overflow, Reentrancy, Input Validation" },
                  line: { type: Type.INTEGER, description: "The estimated line number or starting line where this issue is located (0 if general)" },
                  description: { type: Type.STRING, description: "Detailed explanation of how the vulnerability works and why it is a security risk" },
                  fix: { type: Type.STRING, description: "A suggested corrected safe code block that replaces the vulnerable section" }
                },
                required: ["title", "severity", "category", "line", "description", "fix"]
              }
            }
          },
          required: ["score", "remarks", "summary", "vulnerabilities"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini model returned empty response");
    }

    const auditResult = JSON.parse(text);
    return res.json(auditResult);
  } catch (error: any) {
    console.error("Audit API error:", error);
    return res.status(500).json({ 
      error: "An error occurred while processing the security audit request", 
      details: error.message || error 
    });
  }
});

// Vite middleware for development
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
