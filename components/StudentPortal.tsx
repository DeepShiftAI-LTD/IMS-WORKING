

import React, { useState, useMemo, useEffect } from 'react';
import { User, LogEntry, Task, TaskStatus, LogStatus, Report, ReportType, Goal, Resource, GoalStatus, TaskDeliverable, Evaluation, Message, Meeting, Skill, SkillAssessment, Role, Badge, UserBadge, LeaveRequest, LeaveType, LeaveStatus, SiteVisit } from '../types';
import { Button, Card, StatusBadge, ScoreBar, FeedbackBadge } from './UI';
import { TaskBoard } from './TaskBoard';
import { SkillTracker } from './SkillTracker';
import { Gamification } from './Gamification';
import { AttendanceCalendar } from './AttendanceCalendar';
import { Plus, BookOpen, CheckSquare, Wand2, Clock, Calendar, FileText, Target, Download, LayoutDashboard, ChevronRight, Paperclip, AlertTriangle, UploadCloud, Award, MessageSquare, Send, Video, BarChart2, Medal, User as UserIcon, Mail, Phone, MapPin, Briefcase, Camera, Save, Trophy, Rocket, BellRing, Map, CalendarOff, AlertCircle, CalendarCheck, Book, Zap, Heart } from 'lucide-react';
import { improveLogEntry } from '../services/geminiService';
import { COMPANY_LOCATION, MOCK_ATTENDANCE_EXCEPTIONS } from '../constants';

interface StudentPortalProps {
  user: User;
  users: User[];
  logs: LogEntry[];
  tasks: Task[];
  reports: Report[];
  goals: Goal[];
  resources: Resource[];
  evaluations: Evaluation[];
  messages: Message[];
  meetings: Meeting[];
  skills: Skill[];
  skillAssessments: SkillAssessment[];
  badges: Badge[];
  userBadges: UserBadge[];
  leaveRequests: LeaveRequest[];
  siteVisits: SiteVisit[];
  onAddLog: (log: Omit<LogEntry, 'id' | 'status'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onAddReport: (report: Omit<Report, 'id' | 'submittedAt'>) => void;
  onUpdateGoal: (goal: Goal) => void;
  onSubmitDeliverable: (taskId: string, deliverable: TaskDeliverable) => void;
  onSendMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  onAddSkillAssessment: (assessment: Omit<SkillAssessment, 'id'>) => void;
  onUpdateProfile: (user: User) => void;
  onAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status'>) => void;
}

type Tab = 'DASHBOARD' | 'REPORTS' | 'PLAN' | 'SKILLS' | 'RESOURCES' | 'EVALUATIONS' | 'MESSAGES' | 'ACHIEVEMENTS' | 'PROFILE' | 'LEAVE' | 'MEETINGS' | 'LOGBOOK' | 'SITE_VISITS' | 'PERFORMANCE' | 'ATTENDANCE';

// Helper to get local date string (YYYY-MM-DD)
const getLocalDate = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

export const StudentPortal: React.FC<StudentPortalProps> = ({ 
  user, users, logs, tasks, reports, goals, resources, evaluations, messages, meetings, skills, skillAssessments, badges, userBadges, leaveRequests, siteVisits,
  onAddLog, onUpdateTaskStatus, onAddReport, onUpdateGoal, onSubmitDeliverable, onSendMessage, onAddSkillAssessment, onUpdateProfile, onAddLeaveRequest
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  // Sub-tab for performance section
  const [performanceTab, setPerformanceTab] = useState<'SKILLS' | 'EVALUATIONS' | 'ACHIEVEMENTS'>('SKILLS');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  
  const [newLog, setNewLog] = useState({ date: getLocalDate(), hoursWorked: 8, activityDescription: '', challenges: '' });
  const [newReport, setNewReport] = useState({ type: ReportType.WEEKLY, periodStart: '', periodEnd: '', summary: '', keyLearnings: '', nextSteps: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [selectedTaskForDeliverable, setSelectedTaskForDeliverable] = useState<Task | null>(null);
  const [deliverableForm, setDeliverableForm] = useState({ url: '', notes: '' });

  const [chatInput, setChatInput] = useState('');

  // Check-In State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'checking' | 'success' | 'error' | 'out-of-range'>('idle');
  const [locationErrorMsg, setLocationErrorMsg] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Leave Request State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: LeaveType.SICK, startDate: '', endDate: '', reason: '' });

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      institution: user.institution || '',
      department: user.department || '',
      bio: user.bio || '',
      profileSkills: user.profileSkills?.join(', ') || '',
      hobbies: user.hobbies?.join(', ') || '',
      achievements: user.achievements?.join(', ') || '',
      futureGoals: user.futureGoals?.join(', ') || ''
  });

