
import { Role, User, UserStatus, Task, TaskStatus, TaskPriority, LogEntry, LogStatus, Report, ReportType, Goal, GoalStatus, Resource, FeedbackType, Evaluation, EvaluationType, Message, Meeting, Skill, SkillAssessment, Notification, NotificationType, Badge, UserBadge, LeaveRequest, LeaveType, LeaveStatus, SiteVisit, AttendanceException } from './types';

// Dynamic Date Helper
const getRelativeDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    // Use local YYYY-MM-DD
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
};

const getRelativeTime = (hours: number): string => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    return d.toISOString();
};

// Company Coordinates (Updated: 0.32936393472140163, 32.614417541438584)
export const COMPANY_LOCATION = {
    latitude: 0.32936393472140163,
    longitude: 32.614417541438584,
    radiusKm: 0.5 // Intern must be within 0.5km
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Intern',
    email: 'alex@uni.edu',
    password: '123',
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
    avatar: 'https://picsum.photos/seed/alex/200/200',
    totalHoursRequired: 120,
    assignedSupervisorId: 'u2',
    internshipStartDate: getRelativeDate(-30), // Started 30 days ago
    internshipEndDate: getRelativeDate(90),    // Ends in 90 days
    institution: 'Tech University',
    department: 'Computer Science',
    bio: 'Aspiring software engineer passionate about full-stack development and AI integration. eager to learn and contribute to real-world projects.',
    phone: '+1 (555) 123-4567',
    hobbies: ['Photography', 'Hiking', 'Gaming'],
    profileSkills: ['React', 'TypeScript', 'Node.js', 'UI Design'],
    achievements: ['Dean\'s List 2024', 'Hackathon Runner-up 2023', 'Published Technical Blog Post'],
    futureGoals: ['Become a Senior Full Stack Developer', 'Contribute to a major Open Source project', 'Start a tech consultancy']
  },
  {
    id: 'u2',
    name: 'Sarah Supervisor',
    email: 'sarah@corp.com',
    password: '123',
    role: Role.SUPERVISOR,
    status: UserStatus.ACTIVE,
    avatar: 'https://picsum.photos/seed/sarah/200/200',
    institution: 'Tech Corp Inc.',
    department: 'Engineering Management',
    bio: 'Senior Engineering Manager with 10+ years of experience in shipping scalable software products.',
  },
  {
    id: 'u3',
    name: 'Mike Mentor',
    email: 'mike@techcorp.com',
    password: '123',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    avatar: 'https://picsum.photos/seed/mike/200/200',
    institution: 'Tech Corp Inc.',
    department: 'DevOps',
    bio: 'Lead DevOps Engineer.',
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Setup Development Environment',
    description: 'Install Node.js, VS Code, and clone the repository.',
    assignedToId: 'u1',
    assignedById: 'u2',
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.HIGH,
    dueDate: getRelativeDate(-5),
    createdAt: getRelativeDate(-10),
    deliverable: {
      notes: 'Environment setup complete. Screenshot attached.',
      url: 'https://example.com/screenshot.png',
      submittedAt: getRelativeTime(-48)
    },
    feedback: {
        type: FeedbackType.PRAISE,
        comment: 'Excellent turnaround time. The documentation screenshot was very clear.',
        givenAt: getRelativeTime(-24)
    }
  },
  {
    id: 't2',
    title: 'Database Schema Design',
    description: 'Draft the initial ER diagram for the new module.',
    assignedToId: 'u1',
    assignedById: 'u2',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueDate: getRelativeDate(5),
    createdAt: getRelativeDate(-2)
  },
  {
    id: 't3',
    title: 'API Documentation',
    description: 'Document the user endpoints using Swagger.',
    assignedToId: 'u1',
    assignedById: 'u2',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: getRelativeDate(10),
    createdAt: getRelativeDate(-1)
  },
  {
    id: 't4',
    title: 'Implement Search Functionality',
    description: 'Add a search bar to the student dashboard to filter tasks by keyword.',
    assignedToId: 'u1',
    assignedById: 'u2',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDate: getRelativeDate(15),
    createdAt: getRelativeDate(0)
  }
];

