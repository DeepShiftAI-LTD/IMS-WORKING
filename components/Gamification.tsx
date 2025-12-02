
import React, { useMemo } from 'react';
import { User, Badge, UserBadge, Task, TaskStatus } from '../types';
import { Card } from './UI';
import { Clock, CheckCircle, Users, Star, Trophy, Medal, Target, Lock } from 'lucide-react';

interface GamificationProps {
  user: User;
  allUsers: User[];
  userBadges: UserBadge[];
  badges: Badge[];
  tasks: Task[];
}

// Helper to render icons dynamically
const BadgeIcon: React.FC<{ iconName: string; className?: string; size?: number }> = ({ iconName, className, size = 24 }) => {
    switch(iconName) {
        case 'Clock': return <Clock size={size} className={className} />;
        case 'CheckCircle': return <CheckCircle size={size} className={className} />;
        case 'Users': return <Users size={size} className={className} />;
        case 'Star': return <Star size={size} className={className} />;
        case 'Target': return <Target size={size} className={className} />;
        default: return <Trophy size={size} className={className} />;
    }
};

export const Gamification: React.FC<GamificationProps> = ({ user, allUsers, userBadges, badges, tasks }) => {
    
    // 1. Filter badges for current user
    const myEarnedBadges = useMemo(() => {
        return userBadges.filter(ub => ub.userId === user.id);
    }, [userBadges, user.id]);

    // 2. Calculate Leaderboard Data
    const leaderboardData = useMemo(() => {
        // Only include students
        const students = allUsers.filter(u => u.role === 'STUDENT');
        
        return students.map(student => {
            // Calculate Points
            // Rule: Badge Points + (Completed Tasks * 10)
            const earnedBadges = userBadges.filter(ub => ub.userId === student.id);
            const badgePoints = earnedBadges.reduce((sum, ub) => {
                const badge = badges.find(b => b.id === ub.badgeId);
                return sum + (badge ? badge.points : 0);
            }, 0);

            const completedTasks = tasks.filter(t => t.assignedToId === student.id && t.status === TaskStatus.COMPLETED).length;
            const taskPoints = completedTasks * 10;

            return {
                ...student,
                points: badgePoints + taskPoints,
                badgeCount: earnedBadges.length,
                taskCount: completedTasks
            };
        }).sort((a, b) => b.points - a.points); // Descending sort by points
    }, [allUsers, userBadges, badges, tasks]);

    const totalPoints = leaderboardData.find(u => u.id === user.id)?.points || 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                        <Trophy size={32} className="text-yellow-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Achievements & Rewards</h2>
                        <p className="text-indigo-100 text-sm">Level up your internship experience!</p>
                    </div>
                </div>
                <div className="flex gap-6 text-center">
                    <div>
                        <div className="text-3xl font-bold">{myEarnedBadges.length}</div>
                        <div className="text-xs font-medium text-indigo-200 uppercase tracking-wide">Badges</div>
                    </div>
                    <div className="w-px bg-white/20"></div>
                    <div>
                        <div className="text-3xl font-bold">{totalPoints}</div>
                        <div className="text-xs font-medium text-indigo-200 uppercase tracking-wide">XP Points</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Badges Collection */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Medal className="text-indigo-600" /> Badge Collection
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {badges.map(badge => {
                            const isEarned = myEarnedBadges.some(ub => ub.badgeId === badge.id);
                            const earnedDate = myEarnedBadges.find(ub => ub.badgeId === badge.id)?.earnedAt;

                            return (
                                <Card 
                                    key={badge.id} 
                                    className={`relative p-4 flex items-start gap-4 transition-all ${isEarned ? 'border-l-4 border-l-indigo-500 shadow-sm bg-white' : 'bg-slate-50 opacity-70 border border-dashed border-slate-200'}`}
                                >
                                    <div className={`p-3 rounded-full flex-shrink-0 ${isEarned ? badge.color : 'bg-slate-200 text-slate-400'}`}>
                                        {isEarned ? <BadgeIcon iconName={badge.icon} size={20} /> : <Lock size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold ${isEarned ? 'text-slate-800' : 'text-slate-500'}`}>{badge.name}</h4>
                                            {isEarned && <span className="text-xs font-bold text-amber-500">+{badge.points} XP</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                                        {isEarned ? (
                                            <div className="mt-2 text-[10px] text-indigo-600 font-medium">
                                                Earned on {new Date(earnedDate!).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-[10px] text-slate-400 italic">
                                                Locked - {badge.points} XP
                                            </div>
                                        )}
                                    </div>
                                    {isEarned && (
                                        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-white/0 to-indigo-50 rounded-bl-full -z-10"></div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Leaderboard */}
                <Card className="p-0 overflow-hidden border-slate-200 h-fit">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Target size={18} className="text-indigo-600" /> Top Interns
                        </h3>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Weekly</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {leaderboardData.map((data, index) => (
                            <div key={data.id} className={`p-4 flex items-center gap-3 ${data.id === user.id ? 'bg-indigo-50/50' : ''}`}>
                                <div className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-slate-100 text-slate-600' : index === 2 ? 'bg-amber-100 text-amber-700' : 'text-slate-400'}`}>
                                    {index + 1}
                                </div>
                                <img src={data.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-100" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-slate-800 truncate">
                                        {data.name} {data.id === user.id && <span className="text-slate-400 font-normal">(You)</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex gap-2">
                                        <span>{data.badgeCount} Badges</span>
                                        <span>•</span>
                                        <span>{data.taskCount} Tasks</span>
                                    </div>
                                </div>
                                <div className="font-bold text-sm text-indigo-600">{data.points} XP</div>
                            </div>
                        ))}
                         {leaderboardData.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">No data yet.</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
