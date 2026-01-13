import { GoogleGenAI } from "@google/genai";
import express from "express"


const app=express();
app.use(express.json());
// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey:"AIzaSyATBGge1qQhxRJECCffxQ-IS2r57UTj9Nc"});

app.post("/generate",async(req,res)=>{
    const {prompt}=req.body;
    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  res.json({response:response.text})
})

app.listen((3000),()=>{
    console.log("server listening")
})
  


