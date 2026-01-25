# Zod Integration Guide for SkillLoop

## Overview

Zod is now configured in the project for type-safe form validation with Server Actions. All validation schemas are centralized in `lib/validation.ts`.

## Installation

```bash
npm install zod
```

✅ **Installed** - Version added to package.json

## Configuration

### Schema Location

All Zod validation schemas are defined in:
- **File**: `lib/validation.ts`
- **Exports**: Schemas, TypeScript types, and validation utilities

### Available Schemas

1. **User Management**
   - `userSchema` - Create new user
   - `updateUserSchema` - Update existing user

2. **Skill Management**
   - `skillSchema` - Create/edit skills
   - `updateSkillSchema` - Update with ID

3. **Role Competency Framework**
   - `roleFrameworkSchema` - Define role with skill requirements
   - `skillRequirementSchema` - Individual skill requirement

4. **System Configuration**
   - `systemConfigSchema` - All system settings with threshold validation

## Usage Patterns

### 1. In Server Actions (with useActionState)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireRole } from '@/actions/auth'
import { skillSchema, formDataToObject } from '@/lib/validation'

export async function createSkillAction(prevState: any, formData: FormData) {
  await requireRole(['ADMIN'])
  
  // Extract form data
  const rawData = formDataToObject(formData)
  
  // Validate with Zod
  const validatedFields = skillSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed',
    }
  }

  try {
    // Use validated data
    await db.skill.create({
      data: validatedFields.data,
    })

    revalidatePath('/admin/skills')

    return {
      success: true,
      message: 'Skill created successfully',
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create skill',
    }
  }
}
```

### 2. In Client Components (with useActionState)

```tsx
'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSkillAction } from '@/actions/skills'

export function SkillForm() {
  const [state, formAction, pending] = useActionState(
    createSkillAction,
    { success: false }
  )

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="skillName">Skill Name</Label>
        <Input 
          id="skillName" 
          name="skillName" 
          required 
        />
        {state?.errors?.skillName && (
          <p className="text-sm text-red-500 mt-1">
            {state.errors.skillName[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Input 
          id="category" 
          name="category" 
          required 
        />
        {state?.errors?.category && (
          <p className="text-sm text-red-500 mt-1">
            {state.errors.category[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input 
          id="description" 
          name="description" 
        />
      </div>

      {state?.message && !state.success && (
        <p className="text-sm text-red-500">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Skill'}
      </Button>
    </form>
  )
}
```

### 3. With shadcn/ui Form Component

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { skillSchema, type SkillInput } from '@/lib/validation'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SkillFormRHF() {
  const form = useForm<SkillInput>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      skillName: '',
      category: '',
      description: '',
    },
  })

  async function onSubmit(data: SkillInput) {
    // Call server action with validated data
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value.toString())
    })
    
    // Submit to server action...
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="skillName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skill Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## Key Features

### 1. Type Safety

```typescript
import { type SkillInput } from '@/lib/validation'

// TypeScript knows the exact shape
const skill: SkillInput = {
  skillName: 'React',
  category: 'Frontend',
  description: 'JavaScript library', // optional
}
```

### 2. Field-Level Errors

```typescript
if (!validatedFields.success) {
  const errors = validatedFields.error.flatten().fieldErrors
  // {
  //   skillName: ['Skill name must be at least 2 characters'],
  //   category: ['Category is required']
  // }
}
```

### 3. Custom Validation Rules

```typescript
// Cross-field validation
const schema = z.object({
  criticalThreshold: z.number(),
  highThreshold: z.number(),
  mediumThreshold: z.number(),
}).refine(
  (data) => data.criticalThreshold > data.highThreshold,
  {
    message: 'Critical must be higher than High',
    path: ['criticalThreshold'],
  }
)
```

### 4. Transformations

```typescript
const schema = z.object({
  dateOfJoining: z.string().transform(str => new Date(str)),
  level: z.string().transform(str => parseInt(str)),
})
```

## Best Practices

### ✅ DO

1. **Centralize schemas** in `lib/validation.ts`
2. **Export TypeScript types** with `z.infer<typeof schema>`
3. **Use safeParse** instead of parse in Server Actions
4. **Return structured errors** for useActionState
5. **Reuse schemas** for create and update operations
6. **Add meaningful error messages** to each validation rule

### ❌ DON'T

1. **Don't duplicate schemas** across files
2. **Don't use parse()** in Server Actions (throws errors)
3. **Don't skip validation** on the server side
4. **Don't forget to handle FormData** conversion
5. **Don't expose sensitive validation logic** to client

## Utility Functions

### `validateFormData(schema, data)`

Quick validation helper that returns structured response:

```typescript
const result = validateFormData(skillSchema, rawData)

if (!result.success) {
  return {
    success: false,
    errors: result.errors,
    message: 'Validation failed',
  }
}

// Use result.data with type safety
await db.skill.create({ data: result.data })
```

### `formDataToObject(formData)`

Converts FormData to plain object with JSON parsing:

```typescript
const formData = new FormData()
formData.append('skillName', 'React')
formData.append('skillRequirements', JSON.stringify([...]))

const obj = formDataToObject(formData)
// { skillName: 'React', skillRequirements: [...] }
```

### `formatZodErrors(error)`

Formats ZodError for display:

```typescript
const errors = formatZodErrors(zodError)
// { fieldName: ['Error message 1', 'Error message 2'] }
```

## Integration with shadcn/ui Form

Install the resolver:

```bash
npm install @hookform/resolvers
```

Then use with react-hook-form:

```typescript
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(yourSchema),
})
```

## Error Display Patterns

### Inline Field Errors

```tsx
{state?.errors?.fieldName && (
  <p className="text-sm text-red-500 mt-1">
    {state.errors.fieldName[0]}
  </p>
)}
```

### Form-Level Errors

```tsx
{state?.message && !state.success && (
  <Alert variant="destructive">
    <AlertDescription>{state.message}</AlertDescription>
  </Alert>
)}
```

### Toast Notifications

```tsx
import { toast } from 'sonner'

useEffect(() => {
  if (state?.success) {
    toast.success(state.message)
  } else if (state?.message) {
    toast.error(state.message)
  }
}, [state])
```

## References

- **Zod Documentation**: https://zod.dev
- **Project Schemas**: `lib/validation.ts`
- **Example Usage**: See plan-phase3-admin-configuration-module.md
- **Server Actions**: `actions/*.ts`
