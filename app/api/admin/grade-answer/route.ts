import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { answerId, marksAwarded, feedback, attemptId } = await request.json()

    // Validate inputs
    if (!answerId || marksAwarded === undefined || !attemptId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update the answer with marks and feedback
    await prisma.answer.update({
      where: { id: answerId },
      data: {
        marksAwarded: parseFloat(marksAwarded),
        trainerFeedback: feedback || null,
        isCorrect: null // Descriptive questions don't have binary correct/incorrect
      }
    })

    // Recalculate total score for the attempt
    const answers = await prisma.answer.findMany({
      where: { attemptId },
      select: { marksAwarded: true }
    })

    // Check if all answers are graded
    const allGraded = answers.every(a => a.marksAwarded !== null)
    
    if (allGraded) {
      const totalScore = answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0)
      
      // Get assessment to calculate percentage
      const attempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attemptId },
        select: { 
          assessment: { 
            select: { totalMarks: true } 
          } 
        }
      })

      if (attempt) {
        const percentage = (totalScore / attempt.assessment.totalMarks) * 100

        // Update attempt with final score and mark as completed
        await prisma.assessmentAttempt.update({
          where: { id: attemptId },
          data: {
            score: totalScore,
            percentage,
            status: "completed"
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Answer graded successfully",
      allGraded 
    })
  } catch (error) {
    console.error("Grade answer error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to grade answer" },
      { status: 500 }
    )
  }
}
