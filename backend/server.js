const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const mongoose = require('mongoose'); // Mongoose import kiya
const { GoogleGenAI } = require('@google/genai');
const Analysis = require('./models/Analysis'); // Apna Model import kiya

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch((err) => console.log("MongoDB Connection Error: ", err));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.json({ message: "Resume Analyzer Backend is Running!" });
});

// CORE ROUTE: Analyze Resume with AI
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No resume file uploaded" });
        if (req.file.buffer.length === 0) return res.status(400).json({ error: "File is empty." });

        const jobDescription = req.body.jobDescription;
        if (!jobDescription) return res.status(400).json({ error: "Job description is required" });

        console.log(`Sending PDF directly to Gemini AI...`);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `
        Act as an expert Applicant Tracking System (ATS).
        I have attached a Resume (PDF) and here is the Job Description:
        "${jobDescription}"

        Analyze the attached resume against the JD. Extract technical skills, compare them, and provide a match score.
        Return ONLY a valid JSON object (no extra text, no markdown backticks) with this exact structure:
        {
          "skills": ["skill1", "skill2"],
          "matched_keywords": ["keyword1"],
          "missing_keywords": ["keyword2"],
          "match_score": 85
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                { inlineData: { data: req.file.buffer.toString("base64"), mimeType: "application/pdf" } }
            ],
        });

        let aiResultText = response.text;
        aiResultText = aiResultText.replace(/```json/gi, "").replace(/```/g, "").trim();
        
        try {
            const finalData = JSON.parse(aiResultText);
            
            // 🚀 DATABASE MEIN SAVE KARNE KA LOGIC
            const newAnalysis = new Analysis({
                jobDescription: jobDescription,
                skills: finalData.skills,
                matched_keywords: finalData.matched_keywords,
                missing_keywords: finalData.missing_keywords,
                match_score: finalData.match_score
            });

            await newAnalysis.save();
            console.log("Data saved to MongoDB!");

            // Client ko response return kar diya
            res.json({ success: true, data: finalData, db_id: newAnalysis._id });
            
        } catch (parseError) {
            console.error("Failed to parse AI response:", aiResultText);
            res.status(500).json({ error: "AI returned invalid format" });
        }

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: `Server failed: ${error.message}` });
    }
});

// GET ROUTE: Fetch Past History
app.get('/api/history', async (req, res) => {
    try {
        // Aakhiri 5 records layenge, latest pehle (sort by createdAt: -1)
        const history = await Analysis.find().sort({ createdAt: -1 }).limit(5);
        res.json({ success: true, data: history });
    } catch (error) {
        console.error("History fetch error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});