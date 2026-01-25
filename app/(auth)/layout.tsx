import { ReactNode } from 'react'

/**
 * Auth Layout
 * 
 * Provides centered layout for authentication pages
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-slate-50 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
