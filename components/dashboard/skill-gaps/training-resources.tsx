import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RiExternalLinkLine, RiBookmarkLine } from '@remixicon/react'

interface TrainingResourcesProps {
  resources?: Array<{
    resourceId: string
    title: string
    url: string
    resourceType: string
    estimatedHours?: number
    provider?: string
    rating?: number
  }>
}

const resourceTypeEmojis: Record<string, string> = {
  UDEMY: '📚',
  COURSE: '🎓',
  ARTICLE: '📄',
  VIDEO: '🎥',
  BOOK: '📖',
  DOCUMENTATION: '📚',
  TUTORIAL: '👨‍🏫',
  OTHER: '🔗',
}

const resourceTypeColors: Record<string, string> = {
  UDEMY: 'bg-purple-100 text-purple-800',
  COURSE: 'bg-blue-100 text-blue-800',
  ARTICLE: 'bg-cyan-100 text-cyan-800',
  VIDEO: 'bg-red-100 text-red-800',
  BOOK: 'bg-amber-100 text-amber-800',
  DOCUMENTATION: 'bg-slate-100 text-slate-800',
  TUTORIAL: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-800',
}

export function TrainingResources({ resources = [] }: TrainingResourcesProps) {
  if (resources.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <RiBookmarkLine size={16} className="text-blue-600" />
        <h4 className="font-semibold text-sm">Learning Resources</h4>
      </div>
      <div className="space-y-2">
        {resources.map((resource) => (
          <a
            key={resource.resourceId}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 transition group"
          >
            <div className="text-lg pt-0.5">{resourceTypeEmojis[resource.resourceType] || '🔗'}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition line-clamp-2">
                {resource.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className={resourceTypeColors[resource.resourceType]}>
                  {resource.resourceType}
                </Badge>
                {resource.provider && (
                  <span className="text-xs text-gray-600">📌 {resource.provider}</span>
                )}
                {resource.estimatedHours && (
                  <span className="text-xs text-gray-600">⏱️ {resource.estimatedHours}h</span>
                )}
                {resource.rating && (
                  <span className="text-xs text-gray-600">⭐ {resource.rating.toFixed(1)}</span>
                )}
              </div>
            </div>
            <RiExternalLinkLine size={16} className="text-gray-400 group-hover:text-blue-600 transition shrink-0 mt-1" />
          </a>
        ))}
      </div>
    </div>
  )
}

export function ResourceGrid({ resources = [] }: TrainingResourcesProps) {
  if (resources.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {resources.map((resource) => (
        <a
          key={resource.resourceId}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{resourceTypeEmojis[resource.resourceType] || '🔗'}</span>
                <h5 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 line-clamp-2">
                  {resource.title}
                </h5>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {resource.provider || 'Resource'} 
                {resource.estimatedHours && ` • ${resource.estimatedHours}h`}
                {resource.rating && ` • ⭐ ${resource.rating.toFixed(1)}`}
              </p>
            </div>
            <RiExternalLinkLine size={16} className="text-gray-400 group-hover:text-blue-600 shrink-0" />
          </div>
        </a>
      ))}
    </div>
  )
}
