import {
  RiCheckboxMultipleLine,
  RiFileTextLine,
  RiCheckboxCircleLine,
  RiInputMethodLine,
} from "@remixicon/react"

interface QuestionTypeIconProps {
  type: string
  className?: string
}

export function QuestionTypeIcon({ type, className = "h-4 w-4" }: QuestionTypeIconProps) {
  switch (type) {
    case "MCQ":
      return <RiCheckboxMultipleLine className={className} />
    case "DESCRIPTIVE":
      return <RiFileTextLine className={className} />
    case "TRUE_FALSE":
      return <RiCheckboxCircleLine className={className} />
    case "FILL_BLANK":
      return <RiInputMethodLine className={className} />
    default:
      return null
  }
}
