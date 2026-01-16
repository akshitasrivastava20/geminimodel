import { GoogleGenAI,createUserContent,
  createPartFromUri } from "@google/genai";
import express from "express"
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";


dotenv.config();

const app=express();
const upload=multer({dest:"uploads/"});


app.use(
  cors({
    origin: "*", // allow all origins (OK for testing)
    methods: ["GET", "POST"],
  })
);
app.use(express.json());
// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

app.post("/generate",async(req,res)=>{
    const {prompt}=req.body;
    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  res.json({response:response.text})
})


function extractGeminiJSON(response) {
  // Gemini SDK always returns TEXT, not Response
  const rawText =
    typeof response.text === "function"
      ? response.text()
      : response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Empty Gemini response");
  }

  // Remove markdown code fences
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini raw text:", rawText);
    throw err;
  }
}

app.post("/identify-anime",upload.single("image"),async(req,res)=>{
 try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
const absolutePath = path.resolve(req.file.path);
  const myfile = await ai.files.upload({
    file: absolutePath,
    config: { mimeType: req.file.mimetype },
  });


   const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: createUserContent([
      createPartFromUri(myfile.uri, myfile.mimeType),
             `You are an anime expert assistant for an anime streaming platform.

Analyze the uploaded image and do the following:

1. Identify the anime shown in the image.
2. If you are not confident, clearly say "Unknown anime".
3. If identified, provide:
   
   - Anime name
   - Short overview (2–3 lines explaining what the anime is about)
   - Total number of episodes (approximate if exact is unknown)
   - Genre(s)
   - A brief community-style review (2–3 lines, neutral tone)
   - Confidence level (High / Medium / Low)

Rules:
-send the response strictly in valid json format 
- Do NOT guess if unsure.
- Keep the response concise and user-friendly.
- Do NOT include spoilers.
- Do NOT mention image analysis or AI limitations.
Return the result strictly in JSON format with keys:
anime, overview, episodes, genres, review, confidence
If anime is identified, suggest 2 similar anime titles.
Information is provided for discovery purposes only.


`,
    ]),
  });
const data = extractGeminiJSON(response);

 const anime_name=data.anime;
 const id_response=await fetch(`http://anveshna-backend-v2.vercel.app/meta/anilist/advanced-search?query=${anime_name}`);
 const id_data = await id_response.json();
 const id = id_data.results[0].id;

 const data_response=await fetch(`http://anveshna-backend-v2.vercel.app/meta/anilist/data/${id}?provider="gogoanime"`);
 const media=await data_response.json();
  res.json({
      id:id,
      success: true,
      result: response.text,
      media:media
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Anime identification failed" });
  }

 
}


)

app.listen((3000),()=>{
    console.log("server listening")
})
  


