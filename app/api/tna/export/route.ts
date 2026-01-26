import { auth } from "@/lib/auth"
import { generateOrganizationTNA } from "@/actions/skill-matrix"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  
  // Check authorization - Admin only for Org TNA
  if (!session?.user || !session.user.systemRoles?.includes('ADMIN')) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { format, filters } = body

    // Generate TNA data (fetch all for export, limit 10000)
    const data = await generateOrganizationTNA(filters, 0, 10000)

    if (format === 'CSV') {
      const csvRows = [
        ['Employee ID', 'Name', 'Email', 'Department', 'Role', 'Total Skills', 'Gap Score', 'Critical Gaps', 'High Gaps', 'Medium Gaps', 'Low Gaps', 'Completed']
      ]

      data.employeeTNAs.forEach(tna => {
        csvRows.push([
          `"${tna.userId}"`,
          `"${tna.userName}"`,
          `"${tna.email}"`,
          `"${tna.department || ''}"`,
          `"${tna.roleName || ''}"`,
          tna.totalSkillsTracked.toString(),
          tna.overallGapScore.toFixed(2),
          tna.criticalGapsCount.toString(),
          tna.highGapsCount.toString(),
          tna.mediumGapsCount.toString(),
          tna.lowGapsCount.toString(),
          tna.skillsCompletedCount.toString()
        ])
      })

      const csvContent = csvRows.map(row => row.join(',')).join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tna-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } 
    
    return new NextResponse("Format not supported", { status: 400 })

  } catch (error) {
    console.error('Export failed:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
