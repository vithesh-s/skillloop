'use client'

import { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  className?: string
  length?: number
}

export function OTPInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  className,
  length = 6,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    if (!/^\d*$/.test(newValue)) return

    const newOTP = value.split('')
    newOTP[index] = newValue
    const newOTPValue = newOTP.join('').slice(0, length)

    onChange(newOTPValue)

    // Move to next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete if all digits are filled
    if (newOTPValue.length === length) {
      onComplete?.(newOTPValue)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, length)

    onChange(pastedDigits)

    if (pastedDigits.length === length) {
      onComplete?.(pastedDigits)
    }
  }

  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="h-12 w-12 text-center text-lg font-semibold"
        />
      ))}
    </div>
  )
}
