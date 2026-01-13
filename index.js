import { GoogleGenAI } from "@google/genai";
import express from "express"

import dotenv from "dotenv";
dotenv.config();

const app=express();
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

app.listen((3000),()=>{
    console.log("server listening")
})
  


