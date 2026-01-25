import { PrismaClient, Role, CompetencyLevel, AssessmentStatus, QuestionType } from '../node_modules/.prisma/client';
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
    await prisma.skill.deleteMany();
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
  // STEP 3: Create users from employee data
  // ============================================================================
  console.log('👥 Creating users...');

  // Helper function to determine role based on designation
  const determineRole = (designation: string): Role => {
    const lowerDesignation = designation.toLowerCase();

    if (lowerDesignation.includes('managing director') || lowerDesignation.includes('director')) {
      return 'ADMIN';
    }
    if (lowerDesignation.includes('manager') || lowerDesignation.includes('lead')) {
      return 'MANAGER';
    }
    if (lowerDesignation.includes('trainer') || lowerDesignation.includes('mentor')) {
      return 'TRAINER';
    }
    return 'EMPLOYEE';
  };

  // First pass: Create all users without manager relationships
  const idMapping = new Map<number, string>(); // Map old ID to new cuid

  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        employeeNo: emp.employeeNo,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        location: emp.location,
        level: emp.level,
        resigned: emp.resigned || false,
        role: determineRole(emp.designation),
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

  console.log(`✅ Created ${employees.length} users with manager relationships\n`);

  // ============================================================================
  // STEP 4: Create demo skills (C# .NET Blazor focus)
  // ============================================================================
  console.log('🎯 Creating demo skills...');

  const skills = await Promise.all([
    prisma.skill.create({
      data: {
        skillName: 'C# Programming',
        category: 'Programming Language',
        description: 'Object-oriented programming with C# including LINQ, async/await, and modern language features',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: '.NET Core Framework',
        category: 'Framework',
        description: 'Cross-platform .NET development including dependency injection, configuration, and middleware',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: 'Blazor WebAssembly',
        category: 'Framework',
        description: 'Client-side Blazor applications with component architecture and state management',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: 'Blazor Server',
        category: 'Framework',
        description: 'Server-side Blazor with SignalR for real-time UI updates',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: 'Entity Framework Core',
        category: 'Database',
        description: 'ORM for .NET including migrations, LINQ queries, and database relationships',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: 'ASP.NET Core Web API',
        category: 'Framework',
        description: 'RESTful API development with ASP.NET Core including authentication and authorization',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: 'SQL Server',
        category: 'Database',
        description: 'T-SQL, stored procedures, indexes, and query optimization',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: 'Git Version Control',
        category: 'DevOps',
        description: 'Version control workflows, branching strategies, and collaboration',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: 'Unit Testing (xUnit)',
        category: 'Testing',
        description: 'Test-driven development with xUnit, testing patterns, and mocking',
      },
    }),
    prisma.skill.create({
      data: {
        skillName: 'Azure DevOps',
        category: 'DevOps',
        description: 'CI/CD pipelines, work item tracking, and Azure integration',
      },
    }),
  ]);

  console.log(`✅ Created ${skills.length} skills\n`);

  // ============================================================================
  // STEP 5: Create role competencies
  // ============================================================================
  console.log('📊 Creating role competencies...');

  const roleCompetencies = [
    // Software Engineer
    { jobRole: 'Software Engineer', skillId: skills[0].id, requiredLevel: 'INTERMEDIATE' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Software Engineer', skillId: skills[1].id, requiredLevel: 'INTERMEDIATE' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Software Engineer', skillId: skills[4].id, requiredLevel: 'BEGINNER' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Software Engineer', skillId: skills[7].id, requiredLevel: 'INTERMEDIATE' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Software Engineer', skillId: skills[8].id, requiredLevel: 'BEGINNER' as CompetencyLevel, isMandatory: false },

    // Senior Software Engineer
    { jobRole: 'Senior Software Engineer', skillId: skills[0].id, requiredLevel: 'ADVANCED' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Senior Software Engineer', skillId: skills[1].id, requiredLevel: 'ADVANCED' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Senior Software Engineer', skillId: skills[2].id, requiredLevel: 'INTERMEDIATE' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Senior Software Engineer', skillId: skills[5].id, requiredLevel: 'ADVANCED' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Senior Software Engineer', skillId: skills[8].id, requiredLevel: 'INTERMEDIATE' as CompetencyLevel, isMandatory: true },

    // Application Engineer
    { jobRole: 'Application Engineer', skillId: skills[0].id, requiredLevel: 'INTERMEDIATE' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Application Engineer', skillId: skills[2].id, requiredLevel: 'ADVANCED' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Application Engineer', skillId: skills[3].id, requiredLevel: 'ADVANCED' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Application Engineer', skillId: skills[4].id, requiredLevel: 'INTERMEDIATE' as CompetencyLevel, isMandatory: true },

    // Principal Engineer
    { jobRole: 'Principal Engineer', skillId: skills[0].id, requiredLevel: 'EXPERT' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Principal Engineer', skillId: skills[1].id, requiredLevel: 'EXPERT' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Principal Engineer', skillId: skills[2].id, requiredLevel: 'ADVANCED' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Principal Engineer', skillId: skills[5].id, requiredLevel: 'EXPERT' as CompetencyLevel, isMandatory: true },
    { jobRole: 'Principal Engineer', skillId: skills[9].id, requiredLevel: 'ADVANCED' as CompetencyLevel, isMandatory: true },
  ];

  await prisma.roleCompetency.createMany({ data: roleCompetencies });

  console.log(`✅ Created ${roleCompetencies.length} role competencies\n`);

  // ============================================================================
  // STEP 6: Create demo assessments
  // ============================================================================
  console.log('📝 Creating demo assessments...');

  // Get an admin user for createdById
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
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
  // STEP 7: Create demo questions for assessments
  // ============================================================================
  console.log('❓ Creating demo questions...');

  // C# Fundamentals questions
  const csharpQuestions = [
    {
      assessmentId: assessments[0].id,
      questionText: 'What is the correct syntax to define a class in C#?',
      questionType: 'MCQ' as QuestionType,
      options: JSON.stringify(['class MyClass { }', 'Class MyClass { }', 'def class MyClass:', 'MyClass class { }']),
      correctAnswer: 'class MyClass { }',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 1,
    },
    {
      assessmentId: assessments[0].id,
      questionText: 'C# is a statically typed language',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 5,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 2,
    },
    {
      assessmentId: assessments[0].id,
      questionText: 'The keyword to define a constant in C# is ____',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: 'const',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 3,
    },
    {
      assessmentId: assessments[0].id,
      questionText: 'What does LINQ stand for?',
      questionType: 'MCQ' as QuestionType,
      options: JSON.stringify(['Language Integrated Query', 'Linear Integrated Query', 'Language Interface Query', 'Linked Query']),
      correctAnswer: 'Language Integrated Query',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 4,
    },
    {
      assessmentId: assessments[0].id,
      questionText: 'Explain the difference between async and await keywords in C#',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 20,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 5,
    },
    {
      assessmentId: assessments[0].id,
      questionText: 'What is the purpose of using statements in C#?',
      questionType: 'MCQ' as QuestionType,
      options: JSON.stringify(['Import namespaces', 'Dispose resources', 'Both A and B', 'None of the above']),
      correctAnswer: 'Both A and B',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 6,
    },
    {
      assessmentId: assessments[0].id,
      questionText: 'Interfaces in C# can contain method implementations',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 5,
      difficultyLevel: 'ADVANCED' as CompetencyLevel,
      orderIndex: 7,
    },
    {
      assessmentId: assessments[0].id,
      questionText: 'The access modifier that allows access only within the same class is ____',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: 'private',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 8,
    },
    {
      assessmentId: assessments[0].id,
      questionText: 'Which of these is NOT a valid access modifier in C#?',
      questionType: 'MCQ' as QuestionType,
      options: JSON.stringify(['private', 'protected', 'package', 'internal']),
      correctAnswer: 'package',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 9,
    },
    {
      assessmentId: assessments[0].id,
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
      questionText: 'What is the file extension for Blazor components?',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: '.razor',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 1,
    },
    {
      assessmentId: assessments[1].id,
      questionText: 'How do you bind a property to an input element in Blazor?',
      questionType: 'MCQ' as QuestionType,
      options: JSON.stringify(['@bind', '@model', '@value', '@data']),
      correctAnswer: '@bind',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 2,
    },
    {
      assessmentId: assessments[1].id,
      questionText: 'Blazor WebAssembly runs on the server',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'false',
      marks: 5,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 3,
    },
    {
      assessmentId: assessments[1].id,
      questionText: 'What directive is used to inject a service in a Blazor component?',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: '@inject',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 4,
    },
    {
      assessmentId: assessments[1].id,
      questionText: 'Which lifecycle method is called when a component is initialized?',
      questionType: 'MCQ' as QuestionType,
      options: JSON.stringify(['OnInitialized', 'OnParametersSet', 'OnAfterRender', 'OnStart']),
      correctAnswer: 'OnInitialized',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 5,
    },
    {
      assessmentId: assessments[1].id,
      questionText: 'Explain the difference between Blazor Server and Blazor WebAssembly',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 15,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 6,
    },
    {
      assessmentId: assessments[1].id,
      questionText: 'Event handlers in Blazor use the @ prefix',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 5,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 7,
    },
    {
      assessmentId: assessments[1].id,
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
      questionText: 'What is Entity Framework Core?',
      questionType: 'MCQ' as QuestionType,
      options: JSON.stringify(['ORM for .NET', 'Database engine', 'Web framework', 'Testing framework']),
      correctAnswer: 'ORM for .NET',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 1,
    },
    {
      assessmentId: assessments[2].id,
      questionText: 'RESTful APIs use HTTP methods like GET, POST, PUT, DELETE',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 10,
      difficultyLevel: 'BEGINNER' as CompetencyLevel,
      orderIndex: 2,
    },
    {
      assessmentId: assessments[2].id,
      questionText: 'The attribute used to define a route in ASP.NET Core is ____',
      questionType: 'FILL_BLANK' as QuestionType,
      correctAnswer: '[Route]',
      marks: 15,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 3,
    },
    {
      assessmentId: assessments[2].id,
      questionText: 'Which of these is used for authentication in ASP.NET Core?',
      questionType: 'MCQ' as QuestionType,
      options: JSON.stringify(['JWT', 'Cookies', 'OAuth', 'All of the above']),
      correctAnswer: 'All of the above',
      marks: 15,
      difficultyLevel: 'ADVANCED' as CompetencyLevel,
      orderIndex: 4,
    },
    {
      assessmentId: assessments[2].id,
      questionText: 'Code First approach in EF Core allows creating database from C# models',
      questionType: 'TRUE_FALSE' as QuestionType,
      correctAnswer: 'true',
      marks: 10,
      difficultyLevel: 'INTERMEDIATE' as CompetencyLevel,
      orderIndex: 5,
    },
    {
      assessmentId: assessments[2].id,
      questionText: 'Explain the repository pattern and its benefits in a .NET application',
      questionType: 'DESCRIPTIVE' as QuestionType,
      marks: 40,
      difficultyLevel: 'ADVANCED' as CompetencyLevel,
      orderIndex: 6,
    },
    {
      assessmentId: assessments[2].id,
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
  // STEP 8: Create system configuration
  // ============================================================================
  console.log('⚙️  Creating system configuration...');

  const systemConfigs = [
    { key: 'inductionDuration', value: 45, description: 'Induction period duration in days' },
    { key: 'passingScorePercentage', value: 60, description: 'Minimum passing score percentage' },
    { key: 'progressUpdateFrequency', value: 7, description: 'Progress update frequency in days' },
    { key: 'postTrainingAssessmentDelay', value: 30, description: 'Days after training completion to conduct post-assessment' },
    { key: 'maxOTPAttempts', value: 3, description: 'Maximum OTP verification attempts' },
    { key: 'otpExpiryMinutes', value: 5, description: 'OTP expiry time in minutes' },
  ];

  await prisma.systemConfig.createMany({
    data: systemConfigs.map(config => ({
      key: config.key,
      value: config.value,
      description: config.description,
    })),
  });

  console.log(`✅ Created ${systemConfigs.length} system configurations\n`);

  // ============================================================================
  // STEP 9: Create initial skill matrix for sample employees
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
    // Determine job role based on designation
    let jobRole = 'Software Engineer';
    if (engineer.designation.includes('Senior')) {
      jobRole = 'Senior Software Engineer';
    } else if (engineer.designation.includes('Principal')) {
      jobRole = 'Principal Engineer';
    } else if (engineer.designation.includes('Application')) {
      jobRole = 'Application Engineer';
    }

    // Get relevant skills for this role
    const relevantCompetencies = roleCompetencies.filter(rc => rc.jobRole === jobRole);

    for (const competency of relevantCompetencies) {
      skillMatrixData.push({
        userId: engineer.id,
        skillId: competency.skillId,
        desiredLevel: competency.requiredLevel,
        currentLevel: null, // Will be filled after assessment
        gapPercentage: 100, // 100% gap initially
        status: 'gap_identified',
      });
    }
  }

  if (skillMatrixData.length > 0) {
    await prisma.skillMatrix.createMany({ data: skillMatrixData });
  }

  console.log(`✅ Created ${skillMatrixData.length} skill matrix records for ${softwareEngineers.length} engineers\n`);

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
