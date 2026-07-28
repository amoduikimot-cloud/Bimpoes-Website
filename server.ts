import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI client server-side
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "Bimpoes Business Ventures API",
      tagline: "...God Cares",
      timestamp: new Date().toISOString(),
    });
  });

  // RFQ / Quotation Submission Endpoint
  app.post("/api/quote-request", (req, res) => {
    const { name, email, phone, facilityName, facilityType, state, items, notes } = req.body;

    if (!name || !email || !facilityName) {
      return res.status(400).json({ error: "Missing required contact or facility information." });
    }

    const referenceId = `BBV-RFQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const estimatedResponseTime = "2 to 4 business hours";

    console.log(`[RFQ Received] ${referenceId} from ${facilityName} (${name})`);

    return res.json({
      success: true,
      referenceId,
      message: `Thank you ${name}. Your Request for Quotation (${referenceId}) has been received by Bimpoes Business Ventures technical sales team.`,
      details: {
        facilityName,
        facilityType,
        state: state || "Lagos",
        itemCount: items ? items.length : 0,
        estimatedResponseTime,
        supportHotline: "+234 803 000 0000 / quotes@bimpoes.com",
      },
    });
  });

  // Biomedical Service Ticket Endpoint
  app.post("/api/service-ticket", (req, res) => {
    const { contactName, phone, facilityName, equipmentName, serialNumber, issueDescription, urgency } = req.body;

    if (!contactName || !phone || !equipmentName || !issueDescription) {
      return res.status(400).json({ error: "Please provide contact name, phone, equipment details, and problem description." });
    }

    const ticketId = `PPM-TKT-${Math.floor(10000 + Math.random() * 90000)}`;

    return res.json({
      success: true,
      ticketId,
      message: `Biomedical Engineering Service Ticket ${ticketId} created successfully.`,
      urgency: urgency || "Standard",
      dispatchNotice: urgency === "Emergency"
        ? "Emergency Biomedical Response Unit dispatched. Engineer will contact you within 30 minutes."
        : "Biomedical Service Representative will schedule inspection within 24 hours.",
    });
  });

  // AI Hospital Planning & Equipment Advisor Endpoint (Gemini 3.6 Flash)
  app.post("/api/advisor", async (req, res) => {
    try {
      const { facilityType, budgetRange, state, specialties, powerSetup, additionalDetails } = req.body;

      if (!facilityType) {
        return res.status(400).json({ error: "Facility type is required." });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: "AI Advisor is temporarily unavailable because GEMINI_API_KEY is not configured.",
        });
      }

      const systemInstruction = `You are the Senior Biomedical Consultant and Hospital Planning Specialist at Bimpoes Business Ventures, Nigeria's leading medical equipment and healthcare solutions provider.
Your slogan is "...God Cares".
Your advice must be highly professional, practical, tailored to Nigerian healthcare infrastructure realities (power stability, room shielding, humidity, warranty, biomedical engineer training, and supply chain).

Provide a structured, beautifully formatted response covering:
1. Executive Facility Overview & Assessment
2. Recommended Core Medical Equipment Package (matching Bimpoes product portfolio: Ultrasound, Digital X-Ray, CT, MRI, ECG, Monitors, Chemistry/Hematology Analyzers, Ventilators, Anesthesia, Operating Tables, Autoclaves, Furniture)
3. Essential Pre-Installation & Biomedical Engineering Requirements (Power UPS/Inverters, HVAC, Radiation Shielding, Floor Reinforcement)
4. Staff Training & Clinical Application Roadmap
5. Phased Implementation Schedule & Maintenance / SLA Strategy

Keep tone confident, authoritative, compassionate, and educational. Format with clean markdown sections, bullet points, and actionable healthcare guidance.`;

      const prompt = `Facility Type: ${facilityType}
Target Location: ${state || "Nigeria"}
Budget Focus: ${budgetRange || "Standard Commercial / Hospital Setup"}
Key Medical Specialties: ${specialties || "General Medicine, Diagnostics & Surgery"}
Power Infrastructure: ${powerSetup || "National Grid + Diesel Generator Backup"}
Additional Facility Notes: ${additionalDetails || "Turnkey setup required with biomedical maintenance support."}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({
        success: true,
        recommendation: response.text,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Gemini Advisor Error:", err);
      return res.status(500).json({
        error: "Failed to generate hospital planning recommendation. " + (err?.message || ""),
      });
    }
  });

  // Vite Middleware for Dev or Static Serving for Prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bimpoes Business Ventures server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
