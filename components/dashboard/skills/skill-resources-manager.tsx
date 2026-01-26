import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RiDeleteBin6Line, RiEditLine, RiExternalLinkLine } from '@remixicon/react'
import { createSkillResource, deleteSkillResource, searchExternalResources } from '@/actions/skill-resources'

interface SkillResourcesManagerProps {
  skillId: string
  skillName: string
  resources: any[]
  onResourceAdded?: (resource: any) => void
  onResourceDeleted?: (resourceId: string) => void
}

export function SkillResourcesManager({
  skillId,
  skillName,
  resources,
  onResourceAdded,
  onResourceDeleted,
}: SkillResourcesManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [externalResources, setExternalResources] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    level: 'BEGINNER' as const,
    title: '',
    description: '',
    url: '',
    resourceType: 'UDEMY' as const,
    estimatedHours: '',
    provider: '',
    rating: '',
  })

  const levelColors: Record<string, string> = {
    BEGINNER: 'bg-blue-100 text-blue-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-orange-100 text-orange-800',
    EXPERT: 'bg-red-100 text-red-800',
  }

  const resourceTypeIcons: Record<string, string> = {
    UDEMY: '📚',
    COURSE: '🎓',
    ARTICLE: '📄',
    VIDEO: '🎥',
    BOOK: '📖',
    DOCUMENTATION: '📖',
    TUTORIAL: '👨‍🏫',
    OTHER: '🔗',
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const resource = await createSkillResource({
        skillId,
        level: formData.level,
        title: formData.title,
        description: formData.description || undefined,
        url: formData.url,
        resourceType: formData.resourceType,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        provider: formData.provider || undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
      })

      // Reset form
      setFormData({
        level: 'BEGINNER',
        title: '',
        description: '',
        url: '',
        resourceType: 'UDEMY',
        estimatedHours: '',
        provider: '',
        rating: '',
      })

      setIsOpen(false)
      onResourceAdded?.(resource)
    } catch (error) {
      console.error('Failed to add resource:', error)
      alert('Failed to add resource')
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      await deleteSkillResource(resourceId)
      onResourceDeleted?.(resourceId)
    } catch (error) {
      console.error('Failed to delete resource:', error)
      alert('Failed to delete resource')
    }
  }

  const handleSearchExternal = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await searchExternalResources(skillName, formData.level, formData.resourceType)
      setExternalResources(results)
    } catch (error) {
      console.error('Failed to search resources:', error)
      alert('Failed to search resources')
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportExternal = (externalResource: any) => {
    setFormData({
      ...formData,
      title: externalResource.title,
      description: externalResource.description,
      url: externalResource.url,
      resourceType: externalResource.resourceType || 'OTHER',
      estimatedHours: externalResource.estimatedHours?.toString() || '',
      provider: externalResource.provider || '',
      rating: externalResource.rating?.toString() || '',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Resources for {skillName}</CardTitle>
        <CardDescription>Add resources like courses, videos, and articles for each competency level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resources by Level */}
        <div className="space-y-4">
          {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map((level) => {
            const levelResources = resources.filter((r) => r.level === level)
            return (
              <div key={level}>
                <h4 className={`text-sm font-semibold mb-2 px-3 py-1 rounded w-fit ${levelColors[level]}`}>
                  {level}
                </h4>
                {levelResources.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No resources added yet</p>
                ) : (
                  <div className="space-y-2">
                    {levelResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{resourceTypeIcons[resource.resourceType] || '🔗'}</span>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {resource.title}
                              <RiExternalLinkLine size={14} />
                            </a>
                          </div>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {resource.provider && <span>📌 {resource.provider}</span>}
                            {resource.estimatedHours && <span>⏱️ {resource.estimatedHours}h</span>}
                            {resource.rating && <span>⭐ {resource.rating}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="text-red-600 hover:text-red-700 ml-2"
                        >
                          <RiDeleteBin6Line size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add Resource Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">+ Add Resource</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Learning Resource</DialogTitle>
              <DialogDescription>Add a course, article, video, or other learning material</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddResource} className="space-y-4">
              {/* Search External Resources */}
              <div className="space-y-2">
                <Label>Search External Resources (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Search ${skillName} courses on Udemy, YouTube, etc...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchExternal}
                    disabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* External Search Results */}
                {externalResources.length > 0 && (
                  <div className="mt-3 space-y-2 bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm font-semibold">Found Resources:</p>
                    {externalResources.map((ext, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-2 bg-white rounded border border-blue-100"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ext.title}</p>
                          <p className="text-xs text-gray-600">{ext.provider}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleImportExternal(ext)}
                        >
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select value={formData.level} onValueChange={(value: any) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="EXPERT">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resourceType">Type</Label>
                  <Select value={formData.resourceType} onValueChange={(value: any) => setFormData({ ...formData, resourceType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UDEMY">Udemy</SelectItem>
                      <SelectItem value="COURSE">Online Course</SelectItem>
                      <SelectItem value="ARTICLE">Article</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="BOOK">Book</SelectItem>
                      <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                      <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Advanced Python Programming Course"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the resource"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    placeholder="e.g., Udemy, YouTube"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    placeholder="Estimated hours"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="e.g., 4.5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Resource</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
