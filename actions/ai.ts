"use server"

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { z } from "zod"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

// Zod schema for runtime validation (safety net)
const aiQuestionSchema = z.object({
    questionText: z.string(),
    questionType: z.enum(['MCQ', 'DESCRIPTIVE', 'TRUE_FALSE', 'FILL_BLANK']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    marks: z.number(),
    difficultyLevel: z.enum(['BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
})

const aiResponseSchema = z.array(aiQuestionSchema)

// Gemini Schema Definition for Structured Output
const geminiSchema = {
    description: "List of assessment questions",
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            questionText: { type: SchemaType.STRING },
            questionType: {
                type: SchemaType.STRING,
                format: "enum",
                enum: ["MCQ", "DESCRIPTIVE", "TRUE_FALSE", "FILL_BLANK"]
            },
            options: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "List of options for MCQ, minimum 2. Empty for other types."
            },
            correctAnswer: {
                type: SchemaType.STRING,
                description: "For MCQ/FILL_BLANK: the answer text. For TRUE_FALSE: 'true' or 'false'. For DESCRIPTIVE: model answer/key points."
            },
            marks: { type: SchemaType.NUMBER },
            difficultyLevel: {
                type: SchemaType.STRING,
                format: "enum",
                enum: ["BEGINNER", "BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"]
            },
        },
        required: ["questionText", "questionType", "correctAnswer", "marks", "difficultyLevel"],
    },
} as const

export async function generateAIQuestions(
    topic: string,
    count: number,
    difficulty: string,
    types: string[],
    instructions?: string
) {
    if (!process.env.GOOGLE_API_KEY) {
        return {
            success: false,
            message: "GOOGLE_API_KEY is not configured in the server environment."
        }
    }

    try {
        // Use the latest preview model
        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: geminiSchema as any,
            }
        })

        const prompt = `
      Generate ${count} assessment questions about "${topic}".
      
      Configuration:
      - Difficulty: ${difficulty}
      - Question Types: ${types.join(", ")}
      ${instructions ? `- Special Instructions: ${instructions}` : ""}

      Requirements:
      1. For MCQ, provide 4 options.
      2. For TRUE_FALSE, options should be empty array, correctAnswer must be "true" or "false".
      3. For FILL_BLANK, ensure the answer is a single specific word or short phrase.
      4. Ensure questions are relevant to the role and skill level.
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Parse JSON
        const data = JSON.parse(text)

        // Validate schema with Zod as a final safety check
        const validatedData = aiResponseSchema.safeParse(data)

        if (!validatedData.success) {
            console.error("AI Schema Validation Error:", validatedData.error)
            return {
                success: false,
                message: "AI generated invalid data format."
            }
        }

        return {
            success: true,
            data: validatedData.data
        }

    } catch (error) {
        console.error("AI Generation Error:", error)
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to generate questions"
        }
    }
}
