# Quick Reference: Personal vs Assigned Skills

## 🎯 The Three Scenarios

### Scenario 1: Personal Skill (I Already Have It)

```
User: "I learned C# 3 years ago and I'm an expert!"

Database Entry:
┌────────────────────────────────────────┐
│ Skill: C# Programming                  │
│ Current:  ADVANCED ━━━━━━━━━┓         │
│ Desired:  ADVANCED ━━━━━━━━━┛         │
│ Gap: 0% ✅                             │
│ Status: completed                      │
│ Type: PERSONAL                         │
│ Last Assessed: Jan 15, 2023            │
└────────────────────────────────────────┘

Result: ✅ NO training needed
        ✅ NO assessment needed
        ✅ Shows in "My Skills" section
```

---

### Scenario 2: Assigned Skill (I Don't Have It)

```
Admin: "Vithesh needs to learn Python for the new project"

Database Entry:
┌────────────────────────────────────────┐
│ Skill: Python                          │
│ Current:  NULL (nothing)               │
│ Desired:  INTERMEDIATE ━━━━━━━━━━━━┓  │
│ Gap: 100% 🔴                           │
│ Status: gap_identified                 │
│ Type: ASSIGNED                         │
│ Last Assessed: null                    │
└────────────────────────────────────────┘

Result: ⚠️ Training REQUIRED
        ⚠️ Assessment REQUIRED
        ⚠️ Shows in "Required Skills" section
        📚 Training recommendations: 3 courses
```

---

### Scenario 3: Conflict (I Have It, Admin Assigns It)

```
User: "I already have ASP.NET at INTERMEDIATE"
Admin: "We need you at ADVANCED for this role"

TWO Database Entries:

Entry 1 (Personal):
┌────────────────────────────────────────┐
│ Skill: ASP.NET Core Web API            │
│ Current:  INTERMEDIATE ━━━━━┓         │
│ Desired:  INTERMEDIATE ━━━━━┛         │
│ Gap: 0% ✅                             │
│ Status: completed                      │
│ Type: PERSONAL                         │
└────────────────────────────────────────┘

Entry 2 (Assigned):
┌────────────────────────────────────────┐
│ Skill: ASP.NET Core Web API            │
│ Current:  INTERMEDIATE ━━━━━┓         │
│ Desired:  ADVANCED ━━━━━━━━━┛         │
│ Gap: 33% ⚠️                            │
│ Status: gap_identified                 │
│ Type: ASSIGNED                         │
└────────────────────────────────────────┘

Result: ✅ Personal achievement preserved
        ⚠️ Must train from INTERMEDIATE → ADVANCED
        ⚠️ Organizational assessment required
        📚 Training: Focus on advanced topics
```

---

## 📊 How to Identify Each Type

### In Database (SkillMatrix table):

| Type | currentLevel | desiredLevel | gapPercentage | status | Action Required |
|------|--------------|--------------|---------------|---------|-----------------|
| **Personal** | ADVANCED | ADVANCED | 0% | completed | ✅ None |
| **Assigned (New)** | NULL | INTERMEDIATE | 100% | gap_identified | ⚠️ Full training |
| **Assigned (Upgrade)** | INTERMEDIATE | ADVANCED | 33% | gap_identified | ⚠️ Upskilling |
| **Assigned (Match)** | ADVANCED | ADVANCED | 0% | assessment_required | ⚠️ Prove competency |

---

## 🎨 UI Display

### Employee Dashboard:

