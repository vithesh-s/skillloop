import { PrismaClient, Role, CompetencyLevel, AssessmentStatus, QuestionType } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';


import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

/**
 * Main seed function to populate the database with initial data
 * - Imports 70+ employees from JSON file
 * - Creates demo skills, assessments, and questions
 * - Sets up role competencies and system configuration
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================================
  // STEP 1: Clear existing data (development only)
  // ============================================================================
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');

    await prisma.notification.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.trainingCalendar.deleteMany();
    await prisma.proofOfCompletion.deleteMany();
    await prisma.progressUpdate.deleteMany();
    await prisma.trainingAssignment.deleteMany();
    await prisma.offlineTraining.deleteMany();
    await prisma.onlineTraining.deleteMany();
    await prisma.training.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.assessmentAttempt.deleteMany();
    await prisma.question.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.skillMatrix.deleteMany();
    await prisma.roleCompetency.deleteMany();
    await prisma.jobRole.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.skillCategory.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemConfig.deleteMany();

    console.log('✅ Existing data cleared\n');
  }

  // ============================================================================
  // STEP 2: Load and parse employee data
  // ============================================================================
  console.log('📖 Loading employee data from JSON...');

  const jsonPath = join(process.cwd(), 'Data', 'Exsisting-employee-dataoseed.json');
  const fileContent = readFileSync(jsonPath, 'utf-8');
  const employeeData = JSON.parse(fileContent);
  const employees = employeeData.data;

  console.log(`✅ Loaded ${employees.length} employees\n`);

  // ============================================================================
  // STEP 3: Create job roles from employee designations
  // ============================================================================
  console.log('📊 Creating job roles...');

  // Helper function to determine job level based on designation
  const determineJobLevel = (designation: string) => {
    const lower = designation.toLowerCase();
    if (lower.includes('trainee')) return 'ENTRY';
    if (lower.includes('director') || lower.includes('managing')) return 'LEAD';
    if (lower.includes('manager') || lower.includes('lead') || lower.includes('principal')) return 'LEAD';
    if (lower.includes('senior') || lower.includes('sr.')) return 'SENIOR';
    return 'MID';
  };

  // Extract unique designations with their departments from employee data
  const uniqueDesignations = new Map<string, { designation: string, department: string }>();
  for (const emp of employees) {
    if (emp.designation && !uniqueDesignations.has(emp.designation)) {
      uniqueDesignations.set(emp.designation, {
        designation: emp.designation,
        department: emp.department
      });
    }
  }

  // Create or update job roles for all unique designations
  const jobRolesMap = new Map<string, any>();
  for (const [designation, data] of uniqueDesignations) {
    const jobRole = await prisma.jobRole.upsert({
      where: { name: designation },
      update: {
        department: data.department,
        level: determineJobLevel(designation),
        description: `${designation} in ${data.department}`,
      },
      create: {
        name: designation,
        department: data.department,
        level: determineJobLevel(designation),
        description: `${designation} in ${data.department}`,
      },
    });
    jobRolesMap.set(designation, jobRole);
  }

  console.log(`✅ Created ${jobRolesMap.size} job roles\n`);

  // ============================================================================
  // STEP 4: Create users from employee data
  // ============================================================================
  console.log('👥 Creating users...');

  // Helper function to determine system roles based on designation
  const determineSystemRoles = (designation: string): Role[] => {
    const lowerDesignation = designation.toLowerCase();
    const roles: Role[] = [];

    if (lowerDesignation.includes('managing director') || lowerDesignation.includes('director')) {
      return ['ADMIN'];
    }
    if (lowerDesignation.includes('manager') || lowerDesignation.includes('lead')) {
      return ['MANAGER', 'LEARNER'];
    }
    if (lowerDesignation.includes('trainer')) {
      return ['TRAINER', 'LEARNER'];
    }
    // Default: all employees are learners
    return ['LEARNER'];
  };

  // First pass: Create or update all users without manager relationships
  const idMapping = new Map<number, string>(); // Map old ID to new cuid

  for (const emp of employees) {
    // Find matching job role for this employee
    const jobRole = jobRolesMap.get(emp.designation);

    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        employeeNo: emp.employeeNo,
        name: emp.name,
        designation: emp.designation,
        department: emp.department,
        location: emp.location,
        level: emp.level,
        resigned: emp.resigned || false,
        systemRoles: determineSystemRoles(emp.designation),
        roleId: jobRole?.id, // Link to job role
      },
      create: {
        employeeNo: emp.employeeNo,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        location: emp.location,
        level: emp.level,
        resigned: emp.resigned || false,
        systemRoles: determineSystemRoles(emp.designation),
        roleId: jobRole?.id, // Link to job role
      },
    });

    idMapping.set(emp.id, user.id);
  }

  // Second pass: Update manager relationships
  for (const emp of employees) {
    if (emp.pid) {
      const userId = idMapping.get(emp.id);
      const managerId = idMapping.get(emp.pid);

      if (userId && managerId) {
        await prisma.user.update({
          where: { id: userId },
          data: { managerId },
        });
      }
    }
  }

  console.log(`✅ Created ${employees.length} users with manager relationships and job roles\n`);

  // ============================================================================
  // STEP 5: Create skill categories
  // ============================================================================
  console.log('📁 Creating skill categories...');

  const categories = await Promise.all([
    prisma.skillCategory.upsert({
      where: { name: 'Programming Language' },
      update: {
        description: 'Core programming languages and syntax',
        colorClass: 'blue-500',
      },
      create: {
        name: 'Programming Language',
        description: 'Core programming languages and syntax',
        colorClass: 'blue-500',
      },
    }),
    prisma.skillCategory.upsert({
      where: { name: 'Framework' },
      update: {
        description: 'Development frameworks and libraries',
        colorClass: 'purple-500',
      },
      create: {
        name: 'Framework',
        description: 'Development frameworks and libraries',
        colorClass: 'purple-500',
      },
    }),
    prisma.skillCategory.upsert({
      where: { name: 'Database' },
      update: {
        description: 'Database technologies and data management',
        colorClass: 'green-500',
      },
      create: {
        name: 'Database',
        description: 'Database technologies and data management',
        colorClass: 'green-500',
      },
    }),
    prisma.skillCategory.upsert({
      where: { name: 'Cloud & DevOps' },
      update: {
        description: 'Cloud platforms and deployment tools',
        colorClass: 'orange-500',
      },
      create: {
        name: 'Cloud & DevOps',
        description: 'Cloud platforms and deployment tools',
        colorClass: 'orange-500',
      },
    }),
    prisma.skillCategory.upsert({
      where: { name: 'Soft Skills' },
      update: {
        description: 'Communication, leadership, and collaboration skills',
        colorClass: 'pink-500',
      },
      create: {
        name: 'Soft Skills',
        description: 'Communication, leadership, and collaboration skills',
        colorClass: 'pink-500',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} skill categories\n`);

  // ============================================================================
  // STEP 6: Create demo skills (C# .NET Blazor focus)
  // ============================================================================
  console.log('🎯 Creating demo skills...');

  const programmingLangCategory = categories.find((c: any) => c.name === 'Programming Language')!;
  const frameworkCategory = categories.find((c: any) => c.name === 'Framework')!;
  const databaseCategory = categories.find((c: any) => c.name === 'Database')!;
  const cloudCategory = categories.find((c: any) => c.name === 'Cloud & DevOps')!;

  const skills = await Promise.all([
    prisma.skill.upsert({
      where: { name: 'C# Programming' },
      update: {
        categoryId: programmingLangCategory.id,
        description: 'Object-oriented programming with C# including LINQ, async/await, and modern language features',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'C# Programming',
        categoryId: programmingLangCategory.id,
        description: 'Object-oriented programming with C# including LINQ, async/await, and modern language features',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: '.NET Core Framework' },
      update: {
        categoryId: frameworkCategory.id,
        description: 'Cross-platform .NET development including dependency injection, configuration, and middleware',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: '.NET Core Framework',
        categoryId: frameworkCategory.id,
        description: 'Cross-platform .NET development including dependency injection, configuration, and middleware',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: 'Blazor WebAssembly' },
      update: {
        categoryId: frameworkCategory.id,
        description: 'Client-side Blazor applications with component architecture and state management',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'Blazor WebAssembly',
        categoryId: frameworkCategory.id,
        description: 'Client-side Blazor applications with component architecture and state management',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: 'Blazor Server' },
      update: {
        categoryId: frameworkCategory.id,
        description: 'Server-side Blazor with SignalR for real-time UI updates',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'Blazor Server',
        categoryId: frameworkCategory.id,
        description: 'Server-side Blazor with SignalR for real-time UI updates',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: 'Entity Framework Core' },
      update: {
        categoryId: databaseCategory.id,
        description: 'ORM for .NET including migrations, LINQ queries, and database relationships',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'Entity Framework Core',
        categoryId: databaseCategory.id,
        description: 'ORM for .NET including migrations, LINQ queries, and database relationships',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: 'ASP.NET Core Web API' },
      update: {
        categoryId: frameworkCategory.id,
        description: 'RESTful API development with ASP.NET Core including authentication and authorization',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'ASP.NET Core Web API',
        categoryId: frameworkCategory.id,
        description: 'RESTful API development with ASP.NET Core including authentication and authorization',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: 'SQL Server' },
      update: {
        categoryId: databaseCategory.id,
        description: 'T-SQL, stored procedures, indexes, and query optimization',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'SQL Server',
        categoryId: databaseCategory.id,
        description: 'T-SQL, stored procedures, indexes, and query optimization',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: 'Git Version Control' },
      update: {
        categoryId: cloudCategory.id,
        description: 'Version control workflows, branching strategies, and collaboration',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'Git Version Control',
        categoryId: cloudCategory.id,
        description: 'Version control workflows, branching strategies, and collaboration',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: 'Unit Testing (xUnit)' },
      update: {
        categoryId: frameworkCategory.id,
        description: 'Test-driven development with xUnit, testing patterns, and mocking',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'Unit Testing (xUnit)',
        categoryId: frameworkCategory.id,
        description: 'Test-driven development with xUnit, testing patterns, and mocking',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
    prisma.skill.upsert({
      where: { name: 'Azure DevOps' },
      update: {
        categoryId: cloudCategory.id,
        description: 'CI/CD pipelines, work item tracking, and Azure integration',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      create: {
        name: 'Azure DevOps',
        categoryId: cloudCategory.id,
        description: 'CI/CD pipelines, work item tracking, and Azure integration',
        proficiencyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }),
  ]);

  console.log(`✅ Created ${skills.length} skills\n`);

  // ============================================================================
  // STEP 7: Create role competencies for common roles
  // ============================================================================
  console.log('📊 Creating role competencies...');

  // Find common roles for competency mapping
  const softwareEngineerRole = await prisma.jobRole.findFirst({ where: { name: 'Software Engineer' } });
  const seniorEngineerRole = await prisma.jobRole.findFirst({ where: { name: 'Senior Software Engineer' } });
  const applicationEngineerRole = await prisma.jobRole.findFirst({ where: { name: 'Application Engineer' } });
  const principalEngineerRole = await prisma.jobRole.findFirst({ where: { name: 'Principal Engineer' } });

  // Create role competencies with new structure (only for roles that exist)
  const roleCompetencies = [];

  if (softwareEngineerRole) {
    roleCompetencies.push(
      { roleId: softwareEngineerRole.id, skillId: skills[0].id, requiredLevel: 'Intermediate', priority: 'REQUIRED' as const },
      { roleId: softwareEngineerRole.id, skillId: skills[1].id, requiredLevel: 'Intermediate', priority: 'REQUIRED' as const },
      { roleId: softwareEngineerRole.id, skillId: skills[4].id, requiredLevel: 'Beginner', priority: 'REQUIRED' as const },
      { roleId: softwareEngineerRole.id, skillId: skills[7].id, requiredLevel: 'Intermediate', priority: 'REQUIRED' as const },
      { roleId: softwareEngineerRole.id, skillId: skills[8].id, requiredLevel: 'Beginner', priority: 'PREFERRED' as const }
    );
  }

  if (seniorEngineerRole) {
    roleCompetencies.push(
      { roleId: seniorEngineerRole.id, skillId: skills[0].id, requiredLevel: 'Advanced', priority: 'REQUIRED' as const },
      { roleId: seniorEngineerRole.id, skillId: skills[1].id, requiredLevel: 'Advanced', priority: 'REQUIRED' as const },
      { roleId: seniorEngineerRole.id, skillId: skills[2].id, requiredLevel: 'Intermediate', priority: 'REQUIRED' as const },
      { roleId: seniorEngineerRole.id, skillId: skills[5].id, requiredLevel: 'Advanced', priority: 'REQUIRED' as const },
      { roleId: seniorEngineerRole.id, skillId: skills[8].id, requiredLevel: 'Intermediate', priority: 'REQUIRED' as const }
    );
  }

  if (applicationEngineerRole) {
    roleCompetencies.push(
      { roleId: applicationEngineerRole.id, skillId: skills[0].id, requiredLevel: 'Intermediate', priority: 'REQUIRED' as const },
      { roleId: applicationEngineerRole.id, skillId: skills[2].id, requiredLevel: 'Advanced', priority: 'REQUIRED' as const },
      { roleId: applicationEngineerRole.id, skillId: skills[3].id, requiredLevel: 'Advanced', priority: 'REQUIRED' as const },
      { roleId: applicationEngineerRole.id, skillId: skills[4].id, requiredLevel: 'Intermediate', priority: 'REQUIRED' as const }
    );
  }

  if (principalEngineerRole) {
    roleCompetencies.push(
      { roleId: principalEngineerRole.id, skillId: skills[0].id, requiredLevel: 'Expert', priority: 'REQUIRED' as const },
      { roleId: principalEngineerRole.id, skillId: skills[1].id, requiredLevel: 'Expert', priority: 'REQUIRED' as const },
      { roleId: principalEngineerRole.id, skillId: skills[2].id, requiredLevel: 'Advanced', priority: 'REQUIRED' as const },
      { roleId: principalEngineerRole.id, skillId: skills[5].id, requiredLevel: 'Expert', priority: 'REQUIRED' as const },
      { roleId: principalEngineerRole.id, skillId: skills[9].id, requiredLevel: 'Advanced', priority: 'REQUIRED' as const }
    );
  }

  if (roleCompetencies.length > 0) {
    // Use upsert for each role competency to handle existing ones
    for (const competency of roleCompetencies) {
      await prisma.roleCompetency.upsert({
        where: {
          roleId_skillId: {
            roleId: competency.roleId,
            skillId: competency.skillId,
          },
        },
        update: {
          requiredLevel: competency.requiredLevel,
          priority: competency.priority,
        },
        create: competency,
      });
    }
  }

  console.log(`✅ Created ${roleCompetencies.length} role competencies\n`);

  // ============================================================================
  // STEP 8: Create demo assessments
  // ============================================================================
  console.log('📝 Creating demo assessments...');

  // Get an admin user for createdById
  const adminUser = await prisma.user.findFirst({
    where: {
      systemRoles: {
        has: 'ADMIN'
      }
    }
  });
  if (!adminUser) throw new Error('No admin user found');

  const assessments = await Promise.all([
    prisma.assessment.create({
      data: {
        title: 'C# Fundamentals Assessment',
        description: 'Basic C# programming concepts including OOP, LINQ, and async programming',
        skillId: skills[0].id,
        totalMarks: 100,
        passingScore: 60,
        duration: 60,
        status: 'PUBLISHED' as AssessmentStatus,
        isPreAssessment: true,
        createdById: adminUser.id,
      },
    }),
    prisma.assessment.create({
      data: {
        title: '.NET Blazor Basics',
        description: 'Introduction to Blazor components, data binding, and event handling',
        skillId: skills[2].id,
        totalMarks: 80,
        passingScore: 48,
        duration: 45,
        status: 'PUBLISHED' as AssessmentStatus,
        isPreAssessment: true,
        createdById: adminUser.id,
      },
    }),
    prisma.assessment.create({
      data: {
        title: 'Full Stack .NET Assessment',
        description: 'Comprehensive assessment covering Blazor, Web API, and Entity Framework',
        skillId: skills[1].id,
        totalMarks: 150,
        passingScore: 90,
        duration: 90,
        status: 'PUBLISHED' as AssessmentStatus,
        isPreAssessment: false,
        createdById: adminUser.id,
      },
    }),
  ]);

  console.log(`✅ Created ${assessments.length} assessments\n`);

  // ============================================================================
  // STEP 9: Create demo questions for assessments
  // ============================================================================
  console.log('❓ Creating demo questions...');

  // C# Fundamentals questions
  const csharpQuestions = [
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id, // C# Programming
      questionText: 'What is the correct syntax to define a class in C#?',
      questionType: 'MCQ' as QuestionType,
      options: ['class MyClass { }', 'Class MyClass { }', 'def class MyClass:', 'MyClass class { }'],
      correctAnswer: 'class MyClass { }',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 1,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'C# is a statically typed language',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 5,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 2,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'The keyword to define a constant in C# is ____',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: 'const',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 3,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'What does LINQ stand for?',
      questionType: 'MCQ' as QuestionType,
      options: ['Language Integrated Query', 'Linear Integrated Query', 'Language Interface Query', 'Linked Query'],
      correctAnswer: 'Language Integrated Query',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 4,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'Explain the difference between async and await keywords in C#',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 20,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 5,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'What is the purpose of using statements in C#?',
      questionType: 'MCQ' as QuestionType,
      options: ['Import namespaces', 'Dispose resources', 'Both A and B', 'None of the above'],
      correctAnswer: 'Both A and B',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 6,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'Interfaces in C# can contain method implementations',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 5,
      difficultyLevel: 'ADVANCED' as CompetencyLevel,
      orderIndex: 7,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'The access modifier that allows access only within the same class is ____',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: 'private',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 8,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'Which of these is NOT a valid access modifier in C#?',
      questionType: 'MCQ' as QuestionType,
      options: ['private', 'protected', 'package', 'internal'],
      correctAnswer: 'package',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 9,
    },
    {
      assessmentId: assessments[0].id,
      skillId: skills[0].id,
      questionText: 'Describe the concept of dependency injection in C# and its benefits',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 20,
      difficultyLevel: 'ADVANCED' as CompetencyLevel,
      orderIndex: 10,
    },
  ];

  // Blazor Basics questions
  const blazorQuestions = [
    {
      assessmentId: assessments[1].id,
      skillId: skills[2].id, // .NET Blazor
      questionText: 'What is the file extension for Blazor components?',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: '.razor',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 1,
    },
    {
      assessmentId: assessments[1].id,
      skillId: skills[2].id,
      questionText: 'How do you bind a property to an input element in Blazor?',
      questionType: 'MCQ' as QuestionType,
      options: ['@bind', '@model', '@value', '@data'],
      correctAnswer: '@bind',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 2,
    },
    {
      assessmentId: assessments[1].id,
      skillId: skills[2].id,
      questionText: 'Blazor WebAssembly runs on the server',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'false',
      marks: 5,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 3,
    },
    {
      assessmentId: assessments[1].id,
      skillId: skills[2].id,
      questionText: 'What directive is used to inject a service in a Blazor component?',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: '@inject',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 4,
    },
    {
      assessmentId: assessments[1].id,
      skillId: skills[2].id,
      questionText: 'Which lifecycle method is called when a component is initialized?',
      questionType: 'MCQ' as QuestionType,
      options: ['OnInitialized', 'OnParametersSet', 'OnAfterRender', 'OnStart'],
      correctAnswer: 'OnInitialized',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 5,
    },
    {
      assessmentId: assessments[1].id,
      skillId: skills[2].id,
      questionText: 'Explain the difference between Blazor Server and Blazor WebAssembly',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 15,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 6,
    },
    {
      assessmentId: assessments[1].id,
      skillId: skills[2].id,
      questionText: 'Event handlers in Blazor use the @ prefix',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 5,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 7,
    },
    {
      assessmentId: assessments[1].id,
      skillId: skills[2].id,
      questionText: 'Describe how cascading parameters work in Blazor components',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 15,
      difficultyLevel: 'ADVANCED' as CompetencyLevel,
      orderIndex: 8,
    },
  ];

  // Full Stack questions
  const fullStackQuestions = [
    {
      assessmentId: assessments[2].id,
      skillId: skills[1].id, // ASP.NET Core
      questionText: 'What is Entity Framework Core?',
      questionType: 'MCQ' as QuestionType,
      options: ['ORM for .NET', 'Database engine', 'Web framework', 'Testing framework'],
      correctAnswer: 'ORM for .NET',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 1,
    },
    {
      assessmentId: assessments[2].id,
      skillId: skills[1].id,
      questionText: 'RESTful APIs use HTTP methods like GET, POST, PUT, DELETE',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 2,
    },
    {
      assessmentId: assessments[2].id,
      skillId: skills[1].id,
      questionText: 'The attribute used to define a route in ASP.NET Core is ____',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: '[Route]',
      marks: 15,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 3,
    },
    {
      assessmentId: assessments[2].id,
      skillId: skills[1].id,
      questionText: 'Which of these is used for authentication in ASP.NET Core?',
      questionType: 'MCQ' as QuestionType,
      options: ['JWT', 'Cookies', 'OAuth', 'All of the above'],
      correctAnswer: 'All of the above',
      marks: 15,
      difficultyLevel: 'ADVANCED' as CompetencyLevel,
      orderIndex: 4,
    },
    {
      assessmentId: assessments[2].id,
      skillId: skills[1].id,
      questionText: 'Code First approach in EF Core allows creating database from C# models',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 5,
    },
    {
      assessmentId: assessments[2].id,
      skillId: skills[1].id,
      questionText: 'Explain the repository pattern and its benefits in a .NET application',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 40,
      difficultyLevel: 'ADVANCED' as CompetencyLevel,
      orderIndex: 6,
    },
    {
      assessmentId: assessments[2].id,
      skillId: skills[1].id,
      questionText: 'Design a simple REST API structure for a blog application with posts and comments. Include endpoints and HTTP methods.',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 50,
      difficultyLevel: 'EXPERT' as CompetencyLevel,
      orderIndex: 7,
    },
  ];

  await prisma.question.createMany({
    data: [...csharpQuestions, ...blazorQuestions, ...fullStackQuestions]
  });

  const totalQuestions = csharpQuestions.length + blazorQuestions.length + fullStackQuestions.length;
  console.log(`✅ Created ${totalQuestions} questions across all assessments\n`);

  // ============================================================================
  // STEP 10: Create system configuration
  // ============================================================================
  console.log('⚙️  Creating system configuration...');

  const systemConfigs = [
    { key: 'inductionDuration', value: '45', description: 'Induction period duration in days' },
    { key: 'passingScorePercentage', value: '60', description: 'Minimum passing score percentage' },
    { key: 'progressUpdateFrequency', value: '7', description: 'Progress update frequency in days' },
    { key: 'postTrainingAssessmentDelay', value: '30', description: 'Days after training completion to conduct post-assessment' },
    { key: 'maxOTPAttempts', value: '3', description: 'Maximum OTP verification attempts' },
    { key: 'otpExpiryMinutes', value: '5', description: 'OTP expiry time in minutes' },
  ];

  // Use upsert for each system config to handle existing ones
  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        description: config.description,
      },
      create: config,
    });
  }

  console.log(`✅ Created ${systemConfigs.length} system configurations\n`);

  // ============================================================================
  // STEP 11: Create initial skill matrix for sample employees
  // ============================================================================
  console.log('📈 Creating initial skill matrix...');

  // Select software engineers for skill matrix
  const softwareEngineers = await prisma.user.findMany({
    where: {
      OR: [
        { designation: { contains: 'Software Engineer' } },
        { designation: { contains: 'Application Engineer' } },
        { designation: { contains: 'Principal Engineer' } },
      ],
    },
    take: 10,
  });

  const skillMatrixData = [];

  for (const engineer of softwareEngineers) {
    // Skip if designation is null
    if (!engineer.designation) continue;

    // Determine job role based on designation
    let jobRole = 'Software Engineer';
    if (engineer.designation.includes('Senior')) {
      jobRole = 'Senior Software Engineer';
    } else if (engineer.designation.includes('Principal')) {
      jobRole = 'Principal Engineer';
    } else if (engineer.designation.includes('Application')) {
      jobRole = 'Application Engineer';
    }

    // Get relevant skills for this role from roleCompetencies array
    // Note: This is simplified since we created roleCompetencies earlier
    // In production, you'd query from database by roleId
  }

  // Commented out skill matrix creation since we don't have a proper way to map
  // old role competency structure to new JobRole-based structure in seed
  // This should be handled in the application UI
  // if (skillMatrixData.length > 0) {
  //   await prisma.skillMatrix.createMany({ data: skillMatrixData });
  // }

  console.log(`✅ Skipped skill matrix creation (should be done through UI)\n`);

  console.log('🎉 Database seeding completed successfully!\n');

  // Print summary
  const userCount = await prisma.user.count();
  const skillCount = await prisma.skill.count();
  const assessmentCount = await prisma.assessment.count();
  const questionCount = await prisma.question.count();

  console.log('📊 Summary:');
  console.log(`   Users: ${userCount}`);
  console.log(`   Skills: ${skillCount}`);
  console.log(`   Assessments: ${assessmentCount}`);
  console.log(`   Questions: ${questionCount}`);
  console.log(`   Role Competencies: ${roleCompetencies.length}`);
  console.log(`   Skill Matrix Records: ${skillMatrixData.length}`);
  console.log(`   System Configs: ${systemConfigs.length}`);
}

// Execute seed function
main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