  // Sync profile form when user prop updates
  useEffect(() => {
    setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        institution: user.institution || '',
        department: user.department || '',
        bio: user.bio || '',
        profileSkills: user.profileSkills?.join(', ') || '',
        hobbies: user.hobbies?.join(', ') || '',
        achievements: user.achievements?.join(', ') || '',
        futureGoals: user.futureGoals?.join(', ') || ''
    });
  }, [user]);

  const myLogs = useMemo(() => logs.filter(l => l.studentId === user.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [logs, user.id]);
  const myTasks = useMemo(() => tasks.filter(t => t.assignedToId === user.id), [tasks, user.id]);
  const myReports = useMemo(() => reports.filter(r => r.studentId === user.id), [reports, user.id]);
  const myGoals = useMemo(() => goals.filter(g => g.studentId === user.id), [goals, user.id]);
  const myEvaluations = useMemo(() => evaluations.filter(e => e.studentId === user.id), [evaluations, user.id]);
  const myMessages = useMemo(() => messages.filter(m => m.relatedStudentId === user.id).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), [messages, user.id]);
  const myMeetings = useMemo(() => meetings.filter(m => m.attendees.includes(user.id)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [meetings, user.id]);
  const myLeaveRequests = useMemo(() => leaveRequests.filter(lr => lr.studentId === user.id).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()), [leaveRequests, user.id]);
  const mySiteVisits = useMemo(() => siteVisits.filter(sv => sv.studentId === user.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [siteVisits, user.id]);
  
  const tasksWithFeedback = useMemo(() => myTasks.filter(t => t.feedback).sort((a,b) => new Date(b.feedback!.givenAt).getTime() - new Date(a.feedback!.givenAt).getTime()), [myTasks]);

  const totalHours = myLogs.reduce((acc, log) => acc + log.hoursWorked, 0);
  const hoursRemaining = Math.max(0, (user.totalHoursRequired || 120) - totalHours);
  
  // Timer for check-in
  useEffect(() => {
    let interval: any;
    if (isCheckedIn && checkInTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - checkInTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, checkInTime]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleCheckIn = () => {
      setLocationStatus('checking');
      setLocationErrorMsg('');

      if (!navigator.geolocation) {
          setLocationStatus('error');
          setLocationErrorMsg('Geolocation is not supported by your browser.');
          return;
      }

      navigator.geolocation.getCurrentPosition(
          (position) => {
              const dist = calculateDistance(
                  position.coords.latitude,
                  position.coords.longitude,
                  COMPANY_LOCATION.latitude,
                  COMPANY_LOCATION.longitude
              );

              // Allow if within radius
              if (dist <= COMPANY_LOCATION.radiusKm) {
                  setLocationStatus('success');
                  setIsCheckedIn(true);
                  setCheckInTime(new Date());
              } else {
                  setLocationStatus('out-of-range');
                  setLocationErrorMsg(`Distance: ${dist.toFixed(2)}km (Max allowed: ${COMPANY_LOCATION.radiusKm}km)`);
              }
          },
          (error) => {
              console.error(error);
              setLocationStatus('error');
              switch(error.code) {
                  case error.PERMISSION_DENIED:
                      setLocationErrorMsg("Permission denied. Click the 'Lock' icon in your URL bar to allow location.");
                      break;
                  case error.POSITION_UNAVAILABLE:
                      setLocationErrorMsg("Location information is unavailable.");
                      break;
                  case error.TIMEOUT:
                      setLocationErrorMsg("The request to get user location timed out.");
                      break;
                  default:
                      setLocationErrorMsg("An unknown error occurred getting location.");
                      break;
              }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
  };

  const handleCheckOut = () => {
      setIsCheckedIn(false);
      const hours = parseFloat((elapsedTime / 3600).toFixed(2));
      // Pre-fill log modal with worked hours
      setNewLog({
          date: getLocalDate(),
          hoursWorked: hours,
          activityDescription: '',
          challenges: ''
      });
      setIsLogModalOpen(true);
      setCheckInTime(null);
      setElapsedTime(0);
      setLocationStatus('idle');
      setLocationErrorMsg('');
  };

  const getWeeklyHours = (logs: LogEntry[]) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    return logs
        .filter(l => new Date(l.date + 'T00:00:00') >= startOfWeek)
        .reduce((acc, l) => acc + l.hoursWorked, 0);
  };
  
  const weeklyHours = getWeeklyHours(myLogs);

  let weeklyHoursColor = "bg-emerald-100 text-emerald-700";
  let weeklyHoursIcon = <Clock size={24} />;
  if (weeklyHours < 15) {
      weeklyHoursColor = "bg-rose-100 text-rose-700";
      weeklyHoursIcon = <AlertTriangle size={24} />;
  } else if (weeklyHours > 50) {
      weeklyHoursColor = "bg-amber-100 text-amber-700";
      weeklyHoursIcon = <AlertTriangle size={24} />;
  }

  // Weekly Reflection Logic
  const isReflectionDue = useMemo(() => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const sortedReports = [...myReports].sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      const lastReport = sortedReports[0];
      
      if (!lastReport) return true; 
      return new Date(lastReport.submittedAt) < oneWeekAgo;
  }, [myReports]);

  // Daily Log Reminder Logic
  const isDailyLogDue = useMemo(() => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (day === 0 || day === 6) return false;
      
      // Only prompt after 3 PM (15:00)
      if (hour < 15) return false;
      
      const todayStr = getLocalDate();
      const hasLoggedToday = myLogs.some(l => l.date === todayStr);
      
      return !hasLoggedToday;
  }, [myLogs]);

  const handleImproveLog = async () => {
    if (!newLog.activityDescription) return;
    setIsGenerating(true);
    const improved = await improveLogEntry(newLog.activityDescription);
    setNewLog(prev => ({ ...prev, activityDescription: improved }));
    setIsGenerating(false);
  };

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLog({
      studentId: user.id,
      date: newLog.date,
      hoursWorked: Number(newLog.hoursWorked),
      activityDescription: newLog.activityDescription,
      challenges: newLog.challenges
    });
    setIsLogModalOpen(false);
    setNewLog({ date: getLocalDate(), hoursWorked: 8, activityDescription: '', challenges: '' });
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReport({
      studentId: user.id,
      ...newReport
    });
    setIsReportModalOpen(false);
    setNewReport({ type: ReportType.WEEKLY, periodStart: '', periodEnd: '', summary: '', keyLearnings: '', nextSteps: '' });
  };

  const handleOpenDeliverableModal = (task: Task) => {
    setSelectedTaskForDeliverable(task);
    setDeliverableForm({ url: '', notes: '' });
    setIsDeliverableModalOpen(true);
  };

  const handleSubmitDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTaskForDeliverable) {
        onSubmitDeliverable(selectedTaskForDeliverable.id, {
            url: deliverableForm.url,
            notes: deliverableForm.notes,
            submittedAt: new Date().toISOString()
        });
    }
    setIsDeliverableModalOpen(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim()) return;
      onSendMessage({
          senderId: user.id,
          content: chatInput,
          channel: 'DIRECT', 
          relatedStudentId: user.id
      });
      setChatInput('');
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
        ...user,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        institution: profileForm.institution,
        department: profileForm.department,
        bio: profileForm.bio,
        profileSkills: profileForm.profileSkills.split(',').map(s => s.trim()).filter(s => s),
        hobbies: profileForm.hobbies.split(',').map(h => h.trim()).filter(h => h),
        achievements: profileForm.achievements.split(',').map(s => s.trim()).filter(s => s),
        futureGoals: profileForm.futureGoals.split(',').map(s => s.trim()).filter(s => s),
    });
    setIsEditingProfile(false);
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
      e.preventDefault();
      onAddLeaveRequest({
          studentId: user.id,
          type: leaveForm.type as LeaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason
      });
      setIsLeaveModalOpen(false);
      setLeaveForm({ type: LeaveType.SICK, startDate: '', endDate: '', reason: '' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'PERFORMANCE':
          return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">My Performance</h2>
                          <p className="text-slate-500">Track your growth, evaluations, and rewards.</p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button 
                              onClick={() => setPerformanceTab('SKILLS')}
                              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${performanceTab === 'SKILLS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              Skills
                          </button>
                          <button 
                              onClick={() => setPerformanceTab('EVALUATIONS')}
                              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${performanceTab === 'EVALUATIONS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              Evaluations
                          </button>
                          <button 
                              onClick={() => setPerformanceTab('ACHIEVEMENTS')}
                              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${performanceTab === 'ACHIEVEMENTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              Achievements
                          </button>
                      </div>
                  </div>

                  {performanceTab === 'ACHIEVEMENTS' && (
                       <Gamification 
                          user={user}
                          allUsers={users}
                          userBadges={userBadges}
                          badges={badges}
                          tasks={tasks}
                      />
                  )}

                  {performanceTab === 'SKILLS' && (
                      <SkillTracker 
                          student={user}
                          viewerRole={Role.STUDENT}
                          skills={skills}
                          assessments={skillAssessments.filter(a => a.studentId === user.id)}
                          onAddAssessment={onAddSkillAssessment}
                      />
                  )}

                  {performanceTab === 'EVALUATIONS' && (
                     <div className="space-y-6">
                        {myEvaluations.length === 0 && tasksWithFeedback.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                No evaluations or feedback received yet.
                            </div>
                        )}

                        {myEvaluations.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Award size={18} className="text-indigo-600" /> Formal Evaluations
                                </h3>
                                {myEvaluations.map(evalItem => (
                                    <Card key={evalItem.id} className="p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
                                                {evalItem.type.replace('_', ' ')} Evaluation
                                            </h3>
                                            <span className="text-sm text-slate-500">{new Date(evalItem.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6">
                                            {evalItem.scores.map((score, idx) => (
                                                <div key={idx}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm font-medium text-slate-700">{score.category}</span>
                                                    </div>
                                                    <ScoreBar score={score.score} max={5} />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-indigo-50 p-4 rounded-lg text-sm text-indigo-900">
                                            <strong className="block text-xs uppercase text-indigo-400 mb-1">Overall Feedback</strong>
                                            {evalItem.overallFeedback}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {tasksWithFeedback.length > 0 && (
                            <div className="space-y-4 mt-8">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-indigo-600" /> Continuous Feedback History
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {tasksWithFeedback.map(task => (
                                        <Card key={task.id} className="p-4 flex flex-col md:flex-row gap-4 items-start">
                                            <div className="mt-1 flex-shrink-0">
                                                <FeedbackBadge type={task.feedback!.type} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
                                                    <span className="text-xs text-slate-400">{new Date(task.feedback!.givenAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 italic mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                                                    "{task.feedback!.comment}"
                                                </p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>
                  )}
              </div>
          );
      case 'MEETINGS':
          return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">Meetings & Check-ins</h2>
                          <p className="text-slate-500">Upcoming and past scheduled meetings.</p>
                      </div>
                  </div>
                  
                  {myMeetings.length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                          <CalendarOff size={48} className="mx-auto mb-3 opacity-20" />
                          <p>No meetings scheduled.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myMeetings.map(meeting => {
                              const isPast = new Date(meeting.date + 'T' + meeting.time) < new Date();
                              return (
                                  <Card key={meeting.id} className={`p-5 border-l-4 ${isPast ? 'border-l-slate-300 opacity-70' : 'border-l-indigo-500 shadow-sm'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-bold text-slate-800 text-lg">{meeting.title}</h4>
                                          {isPast && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Past</span>}
                                      </div>
                                      <div className="space-y-2 text-sm text-slate-600">
                                          <div className="flex items-center gap-2">
                                              <Calendar size={16} className="text-indigo-400" />
                                              <span>{new Date(meeting.date).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <Clock size={16} className="text-indigo-400" />
                                              <span>{meeting.time}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <UserIcon size={16} className="text-indigo-400" />
                                              <span>Attendees: {meeting.attendees.map(id => users.find(u => u.id === id)?.name).join(', ')}</span>
                                          </div>
                                      </div>
                                      {meeting.link && !isPast && (
                                          <div className="mt-4 pt-3 border-t border-slate-100">
                                              <a 
                                                  href={meeting.link} 
                                                  target="_blank" 
                                                  rel="noreferrer" 
                                                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                                              >
                                                  <Video size={16} /> Join Video Call
                                              </a>
                                          </div>
                                      )}
                                  </Card>
                              );
                          })}
                      </div>
                  )}
              </div>
          );
      case 'LEAVE':
          return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">Leave Management</h2>
                          <p className="text-slate-500">Request time off or sick leave.</p>
                      </div>
                      <Button onClick={() => setIsLeaveModalOpen(true)}>
                          <Plus size={16} /> New Request
                      </Button>
                  </div>
                  
                  {myLeaveRequests.length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                          <CalendarOff size={48} className="mx-auto mb-3 opacity-20" />
                          <p>No leave requests recorded.</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {myLeaveRequests.map(req => (
                              <Card key={req.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                              req.type === LeaveType.SICK ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                          }`}>
                                              {req.type}
                                          </span>
                                          <span className="text-xs text-slate-400">
                                              {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                          </span>
                                      </div>
                                      <p className="text-sm text-slate-700 italic">"{req.reason}"</p>
                                  </div>
                                  <div>
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                          req.status === LeaveStatus.APPROVED ? 'bg-emerald-100 text-emerald-600' :
                                          req.status === LeaveStatus.REJECTED ? 'bg-rose-100 text-rose-600' :
                                          'bg-amber-100 text-amber-600'
                                      }`}>
                                          {req.status}
                                      </span>
                                  </div>
                              </Card>
                          ))}
                      </div>
                  )}
              </div>
          );
      case 'ATTENDANCE':
          return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-800">Attendance History</h2>
                      <p className="text-slate-500">Monitor your daily attendance and check-in records.</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1">
                          <AttendanceCalendar studentId={user.id} logs={logs} exceptions={MOCK_ATTENDANCE_EXCEPTIONS} />
                      </div>
                      <div className="lg:col-span-2">
                          <Card className="p-0 overflow-hidden">
                              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                  <h3 className="font-bold text-slate-800">Daily Log List</h3>
                                  <span className="text-xs font-bold bg-white text-slate-500 px-2 py-1 rounded border border-slate-200">{myLogs.length} Records</span>
                              </div>
                              <div className="max-h-[500px] overflow-y-auto">
                                  <table className="w-full text-sm text-left">
                                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                          <tr>
                                              <th className="px-6 py-3 font-medium">Date</th>
                                              <th className="px-6 py-3 font-medium">Hours</th>
                                              <th className="px-6 py-3 font-medium">Activity</th>
                                              <th className="px-6 py-3 font-medium text-right">Status</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                          {myLogs.length === 0 ? (
                                              <tr>
                                                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No attendance records found.</td>
                                              </tr>
                                          ) : (
                                              myLogs.map(log => (
                                                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                      <td className="px-6 py-4 font-bold text-slate-700">{new Date(log.date).toLocaleDateString()}</td>
                                                      <td className="px-6 py-4">
                                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                              <Clock size={12} /> {log.hoursWorked}h
                                                          </span>
                                                      </td>
                                                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={log.activityDescription}>
                                                          {log.activityDescription}
                                                      </td>
                                                      <td className="px-6 py-4 text-right">
                                                          <StatusBadge status={log.status} />
                                                      </td>
                                                  </tr>
                                              ))
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </Card>
                      </div>
                  </div>
              </div>
          );
      case 'SITE_VISITS':
          return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">Site Visits</h2>
                          <p className="text-slate-500">History of supervisor visits and feedback.</p>
                      </div>
                  </div>
                  {mySiteVisits.length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                          <MapPin size={48} className="mx-auto mb-3 opacity-20" />
                          <p>No site visits recorded yet.</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {mySiteVisits.map(visit => {
                              const visitor = users.find(u => u.id === visit.visitorId);
                              return (
                                  <Card key={visit.id} className="p-5 border-l-4 border-l-indigo-500">
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                              <Calendar size={18} className="text-indigo-500" />
                                              <span className="font-bold text-slate-800">{new Date(visit.date).toLocaleDateString()}</span>
                                          </div>
                                          <div className="text-xs text-slate-500 flex items-center gap-1">
                                              <UserIcon size={12}/> {visitor?.name}
                                          </div>
                                      </div>
                                      <div className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                                          <MapPin size={14} className="text-slate-400" /> {visit.location}
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 italic border border-slate-100 mb-2">
                                          <strong className="block text-xs uppercase text-slate-400 mb-1 not-italic">Purpose: {visit.purpose}</strong>
                                          "{visit.notes}"
                                      </div>
                                  </Card>
                              );
                          })}
                      </div>
                  )}
              </div>
          );
      case 'LOGBOOK':
          return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">Logbook History</h2>
                          <p className="text-slate-500">Comprehensive list of all your daily activities.</p>
                      </div>
                      <Button onClick={() => setIsLogModalOpen(true)}>
                          <Plus size={16} /> New Entry
                      </Button>
                  </div>
                  
                  {myLogs.length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                          <Book size={48} className="mx-auto mb-3 opacity-20" />
                          <p>No activity logs found.</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {myLogs.map(log => (
                               <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
                                   <div className="flex justify-between items-start mb-2">
                                       <div className="flex items-center gap-3">
                                           <div className="bg-slate-100 px-3 py-1 rounded text-center">
                                               <div className="text-xs text-slate-500 uppercase">{new Date(log.date).toLocaleString('default', { month: 'short' })}</div>
                                               <div className="text-lg font-bold text-slate-800">{new Date(log.date).getDate()}</div>
                                           </div>
                                           <div>
                                               <div className="flex items-center gap-2 text-sm text-slate-500 mb-0.5">
                                                   <Clock size={14} /> {log.hoursWorked} Hours
                                               </div>
                                               <StatusBadge status={log.status} />
                                           </div>
                                       </div>
                                       {log.supervisorComment && (
                                           <div className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1">
                                               <MessageSquare size={12} /> Feedback
                                           </div>
                                       )}
                                   </div>
                                   <p className="text-sm text-slate-700 mt-2 pl-2 border-l-2 border-slate-100">{log.activityDescription}</p>
                                   {log.challenges && (
                                       <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-2 rounded">
                                           <span className="font-bold">Challenge:</span> {log.challenges}
                                       </div>
                                   )}
                                   {log.supervisorComment && (
                                       <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100">
                                            <span className="font-bold">Supervisor:</span> {log.supervisorComment}
                                       </div>
                                   )}
                               </Card>
                          ))}
                      </div>
                  )}
              </div>
          );
      case 'MESSAGES':
          return (
              <div className="h-[600px] flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-800">Communication Channel</h3>
                      <p className="text-xs text-slate-500">Direct chat with your supervisor.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                      {myMessages.map(msg => (
                           <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.senderId === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                                   <div className="mb-1 text-[10px] opacity-70 flex justify-between gap-4">
                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        {msg.channel === 'GROUP' && (
                                            <span className="font-bold uppercase tracking-wider text-[9px] bg-black/10 px-1 rounded">Group</span>
                                        )}
                                   </div>
                                   {msg.content}
                               </div>
                           </div>
                      ))}
                      {myMessages.length === 0 && <div className="text-center text-slate-400 mt-10">No messages yet. Start the conversation!</div>}
                  </div>
                  <div className="p-4 bg-white border-t border-slate-200">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                          <input 
                              type="text" 
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                          />
                          <Button type="submit" disabled={!chatInput.trim()}>
                              <Send size={16} />
                          </Button>
                      </form>
                  </div>
              </div>
          );
      case 'REPORTS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Periodic Reports</h2>
                    <p className="text-slate-500">Submit weekly or monthly summaries of your progress.</p>
                </div>
                <Button onClick={() => setIsReportModalOpen(true)}>
                    <Plus size={16} /> New Report
                </Button>
             </div>

             {myReports.length === 0 ? (
                 <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                     <FileText size={48} className="mx-auto mb-3 opacity-20" />
                     <p>No reports submitted yet.</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {myReports.slice().reverse().map(report => (
                         <Card key={report.id} className="p-6 hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${report.type === ReportType.WEEKLY ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                         {report.type}
                                     </span>
                                     <div className="text-sm text-slate-400 mt-2 font-mono">
                                         {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                                     </div>
                                 </div>
                                 <div className="text-xs text-slate-400">
                                     Submitted: {new Date(report.submittedAt).toLocaleDateString()}
                                 </div>
                             </div>
                             <div className="space-y-3">
                                 <div>
                                     <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Summary</h4>
                                     <p className="text-sm text-slate-600 line-clamp-3">{report.summary}</p>
                                 </div>
                                 <div>
                                     <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Key Learnings</h4>
                                     <p className="text-sm text-slate-600 line-clamp-2">{report.keyLearnings}</p>
                                 </div>
                             </div>
                             <button className="mt-4 text-sm text-indigo-600 hover:underline font-medium flex items-center gap-1">
                                 Read Full Report <ChevronRight size={14} />
                             </button>
                         </Card>
                     ))}
                 </div>
             )}
          </div>
        );

      case 'PLAN':
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Learning Agreement & Goals</h2>
                        <p className="text-slate-500">Track your progress against university learning outcomes.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {myGoals.map(goal => {
                        // Find tasks linked to this goal
                        const relatedTasks = myTasks.filter(t => t.linkedGoalId === goal.id);

                        return (
                            <Card key={goal.id} className="p-6">
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                                                {goal.category}
                                            </span>
                                            <span className="text-xs text-slate-400">Aligned to: {goal.alignment}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">{goal.description}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={goal.status}
                                            onChange={(e) => onUpdateGoal({...goal, status: e.target.value as GoalStatus})}
                                            className="text-xs border border-slate-200 rounded p-1 outline-none focus:border-indigo-500"
                                        >
                                            <option value={GoalStatus.NOT_STARTED}>Not Started</option>
                                            <option value={GoalStatus.IN_PROGRESS}>In Progress</option>
                                            <option value={GoalStatus.ACHIEVED}>Achieved</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-500">
                                        <span>Progress</span>
                                        <span>{goal.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden cursor-pointer group relative">
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-slate-500 bg-white/80 z-10 transition-opacity">
                                            Click to update
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" max="100" 
                                            value={goal.progress}
                                            onChange={(e) => onUpdateGoal({...goal, progress: Number(e.target.value)})}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        />
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                goal.status === GoalStatus.ACHIEVED ? 'bg-emerald-500' : 
                                                goal.status === GoalStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-300'
                                            }`}
                                            style={{ width: `${goal.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {relatedTasks.length > 0 && (
                                     <div className="mt-4 pt-4 border-t border-slate-100">
                                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                             <CheckSquare size={12}/> Linked Tasks
                                         </h4>
                                         <div className="space-y-2">
                                             {relatedTasks.map(t => (
                                                 <div key={t.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                                     <span className={`truncate flex-1 font-medium ${t.status === TaskStatus.COMPLETED ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                         {t.title}
                                                     </span>
                                                     <StatusBadge status={t.status} />
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                )}
                            </Card>
                        );
                    })}
                     {myGoals.length === 0 && (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
                            Your supervisor hasn't assigned any learning goals yet.
                        </div>
                    )}
                </div>
            </div>
        );

      case 'RESOURCES':
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Resource Library</h2>
                    <p className="text-slate-500">Documents, templates, and guidelines provided by your supervisor.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {resources.map(res => (
                        <Card key={res.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className={`p-3 rounded-lg ${res.type === 'PDF' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                <FileText size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{res.title}</h4>
                                <p className="text-xs text-slate-400">{new Date(res.uploadDate).toLocaleDateString()}</p>
                            </div>
                            <button className="text-slate-400 hover:text-indigo-600">
                                <Download size={20} />
                            </button>
                        </Card>
                    ))}
                    {resources.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            No resources available.
                        </div>
                    )}
                </div>
            </div>
        );
        
      case 'PROFILE':
          return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
                          <p className="text-slate-500">Manage your personal information, skills, and goals.</p>
                      </div>
                      {!isEditingProfile && (
                          <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                              Edit Profile
                          </Button>
                      )}
                  </div>

                  {isEditingProfile ? (
                      <Card className="p-6">
                          <form onSubmit={handleProfileSave} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                      <input 
                                          type="text" 
                                          value={profileForm.name}
                                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                          className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                          required
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                      <input 
                                          type="email" 
                                          value={profileForm.email}
                                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                                          className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                          required
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                      <input 
                                          type="tel" 
                                          value={profileForm.phone}
                                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                          className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                          placeholder="+1 (555) 000-0000"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">University / Institute</label>
                                      <input 
                                          type="text" 
                                          value={profileForm.institution}
                                          onChange={(e) => setProfileForm({...profileForm, institution: e.target.value})}
                                          className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Department / Major</label>
                                      <input 
                                          type="text" 
                                          value={profileForm.department}
                                          onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                                          className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                      />
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                                  <textarea 
                                      value={profileForm.bio}
                                      onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                                      className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                                      placeholder="Brief introduction about yourself..."
                                  />
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Skills (Comma separated)</label>
                                  <input 
                                      type="text" 
                                      value={profileForm.profileSkills}
                                      onChange={(e) => setProfileForm({...profileForm, profileSkills: e.target.value})}
                                      className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                      placeholder="React, TypeScript, UI Design"
                                  />
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Hobbies (Comma separated)</label>
                                  <input 
                                      type="text" 
                                      value={profileForm.hobbies}
                                      onChange={(e) => setProfileForm({...profileForm, hobbies: e.target.value})}
                                      className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                      placeholder="Photography, Reading, Hiking"
                                  />
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Achievements (Comma separated)</label>
                                  <textarea 
                                      value={profileForm.achievements}
                                      onChange={(e) => setProfileForm({...profileForm, achievements: e.target.value})}
                                      className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                                      placeholder="Dean's List, Hackathon Winner, Published Article"
                                  />
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Future Goals (Comma separated)</label>
                                  <textarea 
                                      value={profileForm.futureGoals}
                                      onChange={(e) => setProfileForm({...profileForm, futureGoals: e.target.value})}
                                      className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                                      placeholder="Become Senior Dev, Start a Company, Learn AI"
                                  />
                              </div>

                              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                  <Button type="button" variant="secondary" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                                  <Button type="submit"><Save size={16}/> Save Changes</Button>
                              </div>
                          </form>
                      </Card>
                  ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <Card className="p-6 flex flex-col items-center text-center space-y-4">
                              <div className="relative">
                                  <img src={user.avatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-lg" />
                                  <div className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-sm" title="Change Avatar (Mock)">
                                      <Camera size={16} />
                                  </div>
                              </div>
                              <div>
                                  <h3 className="text-2xl font-bold text-slate-900">{user.name}</h3>
                                  <p className="text-slate-500">{user.role}</p>
                              </div>
                              <div className="w-full border-t border-slate-100 pt-4 space-y-3 text-sm text-left">
                                  <div className="flex items-center gap-3 text-slate-600">
                                      <Mail size={16} className="text-slate-400" /> {user.email}
                                  </div>
                                  {user.phone && (
                                      <div className="flex items-center gap-3 text-slate-600">
                                          <Phone size={16} className="text-slate-400" /> {user.phone}
                                      </div>
                                  )}
                                  {user.institution && (
                                      <div className="flex items-center gap-3 text-slate-600">
                                          <MapPin size={16} className="text-slate-400" /> {user.institution}
                                      </div>
                                  )}
                                  {user.department && (
                                      <div className="flex items-center gap-3 text-slate-600">
                                          <Briefcase size={16} className="text-slate-400" /> {user.department}
                                      </div>
                                  )}
                              </div>
                          </Card>

                          <div className="lg:col-span-2 space-y-6">
                              <Card className="p-6">
                                  <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Bio</h4>
                                  <p className="text-slate-600 leading-relaxed">
                                      {user.bio || "No bio provided yet."}
                                  </p>
                              </Card>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Card className="p-6">
                                      <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                         <Zap size={16} className="text-amber-500" /> Skills
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                          {user.profileSkills && user.profileSkills.length > 0 ? (
                                              user.profileSkills.map((skill, index) => (
                                                  <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                                                      {skill}
                                                  </span>
                                              ))
                                          ) : (
                                              <span className="text-slate-400 text-sm italic">No skills listed.</span>
                                          )}
                                      </div>
                                  </Card>
                                  <Card className="p-6">
                                      <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                          <Heart size={16} className="text-rose-500" /> Hobbies & Interests
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                          {user.hobbies && user.hobbies.length > 0 ? (
                                              user.hobbies.map((hobby, index) => (
                                                  <span key={index} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                                                      {hobby}
                                                  </span>
                                              ))
                                          ) : (
                                              <span className="text-slate-400 text-sm italic">No hobbies listed.</span>
                                          )}
                                      </div>
                                  </Card>
                                  <Card className="p-6">
                                      <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                          <Trophy size={16} className="text-amber-500" /> Achievements
                                      </h4>
                                      <ul className="space-y-2">
                                          {user.achievements && user.achievements.length > 0 ? (
                                              user.achievements.map((item, index) => (
                                                  <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                                      <span className="text-amber-400 mt-1">•</span> {item}
                                                  </li>
                                              ))
                                          ) : (
                                              <span className="text-slate-400 text-sm italic">No achievements listed.</span>
                                          )}
                                      </ul>
                                  </Card>
                                  <Card className="p-6">
                                      <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                          <Rocket size={16} className="text-purple-500" /> Future Goals
                                      </h4>
                                      <ul className="space-y-2">
                                          {user.futureGoals && user.futureGoals.length > 0 ? (
                                              user.futureGoals.map((item, index) => (
                                                  <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                                      <span className="text-purple-400 mt-1">→</span> {item}
                                                  </li>
                                              ))
                                          ) : (
                                              <span className="text-slate-400 text-sm italic">No goals listed.</span>
                                          )}
                                      </ul>
                                  </Card>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          );

      case 'DASHBOARD':
      default:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             
             {isDailyLogDue && (
                 <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md shadow-sm flex items-start gap-3 mb-6 animate-in slide-in-from-top-2">
                     <BellRing className="text-rose-500 flex-shrink-0 mt-1" size={20} />
                     <div className="flex-1">
                         <h3 className="font-bold text-rose-800">Daily Log Reminder</h3>
                         <p className="text-sm text-rose-700 mt-1">
                            It's past 3 PM and you haven't submitted your daily activity log yet. Please record your progress for today to keep your streak!
                         </p>
                         <button 
                            onClick={() => setIsLogModalOpen(true)} 
                            className="mt-2 text-xs font-bold bg-white border border-rose-200 text-rose-700 px-3 py-1.5 rounded hover:bg-rose-50 transition-colors"
                         >
                             Log Activity Now &rarr;
                         </button>
                     </div>
                 </div>
             )}

             {isReflectionDue && (
                 <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md shadow-sm flex items-start gap-3 mb-6 animate-in slide-in-from-top-2">
                     <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={20} />
                     <div className="flex-1">
                         <h3 className="font-bold text-amber-800">Weekly Self-Reflection Due</h3>
                         <p className="text-sm text-amber-700 mt-1">
                            It's been over a week since your last reflection log. Regular reflection is key to your growth and evaluation.
                            Please take a moment to document your learning, challenges, and goals.
                         </p>
                         <button 
                            onClick={() => setIsReportModalOpen(true)} 
                            className="mt-2 text-xs font-bold bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded hover:bg-amber-50 transition-colors"
                         >
                             Write Reflection &rarr;
                         </button>
                     </div>
                 </div>
             )}
             
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none relative overflow-hidden">
                    <div className="p-3 bg-white/20 rounded-full relative z-10">
                        <Clock size={24} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-indigo-100 text-sm font-medium">Hours Remaining</p>
                        <h3 className="text-2xl font-bold">{hoursRemaining} Hrs</h3>
                        <p className="text-[10px] text-indigo-200">Goal: {user.totalHoursRequired}</p>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-full ${weeklyHoursColor}`}>
                    {weeklyHoursIcon}
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">This Week</p>
                    <h3 className="text-2xl font-bold text-slate-800">{weeklyHours} Hours</h3>
                    {weeklyHours < 15 && <span className="text-[10px] text-rose-600 font-medium">Below Target (40h)</span>}
                    {weeklyHours > 50 && <span className="text-[10px] text-amber-600 font-medium">Over Limit (50h)</span>}
                </div>
                </Card>
                
                {/* Geo-Check In Widget */}
                <Card className="p-4 md:col-span-2 border-indigo-100 bg-indigo-50/30 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                             <MapPin className={isCheckedIn ? 'text-emerald-500' : 'text-slate-400'} size={20} />
                             <h3 className="font-bold text-slate-700">Attendance Check-In</h3>
                        </div>
                        {isCheckedIn && (
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                                {formatTime(elapsedTime)}
                            </span>
                        )}
                    </div>
                    
                    {isCheckedIn ? (
                         <Button 
                            onClick={handleCheckOut} 
                            className="w-full bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200"
                         >
                             Check Out & Log Time
                         </Button>
                    ) : (
                         <div className="flex flex-col gap-2">
                             <div className="flex gap-2 items-center">
                                 <Button 
                                    onClick={handleCheckIn} 
                                    className="flex-1"
                                    disabled={locationStatus === 'checking'}
                                 >
                                     {locationStatus === 'checking' ? 'Verifying Location...' : 'Check In'}
                                 </Button>
                             </div>
                             
                             {locationStatus === 'out-of-range' && (
                                 <div className="text-xs bg-rose-50 text-rose-700 p-2 rounded border border-rose-200 flex items-start gap-2">
                                     <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                     <div>
                                         <span className="font-bold block">You are too far from the office!</span>
                                         {locationErrorMsg && <span className="block mt-0.5 opacity-80">{locationErrorMsg}</span>}
                                     </div>
                                 </div>
                             )}
                             
                             {locationStatus === 'error' && (
                                 <div className="text-xs bg-rose-50 text-rose-700 p-2 rounded border border-rose-200">
                                     <span className="font-bold">Location Error:</span> {locationErrorMsg}
                                 </div>
                             )}
                         </div>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <CheckSquare className="text-indigo-600" /> My Tasks
                        </h2>
                        </div>
                        <TaskBoard 
                            tasks={myTasks} 
                            goals={myGoals}
                            onStatusChange={onUpdateTaskStatus} 
                            onSubmitDeliverable={handleOpenDeliverableModal}
                        />
                    </section>
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="text-indigo-600" /> Recent Logs
                            </h2>
                            <Button onClick={() => setIsLogModalOpen(true)} className="shadow-sm">
                                <Plus size={18} /> New Entry
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {myLogs.length === 0 ? (
                                <p className="text-slate-500 italic">No logs submitted yet.</p>
                            ) : (
                                myLogs.slice().reverse().slice(0, 5).map(log => (
                                <Card key={log.id} className="p-4 flex gap-4 group">
                                    <div className="flex flex-col items-center min-w-[60px]">
                                        <div className="text-sm font-bold text-slate-500">{new Date(log.date).toLocaleString('default', { month: 'short' })}</div>
                                        <div className="text-2xl font-bold text-slate-800">{new Date(log.date).getDate()}</div>
                                    </div>
                                    <div className="flex-1 border-l border-slate-100 pl-4">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-slate-800">{log.hoursWorked} Hours</h4>
                                            <StatusBadge status={log.status} />
                                        </div>
                                        <p className="text-slate-600 text-sm mt-1">{log.activityDescription}</p>
                                        {log.supervisorComment && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                                <strong>Supervisor:</strong> {log.supervisorComment}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                                ))
                            )}
                        </div>
                    </section>
                </div>
                <div className="space-y-6">
                     <Card className="p-5">
                         <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                             <Calendar className="text-indigo-600" size={18}/> Upcoming Meetings
                         </h3>
                         <div className="space-y-3">
                             {myMeetings.length === 0 ? (
                                 <p className="text-sm text-slate-400 italic">No scheduled check-ins.</p>
                             ) : (
                                 myMeetings.slice(0, 3).map(meeting => (
                                     <div key={meeting.id} className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                         <div className="font-bold text-sm text-slate-800">{meeting.title}</div>
                                         <div className="text-xs text-slate-500 mt-1">{new Date(meeting.date).toLocaleDateString()} at {meeting.time}</div>
                                         {meeting.link && (
                                             <a href={meeting.link} target="_blank" rel="noreferrer" className="text-[10px] mt-2 text-indigo-600 font-bold flex items-center gap-1">
                                                 <Video size={10}/> JOIN CALL
                                             </a>
                                         )}
                                     </div>
                                 ))
                             )}
                         </div>
                     </Card>
                    <Card className="p-5 bg-gradient-to-b from-white to-slate-50">
                        <h3 className="font-bold text-slate-800 mb-2">Internship Tips</h3>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                            <li>Log your activities daily.</li>
                            <li>Submit weekly reports on Fridays.</li>
                            <li>Check the Resource Library for templates.</li>
                        </ul>
                    </Card>
                </div>
            </div>
          </div>
        );
    }
  };

  const NavButton = ({ tab, label, icon: Icon }: { tab: Tab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg md:rounded-none md:border-l-4 ${
            activeTab === tab 
            ? 'bg-indigo-50 text-indigo-700 md:border-indigo-600' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 md:border-transparent'
        }`}
    >
        <Icon size={18} />
        <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-8rem)]">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                 {/* Mobile Header for Nav */}
                <div className="p-4 border-b border-slate-100 md:hidden bg-slate-50">
                   <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">Menu</span>
                </div>
                
                <div className="flex overflow-x-auto md:flex-col p-2 md:p-0 gap-2 md:gap-0">
                    <div className="hidden md:block px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Overview</div>
                    <NavButton tab="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
                    <NavButton tab="PROFILE" label="My Profile" icon={UserIcon} />
                    
                    <div className="hidden md:block px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Work & Activity</div>
                    <NavButton tab="LOGBOOK" label="Logbook" icon={Book} />
                    <NavButton tab="ATTENDANCE" label="Attendance" icon={Clock} />
                    <NavButton tab="REPORTS" label="Reports" icon={FileText} />
                    <NavButton tab="PLAN" label="Learning Plan" icon={Target} />
                    
                    <div className="hidden md:block px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Communication</div>
                    <NavButton tab="MESSAGES" label="Messages" icon={MessageSquare} />
                    <NavButton tab="MEETINGS" label="Meetings" icon={CalendarCheck} />
                    
                    <div className="hidden md:block px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Growth</div>
                    <NavButton tab="PERFORMANCE" label="Performance" icon={BarChart2} />
                    
                    <div className="hidden md:block px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Other</div>
                    <NavButton tab="LEAVE" label="Leave Request" icon={CalendarOff} />
                    <NavButton tab="SITE_VISITS" label="Site Visits" icon={MapPin} />
                    <NavButton tab="RESOURCES" label="Resources" icon={Paperclip} />
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
            {renderContent()}
        </div>

        {/* Modals */}
        {isLogModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <Card className="w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">New Daily Log</h2>
                    <form onSubmit={handleSubmitLog} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    max={getLocalDate()}
                                    value={newLog.date}
                                    onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hours</label>
                                <input 
                                    type="number" 
                                    min="0" max="24"
                                    value={newLog.hoursWorked}
                                    onChange={(e) => setNewLog({...newLog, hoursWorked: Number(e.target.value)})}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700">Activity</label>
                                <button 
                                    type="button" 
                                    onClick={handleImproveLog}
                                    disabled={isGenerating || !newLog.activityDescription}
                                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                                >
                                    <Wand2 size={12} /> {isGenerating ? 'Improving...' : 'AI Polish'}
                                </button>
                            </div>
                            <textarea 
                                value={newLog.activityDescription}
                                onChange={(e) => setNewLog({...newLog, activityDescription: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                                placeholder="What did you achieve today?"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Challenges (Optional)</label>
                            <textarea 
                                value={newLog.challenges}
                                onChange={(e) => setNewLog({...newLog, challenges: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                                placeholder="Any blockers?"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Submit Log</Button>
                        </div>
                    </form>
                </Card>
            </div>
        )}
        {isDeliverableModalOpen && selectedTaskForDeliverable && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Submit Deliverable</h2>
                    <p className="text-sm text-slate-500 mb-4">For task: {selectedTaskForDeliverable.title}</p>
                    <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link / URL (Optional)</label>
                            <input 
                                type="url" 
                                value={deliverableForm.url}
                                onChange={(e) => setDeliverableForm({...deliverableForm, url: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://github.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Description</label>
                            <textarea 
                                value={deliverableForm.notes}
                                onChange={(e) => setDeliverableForm({...deliverableForm, notes: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                placeholder="Describe what you are submitting..."
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setIsDeliverableModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Submit</Button>
                        </div>
                    </form>
                </Card>
            </div>
        )}
        {isLeaveModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Request Leave</h2>
                    <form onSubmit={handleSubmitLeave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select 
                                value={leaveForm.type}
                                onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value as LeaveType})}
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                            >
                                <option value={LeaveType.SICK}>Sick Leave</option>
                                <option value={LeaveType.VACATION}>Vacation</option>
                                <option value={LeaveType.PERSONAL}>Personal</option>
                                <option value={LeaveType.UNIVERSITY_EVENT}>University Event</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input 
                                    type="date" 
                                    value={leaveForm.startDate}
                                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input 
                                    type="date" 
                                    value={leaveForm.endDate}
                                    onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                            <textarea 
                                value={leaveForm.reason}
                                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none h-24 resize-none"
                                placeholder="Brief reason for your request..."
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Submit Request</Button>
                        </div>
                    </form>
                </Card>
            </div>
        )}
        {isReportModalOpen && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <Card className="w-full max-w-2xl p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                 <h2 className="text-xl font-bold text-slate-800 mb-4">Submit Reflection / Periodic Report</h2>
                 <form onSubmit={handleSubmitReport} className="space-y-4">
                     <div className="grid grid-cols-3 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                             <select 
                                 value={newReport.type} 
                                 onChange={(e) => setNewReport({...newReport, type: e.target.value as ReportType})}
                                 className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                             >
                                 <option value={ReportType.WEEKLY}>Weekly</option>
                                 <option value={ReportType.MONTHLY}>Monthly</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                             <input 
                                 type="date" 
                                 value={newReport.periodStart}
                                 onChange={(e) => setNewReport({...newReport, periodStart: e.target.value})}
                                 className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                                 required
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                             <input 
                                 type="date" 
                                 value={newReport.periodEnd}
                                 onChange={(e) => setNewReport({...newReport, periodEnd: e.target.value})}
                                 className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                                 required
                             />
                         </div>
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Executive Summary</label>
                         <textarea 
                             value={newReport.summary}
                             onChange={(e) => setNewReport({...newReport, summary: e.target.value})}
                             className="w-full p-2 border border-slate-300 rounded-lg outline-none h-24 resize-none"
                             placeholder="High-level overview of the period..."
                             required
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Key Learnings & Achievements</label>
                         <textarea 
                             value={newReport.keyLearnings}
                             onChange={(e) => setNewReport({...newReport, keyLearnings: e.target.value})}
                             className="w-full p-2 border border-slate-300 rounded-lg outline-none h-24 resize-none"
                             placeholder="What new skills or insights did you gain?"
                             required
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Goals for Next Period</label>
                         <textarea 
                             value={newReport.nextSteps}
                             onChange={(e) => setNewReport({...newReport, nextSteps: e.target.value})}
                             className="w-full p-2 border border-slate-300 rounded-lg outline-none h-24 resize-none"
                             placeholder="What is your focus for the upcoming week/month?"
                             required
                         />
                     </div>
                     <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                         <Button type="button" variant="secondary" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
                         <Button type="submit">Submit Report</Button>
                     </div>
                 </form>
             </Card>
             </div>
        )}
    </div>
  );
};
