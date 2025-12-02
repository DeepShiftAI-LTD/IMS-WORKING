

import React, { useState, useMemo } from 'react';
import { Skill, SkillAssessment, Role, User } from '../types';
import { Card, Button } from './UI';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plus, Target, BarChart2, Info, Save, Wand2 } from 'lucide-react';
import { suggestSkillCategory } from '../services/geminiService';

interface SkillTrackerProps {
  student: User;
  viewerRole: Role;
  skills: Skill[];
  assessments: SkillAssessment[];
  onAddAssessment: (assessment: Omit<SkillAssessment, 'id'>) => void;
  onAddSkill?: (skill: Omit<Skill, 'id'>) => void; // Only Supervisor usually
}

export const SkillTracker: React.FC<SkillTrackerProps> = ({
  student,
  viewerRole,
  skills,
  assessments,
  onAddAssessment,
  onAddSkill
}) => {
  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
  const [isManageSkillsOpen, setIsManageSkillsOpen] = useState(false);
  
  // Form State
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Technical');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Data Processing for Chart ---
  const chartData = useMemo(() => {
    // Get latest assessment for Student
    const studentAssessments = assessments
      .filter(a => a.studentId === student.id && a.role === Role.STUDENT)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestStudent = studentAssessments[0];

    // Get latest assessment for Supervisor
    const supervisorAssessments = assessments
      .filter(a => a.studentId === student.id && a.role === Role.SUPERVISOR)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestSupervisor = supervisorAssessments[0];

    // Get Initial Baseline (Oldest Supervisor Assessment) for Growth calc
    const initialSupervisor = supervisorAssessments[supervisorAssessments.length - 1];

    return skills.map(skill => {
      const studentScore = latestStudent?.ratings.find(r => r.skillId === skill.id)?.score || 0;
      const supervisorScore = latestSupervisor?.ratings.find(r => r.skillId === skill.id)?.score || 0;
      const initialScore = initialSupervisor?.ratings.find(r => r.skillId === skill.id)?.score || 0;

      return {
        subject: skill.name,
        category: skill.category,
        Student: studentScore,
        Supervisor: supervisorScore,
        Initial: initialScore,
        fullMark: 5,
      };
    });
  }, [skills, assessments, student.id]);

  // Initialize ratings form with current values or 0
  const openAssessModal = () => {
    const initialRatings: Record<string, number> = {};
    skills.forEach(s => {
        initialRatings[s.id] = 0;
    });
    setRatings(initialRatings);
    setIsAssessModalOpen(true);
  };

  const handleSubmitAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const ratingArray = Object.entries(ratings).map(([skillId, score]) => ({ skillId, score }));
    
    onAddAssessment({
      studentId: student.id,
      raterId: 'currentUser', // Handled by App wrapper usually, but conceptually here
      role: viewerRole,
      date: new Date().toISOString(),
      ratings: ratingArray
    });
    setIsAssessModalOpen(false);
  };

  const handleAddSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddSkill && newSkillName) {
        onAddSkill({ name: newSkillName, category: newSkillCategory as any });
        setNewSkillName('');
    }
    setIsManageSkillsOpen(false);
  };

  const handleAiSuggestCategory = async () => {
    if (!newSkillName) return;
    setIsAiLoading(true);
    const category = await suggestSkillCategory(newSkillName);
    setNewSkillCategory(category);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-indigo-600" /> Skill Mapping
          </h2>
          <p className="text-slate-500">
            Track competency development across target areas. Compare self-assessment with supervisor ratings.
          </p>
        </div>
        <div className="flex gap-2">
            {viewerRole === Role.SUPERVISOR && (
                <Button variant="outline" onClick={() => setIsManageSkillsOpen(true)}>
                    <Plus size={16} /> Manage Skills
                </Button>
            )}
            <Button onClick={openAssessModal}>
                <BarChart2 size={16} /> Log Assessment
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <Card className="lg:col-span-2 p-4 min-h-[400px] flex flex-col">
            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Info size={16} className="text-slate-400"/> Competency Gap Analysis
            </h3>
            <div className="flex-1 w-full h-full min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false}/>
                        
                        <Radar
                            name="Student Self-Assess"
                            dataKey="Student"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="#6366f1"
                            fillOpacity={0.3}
                        />
                        <Radar
                            name="Supervisor Rating"
                            dataKey="Supervisor"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="#10b981"
                            fillOpacity={0.3}
                        />
                        <Legend />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Metrics & Growth List */}
        <Card className="p-5 bg-slate-50/50 border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Growth Tracker</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {chartData.map((item) => {
                    const growth = item.Supervisor - item.Initial;
                    const gap = item.Student - item.Supervisor; // Positive means Student rates higher than Supervisor
                    
                    return (
                        <div key={item.subject} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm text-slate-700">{item.subject}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{item.category}</span>
                            </div>
                            
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">Current Rating</span>
                                <span className="font-bold text-emerald-600">{item.Supervisor}/5</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${(item.Supervisor/5)*100}%`}}></div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                <div className="text-xs">
                                    <span className="text-slate-400">Growth: </span>
                                    <span className={`font-bold ${growth > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        {growth > 0 ? '+' : ''}{growth}
                                    </span>
                                </div>
                                <div className="text-xs">
                                    <span className="text-slate-400">Gap: </span>
                                    <span className={`font-bold ${Math.abs(gap) > 1 ? 'text-amber-500' : 'text-slate-400'}`}>
                                        {gap > 0 ? '+' : ''}{gap}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
      </div>

      {/* Assessment Modal */}
      {isAssessModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <Card className="w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Log Competency Assessment</h2>
                  <p className="text-sm text-slate-500 mb-6">Rate proficiency from 1 (Novice) to 5 (Expert).</p>
                  
                  <form onSubmit={handleSubmitAssessment} className="space-y-4">
                      {skills.map(skill => (
                          <div key={skill.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                              <div>
                                  <div className="font-medium text-sm text-slate-800">{skill.name}</div>
                                  <div className="text-xs text-slate-400">{skill.category}</div>
                              </div>
                              <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                      <button
                                          key={score}
                                          type="button"
                                          onClick={() => setRatings(prev => ({ ...prev, [skill.id]: score }))}
                                          className={`w-8 h-8 rounded text-sm font-bold transition-all ${
                                              ratings[skill.id] === score 
                                              ? 'bg-indigo-600 text-white shadow-md scale-110' 
                                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                          }`}
                                      >
                                          {score}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                      
                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                          <Button type="button" variant="secondary" onClick={() => setIsAssessModalOpen(false)}>Cancel</Button>
                          <Button type="submit">Submit Assessment</Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}

      {/* Manage Skills Modal (Supervisor Only) */}
      {isManageSkillsOpen && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
               <h2 className="text-xl font-bold text-slate-800 mb-4">Add Target Skill</h2>
               <form onSubmit={handleAddSkillSubmit} className="space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Skill Name</label>
                       <div className="flex gap-2">
                           <input 
                               type="text"
                               value={newSkillName}
                               onChange={(e) => setNewSkillName(e.target.value)}
                               onBlur={handleAiSuggestCategory}
                               className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                               placeholder="e.g. Project Management"
                               required
                           />
                           <button
                                type="button"
                                onClick={handleAiSuggestCategory}
                                disabled={isAiLoading || !newSkillName}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                                title="Auto-classify Category"
                           >
                               <Wand2 size={20} className={isAiLoading ? 'animate-spin' : ''} />
                           </button>
                       </div>
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                       <select 
                           value={newSkillCategory}
                           onChange={(e) => setNewSkillCategory(e.target.value)}
                           className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                           disabled={isAiLoading}
                       >
                           <option value="Technical">Technical</option>
                           <option value="Soft Skill">Soft Skill</option>
                           <option value="Business">Business</option>
                       </select>
                   </div>
                   <div className="flex justify-end gap-2 pt-4">
                       <Button type="button" variant="secondary" onClick={() => setIsManageSkillsOpen(false)}>Cancel</Button>
                       <Button type="submit"><Save size={16} /> Add Skill</Button>
                   </div>
               </form>
           </Card>
       </div>
      )}
    </div>
  );
};