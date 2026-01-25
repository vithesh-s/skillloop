/**
 * CSV Utilities for Assessment Question Management
 * 
 * Handles CSV template generation, parsing, and validation
 * for bulk question uploads
 */

import { questionSchema } from './validation'
import type { QuestionFormData } from './validation'

/**
 * Generate CSV template for bulk question upload
 * Returns CSV string with headers and example rows
 */
export function generateQuestionTemplate(): string {
    const headers = ['questionText', 'questionType', 'options', 'correctAnswer', 'marks', 'difficultyLevel']

    const examples = [
        [
            'What is the capital of France?',
            'MCQ',
            'Paris|London|Berlin|Madrid',
            'Paris',
            '2',
            'BEGINNER'
        ],
        [
            'The Earth revolves around the Sun.',
            'TRUE_FALSE',
            '',
            'true',
            '1',
            'BEGINNER'
        ],
        [
            'The primary programming language for Android development is _____.',
            'FILL_BLANK',
            '',
            'Kotlin',
            '2',
            'INTERMEDIATE'
        ],
        [
            'Explain the concept of dependency injection in software development.',
            'DESCRIPTIVE',
            '',
            '',
            '10',
            'ADVANCED'
        ]
    ]

    const rows = [headers, ...examples]
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}

/**
 * Parse CSV file and return array of question objects
 * Handles UTF-8 encoding and various CSV formats
 */
export async function parseQuestionCSV(file: File): Promise<QuestionFormData[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
            try {
                const text = event.target?.result as string
                const lines = text.split('\n').filter(line => line.trim())

                // Skip header row
                const dataLines = lines.slice(1)

                const questions: QuestionFormData[] = []

                for (const line of dataLines) {
                    const row = parseCSVLine(line)
                    if (row.length === 0) continue

                    const question = parseQuestionRow(row)
                    if (question) {
                        questions.push(question)
                    }
                }

                resolve(questions)
            } catch (error) {
                reject(new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`))
            }
        }

        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }

        reader.readAsText(file, 'UTF-8')
    })
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }

    result.push(current.trim())
    return result
}

/**
 * Parse and validate a single CSV row into a question object
 */
function parseQuestionRow(row: string[]): QuestionFormData | null {
    if (row.length < 7) {
        console.warn('Skipping invalid row: insufficient columns (expected: skillId, questionText, questionType, options, correctAnswer, marks, difficultyLevel)')
        return null
    }

    const [skillId, questionText, questionType, optionsStr, correctAnswer, marksStr, difficultyLevel] = row

    // Parse options - handle JSON array or pipe-separated values
    let options: string[] | undefined
    if (optionsStr && optionsStr.trim()) {
        if (optionsStr.startsWith('[')) {
            try {
                options = JSON.parse(optionsStr)
            } catch {
                options = optionsStr.split('|').map(opt => opt.trim())
            }
        } else {
            options = optionsStr.split('|').map(opt => opt.trim()).filter(Boolean)
        }
    }

    // Parse marks
    const marks = parseInt(marksStr, 10)
    if (isNaN(marks)) {
        console.warn('Skipping row: invalid marks value')
        return null
    }

    const questionData: QuestionFormData = {
        skillId: skillId.trim(),
        questionText: questionText.trim(),
        questionType: questionType.trim() as 'MCQ' | 'DESCRIPTIVE' | 'TRUE_FALSE' | 'FILL_BLANK',
        options: options && options.length > 0 ? options : undefined,
        correctAnswer: correctAnswer?.trim() || undefined,
        marks,
        difficultyLevel: difficultyLevel.trim() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
    }

    return questionData
}

/**
 * Validate a single question row against the schema
 */
export function validateQuestionRow(question: QuestionFormData): { success: boolean; error?: string } {
    const result = questionSchema.safeParse(question)

    if (result.success) {
        return { success: true }
    }

    const errors = result.error.flatten().fieldErrors
    const errorMessage = Object.entries(errors)
        .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
        .join('; ')

    return { success: false, error: errorMessage }
}
