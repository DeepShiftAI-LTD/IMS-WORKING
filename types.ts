

export enum Role {
  STUDENT = 'STUDENT',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum LogStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum ReportType {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ACHIEVED = 'ACHIEVED'
}

export enum FeedbackType {
  PRAISE = 'PRAISE',
  GROWTH = 'GROWTH'
}

export enum EvaluationType {
  MID_TERM = 'MID_TERM',
  FINAL = 'FINAL'
}

export enum NotificationType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  ALERT = 'ALERT',
  INFO = 'INFO'
}

export enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum LeaveType {
    SICK = 'SICK',
    VACATION = 'VACATION',
    PERSONAL = 'PERSONAL',
    UNIVERSITY_EVENT = 'UNIVERSITY_EVENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added password field
  role: Role;
  status: UserStatus; // Added status field
  avatar: string;
  totalHoursRequired?: number;
  assignedSupervisorId?: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
  // Profile Fields
  institution?: string;
  department?: string;
  bio?: string;
  phone?: string;
  hobbies?: string[];
  profileSkills?: string[]; // Self-listed skills for profile display
  achievements?: string[];
  futureGoals?: string[];
  supervisorNotes?: string; // Private notes for supervisor
}

export interface TaskDeliverable {
  url?: string;
  notes: string;
  submittedAt: string;
}

export interface TaskFeedback {
  type: FeedbackType;
  comment: string;
  givenAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedById: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  deliverable?: TaskDeliverable;
  feedback?: TaskFeedback;
  linkedGoalId?: string;
}

export interface LogEntry {
  id: string;
  studentId: string;
  date: string;
  hoursWorked: number;
  activityDescription: string;
  challenges?: string;
  status: LogStatus;
  supervisorComment?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  supervisorId: string;
  metric: string;
  score: number;
  comments: string;
}

export interface Report {
  id: string;
  studentId: string;
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  summary: string;
  keyLearnings: string;
  nextSteps: string;
  submittedAt: string;
}

export interface Goal {
  id: string;
  studentId: string;
  description: string;
  category: string;
  alignment: string;
  status: GoalStatus;
  progress: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'LINK' | 'ZIP' | 'IMAGE';
  url: string;
  uploadedBy: string;
  uploadDate: string;
}

export interface EvaluationCriteria {
  category: string;
  score: number;
  comment?: string;
}

export interface Evaluation {
  id: string;
  studentId: string;
  supervisorId: string;
  type: EvaluationType;
  date: string;
  scores: EvaluationCriteria[];
  overallFeedback: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  channel: 'DIRECT' | 'GROUP';
  relatedStudentId: string;
}

export interface Meeting {
  id: string;
  title: string;
  organizerId: string;
  date: string;
  time: string;
  attendees: string[];
  link?: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: 'Technical' | 'Soft Skill' | 'Business';
}

export interface SkillAssessment {
  id: string;
  studentId: string;
  raterId: string;
  role: Role;
  date: string;
  ratings: { skillId: string; score: number }[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  points: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
}

export interface LeaveRequest {
    id: string;
    studentId: string;
    startDate: string;
    endDate: string;
    type: LeaveType;
    reason: string;
    status: LeaveStatus;
}

export interface SiteVisit {
    id: string;
    studentId: string;
    visitorId: string;
    date: string;
    location: string;
    purpose: string;
    notes: string;
}

export interface AttendanceException {
    id: string;
    studentId: string; // Can be 'ALL' for global holidays
    date: string;
    reason: string;
    type: 'EXCUSED' | 'HOLIDAY';
}