```
┌─────────────────────────────────────────────────────────┐
│ My Skills (Personal Achievements) ✅                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ✓ C# Programming               [ADVANCED]     ✅        │
│   Assessed: Jan 15, 2023                                │
│   [View Certificate]  [Remove]                          │
│                                                          │
│ ✓ SQL Server                   [INTERMEDIATE]  ✅        │
│   Assessed: Mar 10, 2023                                │
│   [View Certificate]  [Remove]                          │
│                                                          │
│ ✓ .NET Core Framework          [INTERMEDIATE]  ✅        │
│   Assessed: Jun 5, 2023                                 │
│   [View Certificate]  [Remove]                          │
│                                                          │
│ [+ Add New Skill]                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Required Skills (Job Requirements) ⚠️                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ⚠ ASP.NET Core Web API         [INTERMEDIATE→ADVANCED] │
│   Gap: 33% | Training Required                          │
│   📚 Training: 2 courses  |  ⏱ 8 hours                  │
│   [Start Training]  [View Details]                      │
│                                                          │
│ 🔴 Azure DevOps                [NULL→INTERMEDIATE]      │
│   Gap: 100% | Not Started                               │
│   📚 Training: 3 courses  |  ⏱ 12 hours                 │
│   [Start Learning]  [View Details]                      │
│                                                          │
│ 🔴 Entity Framework Core       [NULL→ADVANCED]          │
│   Gap: 100% | Not Started                               │
│   📚 Training: 4 courses  |  ⏱ 16 hours                 │
│   [Start Learning]  [View Details]                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 User Workflows

### Add Personal Skill:

```
1. User clicks [+ Add New Skill]
2. Searches for skill: "Docker"
3. Selects proficiency: INTERMEDIATE
4. System creates:
   ✅ currentLevel = INTERMEDIATE
   ✅ desiredLevel = INTERMEDIATE
   ✅ gap = 0%
   ✅ status = completed
5. Skill appears in "My Skills"
```

### Admin Assigns New Skill:

```
1. Admin selects user: Vithesh
2. Assigns skill: Kubernetes
3. Sets desired level: ADVANCED
4. System creates:
   ⚠️ currentLevel = NULL
   ⚠️ desiredLevel = ADVANCED
   ⚠️ gap = 100%
   ⚠️ status = gap_identified
5. User receives notification
6. Training recommendations generated
7. Skill appears in user's "Required Skills"
```

### Admin Assigns Skill User Has:

```
1. Admin assigns: C# Programming (ADVANCED)
2. System checks: User already has C# (ADVANCED) - personal
3. System creates SEPARATE entry:
   ⚠️ currentLevel = ADVANCED (copy from personal)
   ⚠️ desiredLevel = ADVANCED (requirement)
   ⚠️ gap = 0% (but assessment needed)
   ⚠️ status = assessment_required
4. User sees BOTH entries:
   - "My Skills": C# (ADVANCED) ✅
   - "Required Skills": C# (ADVANCED) - needs org assessment ⚠️
```

### Remove Personal Skill:

```
1. User clicks [Remove] on personal skill
2. System checks: Is this assigned? NO
3. System deletes SkillMatrix entry
4. Skill removed from "My Skills"

BLOCKED if skill is assigned by admin!
```

---

## 🧪 Live Example: Vithesh

Run the example seed to see all scenarios:

```bash
npm run db:seed:vithesh
```

**Result:**

| Skill | Type | Current | Desired | Gap | Status |
|-------|------|---------|---------|-----|--------|
| C# Programming | PERSONAL | ADVANCED | ADVANCED | 0% | ✅ completed |
| SQL Server | PERSONAL | INTERMEDIATE | INTERMEDIATE | 0% | ✅ completed |
| .NET Core | PERSONAL | INTERMEDIATE | INTERMEDIATE | 0% | ✅ completed |
| ASP.NET Web API | ASSIGNED | INTERMEDIATE | ADVANCED | 33% | ⚠️ gap_identified |
| Azure DevOps | ASSIGNED | NULL | INTERMEDIATE | 100% | ⚠️ gap_identified |
| Entity Framework | ASSIGNED | NULL | ADVANCED | 100% | ⚠️ gap_identified |

**Total:** 3 personal skills (no action), 3 assigned skills (training required)

---

## 🎓 Key Rules

1. **Personal skills** = Skills I have (no gap, no training needed)
2. **Assigned skills** = Job requirements (may have gap, training needed)
3. **Same skill can exist twice** = Once personal, once assigned
4. **Users add personal** skills themselves
5. **Admins assign** skills as requirements
6. **Users can remove personal** skills (if not assigned)
7. **Users cannot remove assigned** skills (only admins can)
8. **When admin assigns existing skill** = Create separate entry, user must prove competency for role

---

## 📞 Questions?

See full documentation: [PERSONAL_VS_ASSIGNED_SKILLS.md](./PERSONAL_VS_ASSIGNED_SKILLS.md)
