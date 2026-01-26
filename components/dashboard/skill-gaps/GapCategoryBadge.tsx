'use client'

import { GapCategory } from '@/types/skill-matrix'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface GapCategoryBadgeProps {
  category: GapCategory
  gapPercentage: number
}

const categoryConfig = {
  [GapCategory.CRITICAL]: {
    label: 'Critical',
    className: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    description: 'Requires immediate attention (>50% gap)',
  },
  [GapCategory.HIGH]: {
    label: 'High',
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
    description: 'High priority training needed (30-50% gap)',
  },
  [GapCategory.MEDIUM]: {
    label: 'Medium',
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    description: 'Moderate priority (15-30% gap)',
  },
  [GapCategory.LOW]: {
    label: 'Low',
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
    description: 'Minor improvement needed (<15% gap)',
  },
  [GapCategory.NONE]: {
    label: 'Mastered',
    className: 'bg-green-500 hover:bg-green-600 text-white',
    description: 'At desired competency level (0% gap)',
  },
}

export function GapCategoryBadge({ category, gapPercentage }: GapCategoryBadgeProps) {
  const config = categoryConfig[category]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={config.className}>
            {config.label} ({gapPercentage.toFixed(1)}%)
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
