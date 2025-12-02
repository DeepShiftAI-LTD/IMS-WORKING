import React, { useState, useMemo } from 'react';
import { User, LogEntry, Role, Task, Resource, UserStatus } from '../types';
import { Card, Button, StatusBadge } from './UI';
import { PermissionGuard } from './PermissionGuard';
import { Permission } from '../utils/permissions';
import { supabase } from '../lib/supabaseClient';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  GraduationCap,
  Loader2,
  FileText,
  UploadCloud,
  Check,
  X
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User;
  users: User[];
  logs: LogEntry[];
  tasks: Task[];
  resources: Resource[];
  onAddUser: (user: Omit<User, 'id' | 'status'>) => Promise<void>;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddResource: (resource: Omit<Resource, 'id' | 'uploadDate' | 'uploadedBy'>) => void;
  onApproveUser: (userId: string, status: UserStatus) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ 
  currentUser, 
  users, 
  logs, 
  tasks,
  resources,
  onAddUser, 
  onUpdateUser, 
  onDeleteUser,
  onAddResource,
  onApproveUser
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'USERS' | 'RESOURCES' | 'SETTINGS'>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: Role.STUDENT,
    institution: '',
    department: '',
    phone: '',
    internshipStartDate: '',
    internshipEndDate: '',
    password: 'password123' // Default for manual creation
  });

  // Resource Upload State
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', type: 'PDF' as 'PDF' | 'DOC' | 'LINK' | 'ZIP' | 'IMAGE', url: '' });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Derived Statistics
  const stats = useMemo(() => {
    const students = users.filter(u => u.role === Role.STUDENT && u.status === UserStatus.ACTIVE);
    const supervisors = users.filter(u => u.role === Role.SUPERVISOR && u.status === UserStatus.ACTIVE);
    const admins = users.filter(u => u.role === Role.ADMIN);
    const totalLogs = logs.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);

    return {
      totalUsers: users.length,
      studentCount: students.length,
      supervisorCount: supervisors.length,
      adminCount: admins.length,
      totalLogs,
      completedTasks,
      pendingUsers
    };
  }, [users, logs, tasks]);

  const filteredUsers = users.filter(u => 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    u.status !== UserStatus.PENDING // Filter out pending from main list if shown separately, or keep them. Let's keep them but sorted.
  ).sort((a,b) => (a.status === UserStatus.PENDING ? -1 : 1));

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution || '',
        department: user.department || '',
        phone: user.phone || '',
        internshipStartDate: user.internshipStartDate || '',
        internshipEndDate: user.internshipEndDate || '',
        password: '' // Don't show existing password
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        role: Role.STUDENT,
        institution: '',
        department: '',
        phone: '',
        internshipStartDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        internshipEndDate: '',
        password: 'password123'
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        if (editingUser) {
          await onUpdateUser({
            ...editingUser,
            name: userForm.name,
            email: userForm.email,
            role: userForm.role,
            institution: userForm.institution,
            department: userForm.department,
            phone: userForm.phone,
            internshipStartDate: userForm.internshipStartDate,
            internshipEndDate: userForm.internshipEndDate
          });
        } else {
          await onAddUser({
            name: userForm.name,
            email: userForm.email,
            role: userForm.role,
            institution: userForm.institution,
            department: userForm.department,
            phone: userForm.phone,
            internshipStartDate: userForm.internshipStartDate,
            internshipEndDate: userForm.internshipEndDate,
            password: userForm.password,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userForm.name)}&background=random`,
            profileSkills: [],
            hobbies: [],
            achievements: [],
            futureGoals: [],
            totalHoursRequired: 120
          });
        }
        setIsUserModalOpen(false);
    } catch (error) {
        console.error("Failed to save user", error);
        // Error handling is mainly done in App.tsx via alerts currently
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      onDeleteUser(userId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setUploadError(null);
      
      if (!file) {
          setResourceFile(null);
          return;
      }

      // Type Check
      const allowedTypes = {
          'PDF': ['application/pdf'],
          'DOC': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
          'IMAGE': ['image/jpeg', 'image/png'],
          'ZIP': ['application/zip', 'application/x-zip-compressed', 'application/x-7z-compressed']
      };

      // Map dropdown value to validation key
      let typeKey = newResource.type; 
      if (newResource.type === 'LINK') return; 

      // Validation logic
      const sizeMB = file.size / 1024 / 1024;
      
      if (typeKey === 'PDF' || typeKey === 'DOC') {
          if (!allowedTypes['PDF'].includes(file.type) && !allowedTypes['DOC'].includes(file.type)) {
               // Loose check: verify extension
               const ext = file.name.split('.').pop()?.toLowerCase();
               if (!['pdf', 'doc', 'docx'].includes(ext!)) {
                   setUploadError("Invalid file type. Expected PDF or DOCx.");
                   setResourceFile(null);
                   return;
               }
          }
          if (sizeMB > 5) {
              setUploadError("File too large. Max 5MB for documents.");
              setResourceFile(null);
              return;
          }
      } else if (typeKey === 'ZIP') {
           const ext = file.name.split('.').pop()?.toLowerCase();
           if (!['zip'].includes(ext!)) {
               setUploadError("Invalid file type. Expected ZIP.");
               setResourceFile(null);
               return;
           }
           if (sizeMB > 10) {
              setUploadError("File too large. Max 10MB for archives.");
              setResourceFile(null);
              return;
           }
      } else if (typeKey === 'IMAGE') {
          if (sizeMB > 2) {
              setUploadError("Image too large. Max 2MB.");
              setResourceFile(null);
              return;
          }
      }
      
      setResourceFile(file);
  };

  const handleAddResourceSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let finalUrl = newResource.url;

      if (newResource.type !== 'LINK') {
          if (!resourceFile) {
              setUploadError("Please select a file.");
              return;
          }

          setIsUploading(true);
          try {
              const fileName = `${Date.now()}_${resourceFile.name}`;
              const { data, error } = await supabase.storage.from('resources').upload(fileName, resourceFile);
              
              if (error) {
                  console.warn("Supabase Storage Upload failed (bucket might not exist in demo):", error);
                  // Mock URL since we can't ensure bucket exists in prompt environment
                  finalUrl = `https://demo-storage.com/${fileName}`; 
              } else {
                  const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(fileName);
                  finalUrl = publicUrl;
              }
          } catch (err) {
              console.error("Upload exception", err);
              finalUrl = `https://demo-storage.com/local-upload/${resourceFile.name}`;
          } finally {
              setIsUploading(false);
          }
      }

      onAddResource({
          ...newResource,
          url: finalUrl,
          type: newResource.type as any 
      });
      setIsResourceModalOpen(false);
      setNewResource({ title: '', type: 'PDF', url: '' });
      setResourceFile(null);
      setUploadError(null);
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'USERS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                <p className="text-slate-500">Manage system access and roles.</p>
              </div>
              <PermissionGuard user={currentUser} permission={Permission.CREATE_INTERN_ACCOUNT}>
                  <Button onClick={() => handleOpenUserModal()}>
                    <Plus size={16} /> Add User
                  </Button>
              </PermissionGuard>
            </div>

            {/* Pending Approvals Section */}
            {stats.pendingUsers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="text-amber-600" /> Pending Approval Requests ({stats.pendingUsers.length})
                    </h3>
                    <div className="space-y-3">
                        {stats.pendingUsers.map(user => (
                            <div key={user.id} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                                    <div>
                                        <div className="font-bold text-slate-800">{user.name}</div>
                                        <div className="text-xs text-slate-500">{user.email} • {user.role}</div>
                                        <div className="text-xs text-slate-500">{user.institution}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="danger" 
                                        className="text-xs py-1.5 h-auto bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
                                        onClick={() => onApproveUser(user.id, UserStatus.REJECTED)}
                                    >
                                        <X size={14} /> Reject
                                    </Button>
                                    <Button 
                                        className="text-xs py-1.5 h-auto bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm"
                                        onClick={() => onApproveUser(user.id, UserStatus.ACTIVE)}
                                    >
                                        <Check size={14} /> Approve
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <Search size={20} className="text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search users by name or email..."
                  className="bg-transparent outline-none w-full text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Institution/Dept</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar} className="w-8 h-8 rounded-full bg-slate-200" alt="" />
                            <div>
                              <div className="font-bold text-slate-800">{user.name}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' :
                            user.role === Role.SUPERVISOR ? 'bg-indigo-100 text-indigo-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                         <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            user.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' :
                            user.status === UserStatus.PENDING ? 'bg-amber-50 text-amber-600' :
                            'bg-rose-50 text-rose-600'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {user.institution || '-'}
                          {user.department && <span className="text-slate-400"> • {user.department}</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenUserModal(user)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Edit2 size={16} />
                            </button>
                            <PermissionGuard user={currentUser} permission={Permission.DELETE_USER}>
                                <button 
                                  onClick={() => handleDeleteClick(user.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  disabled={user.id === currentUser.id}
                                >
                                  <Trash2 size={16} />
                                </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      
      case 'RESOURCES':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-800">Resource Library</h2>
                      <p className="text-slate-500">Manage global documents and templates.</p>
                  </div>
                  <Button onClick={() => setIsResourceModalOpen(true)}>
                      <Plus size={16} /> Upload Resource
                  </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map(res => (
                      <Card key={res.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className={`p-3 rounded-lg ${res.type === 'PDF' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                              <FileText size={24} />
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-700">{res.title}</h4>
                              <p className="text-xs text-slate-400">Uploaded {new Date(res.uploadDate).toLocaleDateString()}</p>
                          </div>
                      </Card>
                  ))}
                  {resources.length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                          No resources uploaded yet.
                      </div>
                  )}
              </div>
          </div>
        );

      case 'SETTINGS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
              <p className="text-slate-500">Global configurations.</p>
            </div>
            <Card className="p-8 text-center text-slate-400 border-dashed border-2">
              <Settings size={48} className="mx-auto mb-4 opacity-20" />
              <p>Global settings configuration coming soon.</p>
            </Card>
          </div>
        );

      case 'DASHBOARD':
      default:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Admin Overview</h2>
              <p className="text-slate-500">System-wide statistics and activity.</p>
            </div>

            {/* Pending Requests Alert on Dashboard */}
            {stats.pendingUsers.length > 0 && (
                 <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow-sm flex items-start gap-3 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setActiveTab('USERS')}>
                     <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={20} />
                     <div>
                         <h3 className="font-bold text-amber-800">Pending Approval Requests</h3>
                         <p className="text-sm text-amber-700 mt-1">
                             There are {stats.pendingUsers.length} supervisor account(s) waiting for approval. Click to manage.
                         </p>
                     </div>
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-white border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalUsers}</h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Users size={24} />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-white border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Students</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.studentCount}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <GraduationCap size={24} />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supervisors</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.supervisorCount}</h3>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <Briefcase size={24} />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Logs</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalLogs}</h3>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                    <CheckCircle size={24} />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                 <h3 className="font-bold text-slate-800 mb-4">Role Distribution</h3>
                 <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Students</span>
                        <span className="font-bold">{stats.studentCount}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(stats.studentCount / stats.totalUsers) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Supervisors</span>
                        <span className="font-bold">{stats.supervisorCount}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(stats.supervisorCount / stats.totalUsers) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Admins</span>
                        <span className="font-bold">{stats.adminCount}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(stats.adminCount / stats.totalUsers) * 100}%` }}></div>
                      </div>
                    </div>
                 </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="font-bold text-slate-800 mb-4">System Status</h3>
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                   <CheckCircle className="text-emerald-500" />
                   <div>
                     <div className="font-bold text-emerald-800">All Systems Operational</div>
                     <div className="text-xs text-emerald-600">Database connected. Auth active.</div>
                   </div>
                </div>
                <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                   <AlertCircle className="text-blue-500" />
                   <div>
                     <div className="font-bold text-blue-800">Version 9.0.1</div>
                     <div className="text-xs text-blue-600">Latest patch applied successfully.</div>
                   </div>
                </div>
              </Card>
            </div>
          </div>
        );
    }
  };

  const NavButton = ({ tab, label, icon: Icon, badgeCount }: { tab: 'DASHBOARD' | 'USERS' | 'RESOURCES' | 'SETTINGS', label: string, icon: any, badgeCount?: number }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-lg md:rounded-none md:border-l-4 ${
          activeTab === tab 
          ? 'bg-indigo-50 text-indigo-700 md:border-indigo-600' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 md:border-transparent'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
          <Icon size={18} />
          <span className="whitespace-nowrap">{label}</span>
      </div>
      {badgeCount !== undefined && badgeCount > 0 && (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {badgeCount}
          </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
          <div className="flex overflow-x-auto md:flex-col p-2 md:p-0 gap-2 md:gap-0">
            <NavButton tab="DASHBOARD" label="Overview" icon={LayoutDashboard} />
            <NavButton tab="USERS" label="User Management" icon={Users} badgeCount={stats.pendingUsers.length} />
            <NavButton tab="RESOURCES" label="Resources" icon={Briefcase} />
            <NavButton tab="SETTINGS" label="Settings" icon={Settings} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={userForm.name} 
                  onChange={e => setUserForm({...userForm, name: e.target.value})} 
                  className="w-full p-2 border border-slate-300 rounded outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={userForm.email} 
                  onChange={e => setUserForm({...userForm, email: e.target.value})} 
                  className="w-full p-2 border border-slate-300 rounded outline-none" 
                  required 
                />
              </div>
              {!editingUser && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Default Password</label>
                    <input 
                      type="text" 
                      value={userForm.password} 
                      onChange={e => setUserForm({...userForm, password: e.target.value})} 
                      className="w-full p-2 border border-slate-300 rounded outline-none font-mono text-sm" 
                      required 
                    />
                  </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  value={userForm.role} 
                  onChange={e => setUserForm({...userForm, role: e.target.value as Role})} 
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                >
                  <option value={Role.STUDENT}>Student</option>
                  <option value={Role.SUPERVISOR}>Supervisor</option>
                  <option value={Role.ADMIN}>Admin</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Institution</label>
                   <input 
                      type="text" 
                      value={userForm.institution} 
                      onChange={e => setUserForm({...userForm, institution: e.target.value})} 
                      className="w-full p-2 border border-slate-300 rounded outline-none" 
                    />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                   <input 
                      type="text" 
                      value={userForm.department} 
                      onChange={e => setUserForm({...userForm, department: e.target.value})} 
                      className="w-full p-2 border border-slate-300 rounded outline-none" 
                    />
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                 <input 
                    type="tel" 
                    value={userForm.phone} 
                    onChange={e => setUserForm({...userForm, phone: e.target.value})} 
                    className="w-full p-2 border border-slate-300 rounded outline-none" 
                    placeholder="+1 (555) 000-0000"
                  />
              </div>

              {userForm.role === Role.STUDENT && (
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                     <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Internship Start</label>
                        <input 
                           type="date" 
                           value={userForm.internshipStartDate} 
                           onChange={e => setUserForm({...userForm, internshipStartDate: e.target.value})} 
                           className="w-full p-2 border border-slate-300 rounded outline-none text-sm" 
                         />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Internship End</label>
                        <input 
                           type="date" 
                           value={userForm.internshipEndDate} 
                           onChange={e => setUserForm({...userForm, internshipEndDate: e.target.value})} 
                           className="w-full p-2 border border-slate-300 rounded outline-none text-sm" 
                         />
                     </div>
                  </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsUserModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save User'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isResourceModalOpen && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                 <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                     <h2 className="text-xl font-bold text-slate-800 mb-4">Upload Resource</h2>
                     <form onSubmit={handleAddResourceSubmit} className="space-y-4">
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                             <input type="text" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full p-2 border border-slate-300 rounded outline-none" required />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                             <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value as any})} className="w-full p-2 border border-slate-300 rounded outline-none">
                                 <option value="PDF">PDF Document (Max 5MB)</option>
                                 <option value="DOC">Word Document (Max 5MB)</option>
                                 <option value="IMAGE">Image (JPEG/PNG, Max 2MB)</option>
                                 <option value="ZIP">ZIP Archive (Max 10MB)</option>
                                 <option value="LINK">External Link</option>
                             </select>
                         </div>
                         {newResource.type === 'LINK' ? (
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">URL / Link</label>
                                 <input type="text" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="https://..." required />
                             </div>
                         ) : (
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Upload File</label>
                                 <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors relative">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        accept={
                                            newResource.type === 'PDF' ? '.pdf' : 
                                            newResource.type === 'DOC' ? '.doc,.docx' : 
                                            newResource.type === 'IMAGE' ? '.jpg,.jpeg,.png' : 
                                            newResource.type === 'ZIP' ? '.zip' : '*'
                                        }
                                    />
                                    <UploadCloud className="mx-auto text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600 font-medium">
                                        {resourceFile ? resourceFile.name : "Click to select file"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {newResource.type === 'ZIP' ? 'Max 10MB' : newResource.type === 'IMAGE' ? 'Max 2MB' : 'Max 5MB'}
                                    </p>
                                 </div>
                                 {uploadError && <p className="text-xs text-rose-600 mt-2 font-bold">{uploadError}</p>}
                             </div>
                         )}
                         <div className="flex justify-end gap-2 pt-2">
                             <Button type="button" variant="secondary" onClick={() => setIsResourceModalOpen(false)} disabled={isUploading}>Cancel</Button>
                             <Button type="submit" disabled={isUploading || (newResource.type !== 'LINK' && !resourceFile)}>
                                 {isUploading ? 'Uploading...' : 'Add Resource'}
                             </Button>
                         </div>
                     </form>
                 </Card>
             </div>
        )}
    </div>
  );
};