export const MOCK_LOGS: LogEntry[] = [
  {
    id: 'l1',
    studentId: 'u1',
    date: getRelativeDate(-2),
    hoursWorked: 6,
    activityDescription: 'Worked on the database schema. Researching best practices for normalization.',
    challenges: 'Had trouble understanding foreign key constraints in the legacy DB.',
    status: LogStatus.APPROVED,
    supervisorComment: 'Good start, ask John for help with the legacy DB.'
  },
  {
    id: 'l2',
    studentId: 'u1',
    date: getRelativeDate(-1),
    hoursWorked: 8,
    activityDescription: 'Completed the first draft of ERD. Started setting up the migration scripts.',
    status: LogStatus.PENDING
  }
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'r1',
    studentId: 'u1',
    type: ReportType.WEEKLY,
    periodStart: getRelativeDate(-7),
    periodEnd: getRelativeDate(0),
    summary: 'Focused heavily on backend architecture. Completed environment setup and initial DB design.',
    keyLearnings: 'Learned about Prisma ORM and PostgreSQL specific indexing.',
    nextSteps: 'Start coding the API endpoints for User Auth.',
    submittedAt: getRelativeTime(-2)
  }
];

export const MOCK_GOALS: Goal[] = [
  {
    id: 'g1',
    studentId: 'u1',
    description: 'Master TypeORM for Node.js applications',
    category: 'Technical Skill',
    alignment: 'CLO-3: Backend Development Proficiency',
    status: GoalStatus.IN_PROGRESS,
    progress: 40
  },
  {
    id: 'g2',
    studentId: 'u1',
    description: 'Lead the daily stand-up meeting at least once',
    category: 'Soft Skills',
    alignment: 'CLO-5: Professional Communication',
    status: GoalStatus.NOT_STARTED,
    progress: 0
  }
];

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res1',
    title: 'Internship Handbook 2025',
    type: 'PDF',
    url: '#',
    uploadedBy: 'u2',
    uploadDate: getRelativeDate(-30)
  },
  {
    id: 'res2',
    title: 'Weekly Report Template',
    type: 'DOC',
    url: '#',
    uploadedBy: 'u2',
    uploadDate: getRelativeDate(-30)
  }
];

export const MOCK_EVALUATIONS: Evaluation[] = [
    {
        id: 'e1',
        studentId: 'u1',
        supervisorId: 'u2',
        type: EvaluationType.MID_TERM,
        date: getRelativeDate(-10),
        scores: [
            { category: 'Quality of Work', score: 4 },
            { category: 'Communication', score: 3 },
            { category: 'Initiative', score: 5 },
            { category: 'Punctuality', score: 5 }
        ],
        overallFeedback: 'Alex is doing great technically. I would like to see more vocal participation in team meetings.'
    }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'u1',
    content: 'Hi Sarah, I had a question about the evaluation form.',
    timestamp: getRelativeTime(-48),
    channel: 'DIRECT',
    relatedStudentId: 'u1'
  },
  {
    id: 'm2',
    senderId: 'u2',
    content: 'Sure Alex, happy to help. Let\'s discuss in our check-in.',
    timestamp: getRelativeTime(-47.5),
    channel: 'DIRECT',
    relatedStudentId: 'u1'
  },
  {
    id: 'm3',
    senderId: 'u1',
    content: 'I have uploaded the final DB schema.',
    timestamp: getRelativeTime(-24),
    channel: 'GROUP',
    relatedStudentId: 'u1'
  }
];

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'mt1',
    title: 'Weekly Check-in',
    organizerId: 'u2',
    date: getRelativeDate(2),
    time: '14:00',
    attendees: ['u1', 'u2'],
    link: 'https://meet.google.com/abc-defg-hij'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        recipientId: 'ALL',
        senderId: 'u2',
        title: 'Office Closure Reminder',
        message: 'The office will be closed this Thursday for company retreat.',
        type: NotificationType.ANNOUNCEMENT,
        timestamp: getRelativeTime(-72),
        read: false
    },
    {
        id: 'n2',
        recipientId: 'u1',
        senderId: 'SYSTEM',
        title: 'Task Overdue',
        message: 'The task "API Documentation" is approaching deadline.',
        type: NotificationType.ALERT,
        timestamp: getRelativeTime(0),
        read: false
    }
];

export const MOCK_SKILLS: Skill[] = [
  { id: 's1', name: 'Python Proficiency', category: 'Technical' },
  { id: 's2', name: 'Agile Methodology', category: 'Business' },
  { id: 's3', name: 'Public Speaking', category: 'Soft Skill' },
  { id: 's4', name: 'Data Analysis', category: 'Technical' },
  { id: 's5', name: 'Team Collaboration', category: 'Soft Skill' },
];

