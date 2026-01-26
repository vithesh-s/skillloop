'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RiFilterLine, RiRefreshLine } from '@remixicon/react'
import { Card, CardContent } from '@/components/ui/card'

export function SkillGapFilters() {
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  const handleSeverityChange = (severity: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.getAll('gapCategories')
    const value = severity.toUpperCase()
    
    // Clear existing
    params.delete('gapCategories')
    
    let next = [...current]
    if (checked) {
      if (!next.includes(value)) next.push(value)
    } else {
      next = next.filter(v => v !== value)
    }
    
    // Append new
    next.forEach(v => params.append('gapCategories', v))
    router.push(`?${params.toString()}`)
  }

  const handleReset = () => {
    router.push(window.location.pathname)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <RiFilterLine className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RiRefreshLine className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Skills</Label>
                <Input 
                  id="search" 
                  placeholder="Search by skill name..." 
                  defaultValue={searchParams.get('searchTerm') || ''}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={searchParams.get('categoryId') || 'all'}
                  onValueChange={(val) => updateFilter('categoryId', val)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {/* TODO: Fetch categories dynamically if needed, or pass as props */}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={searchParams.get('status') || 'all'}
                  onValueChange={(val) => updateFilter('status', val)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="gap_identified">Gap Identified</SelectItem>
                    <SelectItem value="training_assigned">Training Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gap Severity */}
              <div className="space-y-2">
                <Label>Gap Severity</Label>
                <div className="space-y-2">
                  {['Critical', 'High', 'Medium', 'Low', 'None'].map((severity) => {
                    const value = severity.toUpperCase()
                    const checked = searchParams.getAll('gapCategories').includes(value)
                    return (
                      <div key={severity} className="flex items-center space-x-2">
                        <Checkbox 
                          id={severity.toLowerCase()} 
                          checked={checked}
                          onCheckedChange={(c) => handleSeverityChange(severity, c as boolean)}
                        />
                        <label
                          htmlFor={severity.toLowerCase()}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {severity}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
