
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { APP_NAME, MOCK_SKILLS, MOCK_BADGES } from './constants';
import { Role, User, LogEntry, Task, TaskStatus, LogStatus, Report, Goal, Resource, TaskDeliverable, TaskFeedback, Evaluation, Message, Meeting, Skill, SkillAssessment, Notification, NotificationType, Badge, UserBadge, LeaveRequest, LeaveStatus, FeedbackType, SiteVisit, GoalStatus, AttendanceException, LeaveType, UserStatus } from './types';
import { StudentPortal } from './components/StudentPortal';
import { SupervisorPortal } from './components/SupervisorPortal';
import { AdminPortal } from './components/AdminPortal';
import { Auth } from './components/Auth';
import { Bell, X, Megaphone, Info, LogOut, Loader2, AlertTriangle, WifiOff } from 'lucide-react';

// --- Mappers: DB (snake_case) to Local (camelCase) ---
// Added robustness to handle potential nulls/undefined values

const mapUser = (d: any): User => ({
  id: d?.id ?? '',
  name: d?.name ?? 'Unknown User',
  email: d?.email ?? '',
  role: (d?.role as Role) ?? Role.STUDENT,
  status: (d?.status as UserStatus) ?? UserStatus.ACTIVE,
  avatar: d?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d?.name || 'User')}&background=random`,
  totalHoursRequired: d?.total_hours_required ?? 120,
  assignedSupervisorId: d?.assigned_supervisor_id,
  internshipStartDate: d?.internship_start_date,
  internshipEndDate: d?.internship_end_date,
  institution: d?.institution,
  department: d?.department,
  bio: d?.bio,
  phone: d?.phone,
  hobbies: d?.hobbies || [],
  profileSkills: d?.profile_skills || [],
  achievements: d?.achievements || [],
  futureGoals: d?.future_goals || [],
  supervisorNotes: d?.supervisor_notes || ''
});

const mapLog = (d: any): LogEntry => ({
  id: d?.id ?? '',
  studentId: d?.student_id ?? '',
  date: d?.date ?? new Date().toISOString(),
  hoursWorked: d?.hours_worked ?? 0,
  activityDescription: d?.activity_description ?? '',
  challenges: d?.challenges,
  status: d?.status ?? LogStatus.PENDING,
  supervisorComment: d?.supervisor_comment
});

const mapTask = (d: any): Task => ({
  id: d?.id ?? '',
  title: d?.title ?? '',
  description: d?.description ?? '',
  assignedToId: d?.assigned_to_id ?? '',
  assignedById: d?.assigned_by_id ?? '',
  status: d?.status ?? TaskStatus.TODO,
  priority: d?.priority ?? 'MEDIUM',
  dueDate: d?.due_date ?? '',
  createdAt: d?.created_at ?? new Date().toISOString(),
  deliverable: d?.deliverable,
  feedback: d?.feedback,
  linkedGoalId: d?.linked_goal_id
});

const mapReport = (d: any): Report => ({
  id: d?.id ?? '',
  studentId: d?.student_id ?? '',
  type: d?.type ?? 'WEEKLY',
  periodStart: d?.period_start ?? '',
  periodEnd: d?.period_end ?? '',
  summary: d?.summary ?? '',
  keyLearnings: d?.key_learnings ?? '',
  nextSteps: d?.next_steps ?? '',
  submittedAt: d?.submitted_at ?? new Date().toISOString()
});

const mapGoal = (d: any): Goal => ({
  id: d?.id ?? '',
  studentId: d?.student_id ?? '',
  description: d?.description ?? '',
  category: d?.category ?? '',
  alignment: d?.alignment ?? '',
  status: d?.status ?? GoalStatus.NOT_STARTED,
  progress: d?.progress ?? 0
});

const mapResource = (d: any): Resource => ({
  id: d?.id ?? '',
  title: d?.title ?? '',
  type: d?.type ?? 'LINK',
  url: d?.url ?? '#',
  uploadedBy: d?.uploaded_by ?? '',
  uploadDate: d?.upload_date ?? new Date().toISOString()
});

const mapEvaluation = (d: any): Evaluation => ({
  id: d?.id ?? '',
  studentId: d?.student_id ?? '',
  supervisorId: d?.supervisor_id ?? '',
  type: d?.type ?? 'MID_TERM',
  date: d?.date ?? new Date().toISOString(),
  scores: d?.scores ?? [],
  overallFeedback: d?.overall_feedback ?? ''
});

const mapMessage = (d: any): Message => ({
  id: d?.id ?? '',
  senderId: d?.sender_id ?? '',
  content: d?.content ?? '',
  timestamp: d?.timestamp ?? new Date().toISOString(),
  channel: d?.channel ?? 'DIRECT',
  relatedStudentId: d?.related_student_id ?? ''
});

const mapMeeting = (d: any): Meeting => ({
  id: d?.id ?? '',
  title: d?.title ?? '',
  organizerId: d?.organizer_id ?? '',
  date: d?.date ?? '',
  time: d?.time ?? '',
  attendees: d?.attendees || [],
  link: d?.link
});

const mapNotification = (d: any): Notification => ({
  id: d?.id ?? '',
  recipientId: d?.recipient_id ?? '',
  senderId: d?.sender_id ?? '',
  title: d?.title ?? '',
  message: d?.message ?? '',
  type: d?.type ?? NotificationType.INFO,
  timestamp: d?.timestamp ?? new Date().toISOString(),
  read: d?.read ?? false
});

const mapSkill = (d: any): Skill => ({
  id: d?.id ?? '',
  name: d?.name ?? '',
  category: d?.category ?? 'Technical'
});

const mapSkillAssessment = (d: any): SkillAssessment => ({
  id: d?.id ?? '',
  studentId: d?.student_id ?? '',
  raterId: d?.rater_id ?? '',
  role: d?.role ?? Role.STUDENT,
  date: d?.date ?? new Date().toISOString(),
  ratings: d?.ratings ?? []
});

const mapBadge = (d: any): Badge => ({
  id: d?.id ?? '',
  name: d?.name ?? '',
  description: d?.description ?? '',
  icon: d?.icon ?? 'Star',
  color: d?.color ?? 'bg-gray-100',
  points: d?.points ?? 0
});

const mapUserBadge = (d: any): UserBadge => ({
  id: d?.id ?? '',
  userId: d?.user_id ?? '',
  badgeId: d?.badge_id ?? '',
  earnedAt: d?.earned_at ?? new Date().toISOString()
});

const mapLeaveRequest = (d: any): LeaveRequest => ({
  id: d?.id ?? '',
  studentId: d?.student_id ?? '',
  startDate: d?.start_date ?? '',
  endDate: d?.end_date ?? '',
  type: d?.type ?? LeaveType.SICK,
  reason: d?.reason ?? '',
  status: d?.status ?? LeaveStatus.PENDING
});

const mapSiteVisit = (d: any): SiteVisit => ({
  id: d?.id ?? '',
  studentId: d?.student_id ?? '',
  visitorId: d?.visitor_id ?? '',
  date: d?.date ?? '',
  location: d?.location ?? '',
  purpose: d?.purpose ?? '',
  notes: d?.notes ?? ''
});

const mapAttendanceException = (d: any): AttendanceException => ({
  id: d?.id ?? '',
  studentId: d?.student_id ?? '',
  date: d?.date ?? '',
  reason: d?.reason ?? '',
  type: d?.type ?? 'EXCUSED'
});

// Simple UUID generator for client-side ID generation
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Data State - Initialized as empty, fetched from Supabase
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [attendanceExceptions, setAttendanceExceptions] = useState<AttendanceException[]>([]);

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
              setIsNotifDropdownOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Online Status Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchUsers = async () => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        if (data) {
            setUsers(data.map(mapUser));
        }
    } catch (err) {
        console.error("Error fetching users:", err);
    }
  };

  const fetchAllData = async () => {
    try {
        const [
            logsRes, tasksRes, reportsRes, goalsRes, resourcesRes, 
            evalsRes, msgsRes, meetingsRes, notifsRes, 
            skillsRes, assessmentsRes, badgesRes, userBadgesRes,
            leavesRes, visitsRes, exceptionsRes
        ] = await Promise.all([
            supabase.from('logs').select('*'),
            supabase.from('tasks').select('*'),
            supabase.from('reports').select('*'),
            supabase.from('goals').select('*'),
            supabase.from('resources').select('*'),
            supabase.from('evaluations').select('*'),
            supabase.from('messages').select('*'),
            supabase.from('meetings').select('*'),
            supabase.from('notifications').select('*'),
            supabase.from('skills').select('*'),
            supabase.from('skill_assessments').select('*'),
            supabase.from('badges').select('*'),
            supabase.from('user_badges').select('*'),
            supabase.from('leave_requests').select('*'),
            supabase.from('site_visits').select('*'),
            supabase.from('attendance_exceptions').select('*')
        ]);

        if(logsRes.data) setLogs(logsRes.data.map(mapLog));
        if(tasksRes.data) setTasks(tasksRes.data.map(mapTask));
        if(reportsRes.data) setReports(reportsRes.data.map(mapReport));
        if(goalsRes.data) setGoals(goalsRes.data.map(mapGoal));
        if(resourcesRes.data) setResources(resourcesRes.data.map(mapResource));
        if(evalsRes.data) setEvaluations(evalsRes.data.map(mapEvaluation));
        if(msgsRes.data) setMessages(msgsRes.data.map(mapMessage));
        if(meetingsRes.data) setMeetings(meetingsRes.data.map(mapMeeting));
        if(notifsRes.data) setNotifications(notifsRes.data.map(mapNotification));
        
        // Use Mock for Skills/Badges if DB is empty to ensure UI has content, otherwise use DB
        if(skillsRes.data && skillsRes.data.length > 0) setSkills(skillsRes.data.map(mapSkill));
        else setSkills(MOCK_SKILLS);

        if(badgesRes.data && badgesRes.data.length > 0) setBadges(badgesRes.data.map(mapBadge));
        else setBadges(MOCK_BADGES);

        if(assessmentsRes.data) setSkillAssessments(assessmentsRes.data.map(mapSkillAssessment));
        if(userBadgesRes.data) setUserBadges(userBadgesRes.data.map(mapUserBadge));
        if(leavesRes.data) setLeaveRequests(leavesRes.data.map(mapLeaveRequest));
        if(visitsRes.data) setSiteVisits(visitsRes.data.map(mapSiteVisit));
        if(exceptionsRes.data) setAttendanceExceptions(exceptionsRes.data.map(mapAttendanceException));

    } catch (e) {
        console.error("Error fetching data", e);
    }
  };

  // Check Session on Mount
  useEffect(() => {
      let mounted = true;

      const initAuth = async () => {
          try {
              setIsAuthLoading(true);
              
              const { data: { session }, error } = await supabase.auth.getSession();
              if (error) throw error;
              
              if (mounted && session?.user) {
                  const { data, error: profileError } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
                  
                  if (!profileError && data) {
                      const mappedUser = mapUser(data);
                      
                      // Check status for existing session
                      if (mappedUser.role === Role.SUPERVISOR && mappedUser.status === UserStatus.PENDING) {
                           await supabase.auth.signOut();
                           setCurrentUser(null);
                           setIsAuthenticated(false);
                      } else {
                           setCurrentUser(mappedUser);
                           setIsAuthenticated(true);
                      }
                  }
              }
              // Optimization: Do NOT await fetchUsers() here. It blocks the UI if DB is large/slow.
              // fetchUsers will be called by the useEffect dependent on isAuthenticated below.
          } catch (err) {
              console.error("Auth init error:", err);
          } finally {
              if (mounted) setIsAuthLoading(false);
          }
      };

      initAuth();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          
          if (event === 'SIGNED_IN' && session?.user) {
              try {
                  const { data } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
                  if (data) {
                      const mappedUser = mapUser(data);
                      
                      if (mappedUser.role === Role.SUPERVISOR && mappedUser.status === UserStatus.PENDING) {
                           await supabase.auth.signOut();
                           setLoginError("Your supervisor account is pending Admin approval.");
                           setCurrentUser(null);
                           setIsAuthenticated(false);
                           return;
                      }

                      setCurrentUser(mappedUser);
                      setIsAuthenticated(true);
                      // On explicit sign-in event, we can fetch users
                      await fetchUsers();
                  }
              } catch (e) {
                  console.error("Auth state change error:", e);
              }
          } else if (event === 'SIGNED_OUT') {
              setCurrentUser(null);
              setIsAuthenticated(false);
          }
      });

      return () => {
          mounted = false;
          subscription.unsubscribe();
      };
  }, []);

  // Fetch Data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
        fetchUsers(); // Fetch users in background when authenticated
        fetchAllData();
    }
  }, [isAuthenticated]);

  // --- Auth Logic ---
  const handleLogin = async (email: string, password: string) => {
      setLoginError('');
      try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          
          if (error) {
              setLoginError(error.message);
              return;
          }

          if (data.user) {
              // 1. Try to fetch profile by ID
              const { data: profileData, error: profileError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', data.user.id)
                  .maybeSingle();
              
              if (profileError) {
                  console.error("Profile fetch error:", profileError);
                  setLoginError(`Login error: ${profileError.message}`);
                  await supabase.auth.signOut();
                  return;
              }

              if (profileData) {
                const profile = mapUser(profileData);
                
                // Check if account is PENDING approval
                if (profile.role === Role.SUPERVISOR && profile.status === UserStatus.PENDING) {
                    setLoginError("Your supervisor account is currently pending Admin approval.");
                    await supabase.auth.signOut();
                    return;
                }
                
                if (profile.status === UserStatus.REJECTED) {
                    setLoginError("Your account registration was rejected.");
                    await supabase.auth.signOut();
                    return;
                }

                setCurrentUser(profile);
                setIsAuthenticated(true);
                await fetchUsers();
              } else {
                  // 2. Profile missing? Check if it exists by email (orphaned from ID mismatch)
                  console.info("Profile missing for auth user. Checking for existing email...");

                  const { data: existingProfile } = await supabase
                      .from('users')
                      .select('*')
                      .eq('email', data.user.email)
                      .maybeSingle();

                  if (existingProfile) {
                      // Link Auth ID to existing profile
                      console.log("Linking Auth ID to existing profile...");
                      const { data: linkedProfile, error: linkError } = await supabase
                          .from('users')
                          .update({ id: data.user.id }) // Update ID to match Auth
                          .eq('email', data.user.email)
                          .select()
                          .single();

                      if (linkedProfile) {
                          const mappedLinked = mapUser(linkedProfile);
                          
                          if (mappedLinked.role === Role.SUPERVISOR && mappedLinked.status === UserStatus.PENDING) {
                               setLoginError("Your supervisor account is pending Admin approval.");
                               await supabase.auth.signOut();
                               return;
                          }

                          setCurrentUser(mappedLinked);
                          setIsAuthenticated(true);
                          await fetchUsers();
                      } else {
                          console.error("Linking failed:", linkError);
                          setLoginError(`Login failed: Could not link profile. (${linkError?.message})`);
                          await supabase.auth.signOut();
                      }
                  } else {
                      // 3. Create entirely new profile
                      console.info("Creating new recovery profile...");
                      const defaultName = data.user.email?.split('@')[0] || 'User';
                      const recoveryProfile = {
                          id: data.user.id,
                          email: data.user.email!,
                          name: defaultName,
                          role: 'STUDENT',
                          status: 'ACTIVE',
                          password: 'managed_by_supabase_auth',
                          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=random`,
                          total_hours_required: 120,
                          profile_skills: [],
                          hobbies: [],
                          achievements: [],
                          future_goals: []
                      };

                      const { data: newProfile, error: createError } = await supabase
                          .from('users')
                          .insert(recoveryProfile)
                          .select()
                          .single();
                      
                      if (createError) {
                          if (createError.code === '23505') { // unique_violation (email)
                              console.log("Profile exists (hidden by RLS or race condition). Attempting to link...");
                              const { data: linkedProfile, error: linkError } = await supabase
                                  .from('users')
                                  .update({ id: data.user.id })
                                  .eq('email', data.user.email)
                                  .select()
                                  .single();
                              
                              if (linkedProfile) {
                                  setCurrentUser(mapUser(linkedProfile));
                                  setIsAuthenticated(true);
                                  await fetchUsers();
                                  return;
                              }
                          }
                          
                          console.error("Self-healing failed:", createError);
                          setLoginError(`Login failed: Profile creation failed. (${createError?.message})`);
                          await supabase.auth.signOut();
                      } else if (newProfile) {
                          setCurrentUser(mapUser(newProfile));
                          setIsAuthenticated(true);
                          await fetchUsers();
                      }
                  }
              }
          }
      } catch (e: any) {
          setLoginError(`Unexpected login error: ${e.message}`);
      }
  };

  const handleRegister = async (userData: Omit<User, 'id' | 'avatar' | 'assignedSupervisorId' | 'status'>, password: string) => {
      setLoginError('');
      
      const { data, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: password,
      });

      if (authError) {
          setLoginError(authError.message);
          return;
      }

      if (data.user) {
          // Determine initial status based on role
          const initialStatus = userData.role === Role.SUPERVISOR ? UserStatus.PENDING : UserStatus.ACTIVE;

          const dbUser = {
              id: data.user.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              status: initialStatus,
              password: 'managed_by_supabase_auth', 
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
              phone: userData.phone,
              institution: userData.institution,
              department: userData.department,
              bio: userData.bio,
              hobbies: userData.hobbies || [],
              profile_skills: userData.profileSkills || [],
              total_hours_required: userData.role === Role.STUDENT ? 120 : undefined,
              achievements: [],
              future_goals: []
          };

          const { error: dbError } = await supabase.from('users').insert(dbUser);

          if (dbError) {
              if (dbError.code === '23505') { // unique_violation handling for seeded users
                   const { error: updateError } = await supabase
                        .from('users')
                        .update({ id: data.user.id })
                        .eq('email', userData.email);

                   if (updateError) {
                        setLoginError('Account already exists but could not be linked: ' + updateError.message);
                   } else {
                        if (data.session) {
                            // Only auto-login if not supervisor (pending)
                            if (userData.role !== Role.SUPERVISOR) {
                                const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
                                if (profile) {
                                    setCurrentUser(mapUser(profile));
                                    setIsAuthenticated(true);
                                    await fetchUsers();
                                }
                            } else {
                                alert('Registration successful! Your supervisor account is pending Admin approval.');
                            }
                        } else {
                            if (userData.role === Role.SUPERVISOR) {
                                alert('Registration successful! Your supervisor account is pending Admin approval.');
                            } else {
                                alert('Registration successful! You can now log in.');
                            }
                        }
                   }
              } else {
                  setLoginError('Account created but profile setup failed: ' + dbError.message);
              }
          } else {
              if (userData.role === Role.SUPERVISOR) {
                   alert('Registration successful! Your supervisor account is now pending Admin approval. You will not be able to login until approved.');
                   // Ensure we don't auto login
                   await supabase.auth.signOut();
                   setIsAuthenticated(false);
              } else {
                  if (data.session) {
                      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
                      if (profile) {
                          setCurrentUser(mapUser(profile));
                          setIsAuthenticated(true);
                          await fetchUsers();
                      }
                  } else {
                      alert('Registration successful! You can now log in.');
                  }
              }
          }
      }
  };

  const handlePasswordReset = (email: string, newPassword: string): boolean => {
      return true;
  };
  
  const getUserByEmail = async (email: string): Promise<User | null> => {
      const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      return data ? mapUser(data) : null;
  };

  const handleLogout = async () => {
      try {
          // Clear state immediately to give instant feedback to the user
          setCurrentUser(null);
          setIsAuthenticated(false);
          setUsers([]); 
          
          // Perform sign out
          await supabase.auth.signOut();
      } catch (e) {
          console.error("Sign out error:", e);
      }
  };

  const handleApproveUser = async (userId: string, status: UserStatus) => {
      const { error } = await supabase.from('users').update({ status }).eq('id', userId);
      if (!error) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      } else {
          console.error("Error updating user status:", error);
          alert("Failed to update user status");
      }
  };

  // ... (rest of App component methods: gamification, logs, tasks, admin functions etc)
  const awardBadge = async (userId: string, badgeId: string) => {
      const hasBadge = userBadges.some(ub => ub.userId === userId && ub.badgeId === badgeId);
      if (hasBadge) return;
      
      const badge = badges.find(b => b.id === badgeId);
      
      const { data, error } = await supabase.from('user_badges').insert({
          user_id: userId,
          badge_id: badgeId,
          earned_at: new Date().toISOString()
      }).select().single();

      if (data) {
          setUserBadges(prev => [...prev, mapUserBadge(data)]);
          if (badge) {
              handleSendNotification({
                  senderId: 'SYSTEM',
                  recipientId: userId,
                  title: 'Badge Unlocked!',
                  message: `Congratulations! You've earned the "${badge.name}" badge and ${badge.points} XP!`,
                  type: NotificationType.INFO
              });
          }
      }
  };

  const checkLogStreak = (studentId: string, currentLogs: LogEntry[]) => {
      const uniqueDates = Array.from(new Set(
          currentLogs
          .filter(l => l.studentId === studentId)
          .map(l => l.date)
      )).sort();

      let streak = 0;
      for (let i = 0; i < uniqueDates.length; i++) {
          if (i === 0) {
              streak = 1;
              continue;
          }
          const prev = new Date(uniqueDates[i-1]);
          const curr = new Date(uniqueDates[i]);
          const diffTime = Math.abs(curr.getTime() - prev.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

          if (diffDays === 1) {
              streak++;
          } else {
              streak = 1;
          }

          if (streak >= 5) {
              awardBadge(studentId, 'b1'); // b1 = Early Bird
              break;
          }
      }
  };

  const handleAddLog = async (newLogData: Omit<LogEntry, 'id' | 'status'>) => {
    const payload = {
        student_id: newLogData.studentId,
        date: newLogData.date,
        hours_worked: newLogData.hoursWorked,
        activity_description: newLogData.activityDescription,
        challenges: newLogData.challenges,
        status: LogStatus.PENDING
    };

    const { data, error } = await supabase.from('logs').insert(payload).select().single();

    if (data) {
        setLogs(prev => {
            const updatedLogs = [...prev, mapLog(data)];
            checkLogStreak(newLogData.studentId, updatedLogs);
            return updatedLogs;
        });
    } else if (error) {
        console.error("Error adding log:", error);
    }
  };

  const handleApproveLog = async (logId: string, approved: boolean, comment?: string) => {
    const updates = {
        status: approved ? LogStatus.APPROVED : LogStatus.REJECTED,
        supervisor_comment: comment
    };
    
    const { error } = await supabase.from('logs').update(updates).eq('id', logId);
    
    if (!error) {
        setLogs(prev => prev.map(log => 
            log.id === logId 
            ? { ...log, status: approved ? LogStatus.APPROVED : LogStatus.REJECTED, supervisorComment: comment } 
            : log
        ));
    }
  };

  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
    const payload = {
        title: newTaskData.title,
        description: newTaskData.description,
        assigned_to_id: newTaskData.assignedToId,
        assigned_by_id: newTaskData.assignedById,
        status: TaskStatus.TODO,
        priority: newTaskData.priority,
        due_date: newTaskData.dueDate,
        linked_goal_id: newTaskData.linkedGoalId || null,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('tasks').insert(payload).select().single();

    if (data) {
        setTasks(prev => [...prev, mapTask(data)]);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);

      if (!error) {
          setTasks(prev => {
              const updatedTasks = prev.map(task => task.id === taskId ? { ...task, status } : task);
              if (status === TaskStatus.COMPLETED) {
                  const task = updatedTasks.find(t => t.id === taskId);
                  if (task) {
                      const completedCount = updatedTasks.filter(t => t.assignedToId === task.assignedToId && t.status === TaskStatus.COMPLETED).length;
                      if (completedCount >= 10) awardBadge(task.assignedToId, 'b2');
                  }
              }
              return updatedTasks;
          });
      }
  };
  
  const handleSubmitDeliverable = async (taskId: string, deliverable: TaskDeliverable) => {
      const { error } = await supabase.from('tasks').update({
          deliverable: deliverable,
          status: TaskStatus.COMPLETED
      }).eq('id', taskId);

      if (!error) {
          setTasks(prev => {
              const updatedTasks = prev.map(task =>
                task.id === taskId ? { ...task, deliverable, status: TaskStatus.COMPLETED } : task
              );
              const task = updatedTasks.find(t => t.id === taskId);
              if (task) {
                  const completedCount = updatedTasks.filter(t => t.assignedToId === task.assignedToId && t.status === TaskStatus.COMPLETED).length;
                  if (completedCount >= 10) awardBadge(task.assignedToId, 'b2');
              }
              return updatedTasks;
          });
      }
  };

  const handleGiveFeedback = async (taskId: string, feedback: TaskFeedback) => {
      const { error } = await supabase.from('tasks').update({ feedback }).eq('id', taskId);

      if (!error) {
          setTasks(prev => prev.map(task =>
              task.id === taskId ? { ...task, feedback } : task
          ));
          if (feedback.type === FeedbackType.PRAISE) {
              const task = tasks.find(t => t.id === taskId);
              if (task) awardBadge(task.assignedToId, 'b4');
          }
      }
  };

  const handleAddIntern = (userData: Omit<User, 'id' | 'role' | 'avatar' | 'status'>) => {
      const newUser: User = {
          ...userData,
          id: `temp_${Date.now()}`,
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
          assignedSupervisorId: currentUser?.role === Role.SUPERVISOR ? currentUser.id : undefined
      };
      setUsers(prev => [...prev, newUser]);
      alert("Note: In a real system, this would send an invite. For this demo, please register a new account with this email.");
  };

  const handleUpdateIntern = async (updatedUser: User) => {
      const { error } = await supabase.from('users').update({
          name: updatedUser.name,
          phone: updatedUser.phone,
          institution: updatedUser.institution,
          department: updatedUser.department,
          bio: updatedUser.bio,
          hobbies: updatedUser.hobbies,
          profile_skills: updatedUser.profileSkills,
          achievements: updatedUser.achievements,
          future_goals: updatedUser.futureGoals,
          role: updatedUser.role,
          status: updatedUser.status,
          supervisor_notes: updatedUser.supervisorNotes // Handle private notes
      }).eq('id', updatedUser.id);

      if (!error) {
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
  };

  // --- Admin User Management ---

  const handleAddUser = async (user: Omit<User, 'id' | 'status'>) => {
      const tempId = generateUUID();
      
      const payload = { 
          id: tempId,
          email: user.email,
          name: user.name,
          role: user.role,
          status: UserStatus.ACTIVE, // Admin added users are active by default
          avatar: user.avatar,
          phone: user.phone || null,
          institution: user.institution || null,
          department: user.department || null,
          bio: user.bio || null,
          hobbies: user.hobbies || [],
          profile_skills: user.profileSkills || [],
          achievements: user.achievements || [],
          future_goals: user.futureGoals || [],
          total_hours_required: user.totalHoursRequired || 120,
          internship_start_date: user.internshipStartDate || null,
          internship_end_date: user.internshipEndDate || null,
          assigned_supervisor_id: user.assignedSupervisorId || null,
          password: user.password || 'placeholder_password' 
      };

      const { data, error } = await supabase.from('users').insert(payload).select().single();
      
      if (data) {
          setUsers(prev => [...prev, mapUser(data)]);
          alert(`User "${user.name}" added successfully. Note: They will need to register with this email to access the account.`);
      } else {
          console.error("Error adding user:", error);
          alert(`Error adding user: ${error?.message || 'Unknown error occurred'}`);
      }
  };

  const handleDeleteUser = async (userId: string) => {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (!error) {
          setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
          console.error("Error deleting user:", error);
      }
  };

  const handleAddReport = async (reportData: Omit<Report, 'id' | 'submittedAt'>) => {
    const payload = {
        student_id: reportData.studentId,
        type: reportData.type,
        period_start: reportData.periodStart,
        period_end: reportData.periodEnd,
        summary: reportData.summary,
        key_learnings: reportData.keyLearnings,
        next_steps: reportData.nextSteps,
        submitted_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('reports').insert(payload).select().single();
    if (data) setReports(prev => [...prev, mapReport(data)]);
  };

  const handleAddGoal = async (goalData: Omit<Goal, 'id' | 'progress' | 'status'>) => {
      const payload = {
          student_id: goalData.studentId,
          description: goalData.description,
          category: goalData.category,
          alignment: goalData.alignment,
          status: GoalStatus.NOT_STARTED,
          progress: 0
      };
      const { data, error } = await supabase.from('goals').insert(payload).select().single();
      if (data) setGoals(prev => [...prev, mapGoal(data)]);
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    const { error } = await supabase.from('goals').update({
        description: updatedGoal.description,
        category: updatedGoal.category,
        alignment: updatedGoal.alignment,
        status: updatedGoal.status,
        progress: updatedGoal.progress
    }).eq('id', updatedGoal.id);

    if (!error) setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const handleDeleteGoal = async (goalId: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (!error) setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleAddResource = async (resourceData: Omit<Resource, 'id' | 'uploadDate' | 'uploadedBy'>) => {
    const payload = {
        title: resourceData.title,
        type: resourceData.type,
        url: resourceData.url,
        uploaded_by: currentUser!.id,
        upload_date: new Date().toISOString()
    };
    const { data, error } = await supabase.from('resources').insert(payload).select().single();
    if (data) setResources(prev => [...prev, mapResource(data)]);
  };

  const handleAddEvaluation = async (evalData: Omit<Evaluation, 'id'>) => {
    const payload = {
        student_id: evalData.studentId,
        supervisor_id: evalData.supervisorId,
        type: evalData.type,
        date: evalData.date,
        scores: evalData.scores,
        overall_feedback: evalData.overallFeedback
    };
    const { data, error } = await supabase.from('evaluations').insert(payload).select().single();
    if (data) setEvaluations(prev => [...prev, mapEvaluation(data)]);
  };

  const handleSendMessage = async (msgData: Omit<Message, 'id' | 'timestamp'>) => {
      const payload = {
          sender_id: msgData.senderId,
          content: msgData.content,
          channel: msgData.channel,
          related_student_id: msgData.relatedStudentId,
          timestamp: new Date().toISOString()
      };
      const { data, error } = await supabase.from('messages').insert(payload).select().single();
      if (data) setMessages(prev => [...prev, mapMessage(data)]);
  };

  const handleScheduleMeeting = async (meetingData: Omit<Meeting, 'id'>) => {
      const payload = {
          title: meetingData.title,
          organizer_id: meetingData.organizerId,
          date: meetingData.date,
          time: meetingData.time,
          attendees: meetingData.attendees,
          link: meetingData.link
      };
      const { data, error } = await supabase.from('meetings').insert(payload).select().single();
      if (data) {
          const newMeeting = mapMeeting(data);
          setMeetings(prev => [...prev, newMeeting]);
          newMeeting.attendees.forEach(attendeeId => {
              const meetingCount = meetings.filter(m => m.attendees.includes(attendeeId)).length + 1;
              if (meetingCount >= 3) awardBadge(attendeeId, 'b3');
          });
      }
  };

  const handleSendNotification = async (notifData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const payload = {
          recipient_id: notifData.recipientId,
          sender_id: notifData.senderId,
          title: notifData.title,
          message: notifData.message,
          type: notifData.type,
          timestamp: new Date().toISOString(),
          read: false
      };
      const { data, error } = await supabase.from('notifications').insert(payload).select().single();
      if (data) setNotifications(prev => [mapNotification(data), ...prev]);
  };

  const markNotificationRead = async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleAddSkillAssessment = async (assessmentData: Omit<SkillAssessment, 'id'>) => {
    const payload = {
        student_id: assessmentData.studentId,
        rater_id: assessmentData.raterId,
        role: assessmentData.role,
        date: assessmentData.date,
        ratings: assessmentData.ratings
    };
    const { data, error } = await supabase.from('skill_assessments').insert(payload).select().single();
    if (data) setSkillAssessments(prev => [...prev, mapSkillAssessment(data)]);
  };

  const handleAddSkill = async (skillData: Omit<Skill, 'id'>) => {
    const { data, error } = await supabase.from('skills').insert(skillData).select().single();
    if (data) setSkills(prev => [...prev, mapSkill(data)]);
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    const { error } = await supabase.from('users').update({
          name: updatedUser.name,
          phone: updatedUser.phone,
          institution: updatedUser.institution,
          department: updatedUser.department,
          bio: updatedUser.bio,
          hobbies: updatedUser.hobbies,
          profile_skills: updatedUser.profileSkills,
          achievements: updatedUser.achievements,
          future_goals: updatedUser.futureGoals
    }).eq('id', updatedUser.id);
    
    if (!error) {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
    }
  };

  const handleAddLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'status'>) => {
      const payload = {
          student_id: requestData.studentId,
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          type: requestData.type,
          reason: requestData.reason,
          status: LeaveStatus.PENDING
      };
      const { data, error } = await supabase.from('leave_requests').insert(payload).select().single();
      if (data) setLeaveRequests(prev => [...prev, mapLeaveRequest(data)]);
  };

  const handleUpdateLeaveStatus = async (requestId: string, status: LeaveStatus) => {
      const { error } = await supabase.from('leave_requests').update({ status }).eq('id', requestId);
      if (!error) setLeaveRequests(prev => prev.map(lr => lr.id === requestId ? { ...lr, status } : lr));
  };
  
  const handleAddSiteVisit = async (visitData: Omit<SiteVisit, 'id'>) => {
      const payload = {
          student_id: visitData.studentId,
          visitor_id: visitData.visitorId,
          date: visitData.date,
          location: visitData.location,
          purpose: visitData.purpose,
          notes: visitData.notes
      };
      const { data, error } = await supabase.from('site_visits').insert(payload).select().single();
      if (data) setSiteVisits(prev => [...prev, mapSiteVisit(data)]);
  };

  const handleUpdateSiteVisit = async (updatedVisit: SiteVisit) => {
      const { error } = await supabase.from('site_visits').update({
          date: updatedVisit.date,
          location: updatedVisit.location,
          purpose: updatedVisit.purpose,
          notes: updatedVisit.notes
      }).eq('id', updatedVisit.id);
      if (!error) setSiteVisits(prev => prev.map(sv => sv.id === updatedVisit.id ? updatedVisit : sv));
  };

  const handleDeleteSiteVisit = async (visitId: string) => {
      const { error } = await supabase.from('site_visits').delete().eq('id', visitId);
      if (!error) setSiteVisits(prev => prev.filter(sv => sv.id !== visitId));
  };

  const handleAddAttendanceException = async (exceptionData: Omit<AttendanceException, 'id'>) => {
      const payload = {
          student_id: exceptionData.studentId,
          date: exceptionData.date,
          reason: exceptionData.reason,
          type: exceptionData.type
      };
      const { data, error } = await supabase.from('attendance_exceptions').insert(payload).select().single();
      if (data) setAttendanceExceptions(prev => [...prev, mapAttendanceException(data)]);
  };

  const handleDeleteAttendanceException = async (id: string) => {
      const { error } = await supabase.from('attendance_exceptions').delete().eq('id', id);
      if (!error) setAttendanceExceptions(prev => prev.filter(ae => ae.id !== id));
  };

  const myNotifications = useMemo(() => {
      if (!currentUser) return [];
      return notifications.filter(n => n.recipientId === 'ALL' || n.recipientId === currentUser.id)
          .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, currentUser]);
  
  const unreadCount = myNotifications.filter(n => !n.read).length;

  if (isAuthLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="text-sm font-medium">Initializing Application...</p>
          </div>
      );
  }

  // Safety fallback if something critical crashed but not caught by error boundary
  if (isAuthenticated && !currentUser) {
       return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 text-rose-600 p-8 text-center">
              <AlertTriangle className="mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">Account State Error</h2>
              <p className="mb-4">You are authenticated but your user profile could not be loaded.</p>
              <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                  Reset & Sign Out
              </button>
          </div>
       );
  }

  if (!isAuthenticated || !currentUser) {
      return (
          <Auth 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
            onResetPassword={handlePasswordReset}
            getUserByEmail={getUserByEmail}
            loginError={loginError}
            setLoginError={setLoginError}
          />
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
               <img src="https://i.postimg.cc/xdsSw8X5/DEEP_SHIFT_LOGOOO.png" alt="Deep Shift Logo" className="h-10 w-auto" />
               <span className="text-xl font-bold text-slate-900 tracking-tight hidden md:block">{APP_NAME}</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative" ref={notifDropdownRef}>
                    <button 
                        onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                        )}
                    </button>

                    {isNotifDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in zoom-in-95 z-50">
                            <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={() => setNotifications(prev => prev.map(n => ({...n, read:true})))} className="text-xs text-indigo-600 hover:underline">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {myNotifications.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-sm">No notifications</div>
                                ) : (
                                    myNotifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none cursor-pointer ${!notif.read ? 'bg-indigo-50/50' : ''}`}
                                            onClick={() => markNotificationRead(notif.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 flex-shrink-0 p-1.5 rounded-full h-fit ${notif.type === NotificationType.ANNOUNCEMENT ? 'bg-purple-100 text-purple-600' : notif.type === NotificationType.ALERT ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {notif.type === NotificationType.ANNOUNCEMENT ? <Megaphone size={14}/> : notif.type === NotificationType.ALERT ? <X size={14}/> : <Info size={14}/>}
                                                </div>
                                                <div>
                                                    <h4 className={`text-sm ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>{notif.title}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                                        {new Date(notif.timestamp).toLocaleDateString()} • {new Date(notif.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-900">{currentUser.name}</span>
                    <span className="text-xs text-slate-500 font-mono uppercase">{currentUser.role}</span>
                </div>
                <img 
                    src={currentUser.avatar} 
                    alt="Profile" 
                    className="h-10 w-10 rounded-full ring-2 ring-white shadow-sm"
                />
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                
                <button 
                    onClick={handleLogout}
                    className="text-xs bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                    <LogOut size={14} /> <span className="hidden md:inline">Logout</span>
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === Role.ADMIN ? (
          <AdminPortal
            currentUser={currentUser}
            users={users}
            logs={logs}
            tasks={tasks}
            resources={resources}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateIntern}
            onDeleteUser={handleDeleteUser}
            onAddResource={handleAddResource}
            onApproveUser={handleApproveUser}
          />
        ) : currentUser.role === Role.STUDENT ? (
            <StudentPortal 
                user={currentUser} 
                users={users}
                logs={logs} 
                tasks={tasks} 
                reports={reports}
                goals={goals}
                resources={resources}
                evaluations={evaluations}
                messages={messages}
                meetings={meetings}
                skills={skills}
                skillAssessments={skillAssessments}
                badges={badges}
                userBadges={userBadges}
                leaveRequests={leaveRequests}
                siteVisits={siteVisits}
                onAddLog={handleAddLog}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onAddReport={handleAddReport}
                onUpdateGoal={handleUpdateGoal}
                onSubmitDeliverable={handleSubmitDeliverable}
                onSendMessage={handleSendMessage}
                onAddSkillAssessment={handleAddSkillAssessment}
                onUpdateProfile={handleUpdateProfile}
                onAddLeaveRequest={handleAddLeaveRequest}
                onAddSiteVisit={handleAddSiteVisit}
            />
        ) : (
            <SupervisorPortal 
                user={currentUser}
                users={users}
                logs={logs}
                tasks={tasks}
                reports={reports}
                goals={goals}
                resources={resources}
                evaluations={evaluations}
                messages={messages}
                meetings={meetings}
                skills={skills}
                skillAssessments={skillAssessments}
                badges={badges}
                userBadges={userBadges}
                leaveRequests={leaveRequests}
                siteVisits={siteVisits}
                attendanceExceptions={attendanceExceptions}
                onApproveLog={handleApproveLog}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onAddIntern={handleAddIntern}
                onUpdateIntern={handleUpdateIntern}
                onAddGoal={handleAddGoal}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
                onAddResource={handleAddResource}
                onGiveFeedback={handleGiveFeedback}
                onAddEvaluation={handleAddEvaluation}
                onSendMessage={handleSendMessage}
                onScheduleMeeting={handleScheduleMeeting}
                onAddSkillAssessment={handleAddSkillAssessment}
                onAddSkill={handleAddSkill}
                onSendNotification={handleSendNotification}
                onUpdateLeaveStatus={handleUpdateLeaveStatus}
                onAddSiteVisit={handleAddSiteVisit}
                onUpdateSiteVisit={handleUpdateSiteVisit}
                onDeleteSiteVisit={handleDeleteSiteVisit}
                onAddAttendanceException={handleAddAttendanceException}
                onDeleteAttendanceException={handleDeleteAttendanceException}
            />
        )}
      </main>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white py-3 px-4 text-center text-sm z-50 flex items-center justify-center gap-3 shadow-lg border-t border-slate-700 animate-in slide-in-from-bottom duration-300">
            <WifiOff size={18} className="text-rose-400" />
            <span className="font-medium">You are currently offline. Please check your internet connection.</span>
        </div>
      )}
    </div>
  );
}

export default App;