export const MOCK_SKILL_ASSESSMENTS: SkillAssessment[] = [
  {
    id: 'sa1',
    studentId: 'u1',
    raterId: 'u1',
    role: Role.STUDENT,
    date: getRelativeDate(-30),
    ratings: [
      { skillId: 's1', score: 2 },
      { skillId: 's2', score: 1 },
      { skillId: 's3', score: 3 },
      { skillId: 's4', score: 2 },
      { skillId: 's5', score: 4 },
    ]
  },
  {
    id: 'sa2',
    studentId: 'u1',
    raterId: 'u2',
    role: Role.SUPERVISOR,
    date: getRelativeDate(-28),
    ratings: [
      { skillId: 's1', score: 2 },
      { skillId: 's2', score: 2 },
      { skillId: 's3', score: 2 },
      { skillId: 's4', score: 2 },
      { skillId: 's5', score: 3 },
    ]
  },
  {
    id: 'sa3',
    studentId: 'u1',
    raterId: 'u1',
    role: Role.STUDENT,
    date: getRelativeDate(-1),
    ratings: [
      { skillId: 's1', score: 4 },
      { skillId: 's2', score: 3 },
      { skillId: 's3', score: 3 },
      { skillId: 's4', score: 3 },
      { skillId: 's5', score: 5 },
    ]
  },
  {
    id: 'sa4',
    studentId: 'u1',
    raterId: 'u2',
    role: Role.SUPERVISOR,
    date: getRelativeDate(0),
    ratings: [
      { skillId: 's1', score: 4 },
      { skillId: 's2', score: 3 },
      { skillId: 's3', score: 3 },
      { skillId: 's4', score: 3 },
      { skillId: 's5', score: 4 },
    ]
  }
];

export const MOCK_BADGES: Badge[] = [
    { 
        id: 'b1', 
        name: 'The Early Bird', 
        description: 'Completing a time log 5 days in a row.', 
        icon: 'Clock', 
        color: 'bg-amber-100 text-amber-600 border-amber-200', 
        points: 50 
    },
    { 
        id: 'b2', 
        name: 'Task Master', 
        description: 'Completing 10 tasks ahead of deadline.', 
        icon: 'CheckCircle', 
        color: 'bg-emerald-100 text-emerald-600 border-emerald-200', 
        points: 100 
    },
    { 
        id: 'b3', 
        name: 'Networking Ninja', 
        description: 'Attending 3 check-in meetings.', 
        icon: 'Users', 
        color: 'bg-blue-100 text-blue-600 border-blue-200', 
        points: 75 
    },
    { 
        id: 'b4', 
        name: 'Impact Player', 
        description: 'Receiving "Praise" feedback on a high-priority project.', 
        icon: 'Star', 
        color: 'bg-purple-100 text-purple-600 border-purple-200', 
        points: 150 
    },
];

export const MOCK_USER_BADGES: UserBadge[] = [
    { id: 'ub1', userId: 'u1', badgeId: 'b1', earnedAt: getRelativeDate(-10) },
    { id: 'ub2', userId: 'u1', badgeId: 'b4', earnedAt: getRelativeDate(-5) }
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
    {
        id: 'lr1',
        studentId: 'u1',
        startDate: getRelativeDate(10),
        endDate: getRelativeDate(10),
        type: LeaveType.SICK,
        reason: 'Dental appointment',
        status: LeaveStatus.PENDING
    }
];

export const MOCK_SITE_VISITS: SiteVisit[] = [
    {
        id: 'sv1',
        studentId: 'u1',
        visitorId: 'u2',
        date: getRelativeDate(-15),
        location: 'Tech Corp HQ, Floor 4',
        purpose: 'Monthly progress check-in',
        notes: 'Met with the company mentor. Intern has settled in well. Workspace is adequate.'
    }
];

export const MOCK_ATTENDANCE_EXCEPTIONS: AttendanceException[] = [
    {
        id: 'ae1',
        studentId: 'ALL',
        date: getRelativeDate(20), // Future holiday
        reason: 'Company Retreat',
        type: 'HOLIDAY'
    }
];

export const APP_NAME = "DEEP SHIFT";
