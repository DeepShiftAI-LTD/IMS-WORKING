
import React from 'react';
import { TaskStatus, LogStatus, TaskPriority, FeedbackType } from '../types';
import { ThumbsUp, TrendingUp } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    outline: "border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus | LogStatus }> = ({ status }) => {
  const styles = {
    [TaskStatus.TODO]: "bg-slate-100 text-slate-600",
    [TaskStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
    [TaskStatus.COMPLETED]: "bg-emerald-100 text-emerald-700",
    [TaskStatus.OVERDUE]: "bg-rose-100 text-rose-700",
    [LogStatus.PENDING]: "bg-amber-100 text-amber-700",
    [LogStatus.APPROVED]: "bg-emerald-100 text-emerald-700",
    [LogStatus.REJECTED]: "bg-rose-100 text-rose-700",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const styles = {
        [TaskPriority.LOW]: "text-slate-500 bg-slate-50 border-slate-200",
        [TaskPriority.MEDIUM]: "text-blue-600 bg-blue-50 border-blue-200",
        [TaskPriority.HIGH]: "text-rose-600 bg-rose-50 border-rose-200",
    };
    return (
        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider font-bold ${styles[priority]}`}>
            {priority}
        </span>
    );
};

export const FeedbackBadge: React.FC<{ type: FeedbackType }> = ({ type }) => {
    if (type === FeedbackType.PRAISE) {
        return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 flex items-center gap-1 w-fit">
                <ThumbsUp size={10} /> PRAISE
            </span>
        );
    }
    return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 flex items-center gap-1 w-fit">
            <TrendingUp size={10} /> GROWTH
        </span>
    );
};

export const ScoreBar: React.FC<{ score: number; max?: number }> = ({ score, max = 5 }) => {
    const percentage = (score / max) * 100;
    let color = 'bg-indigo-500';
    if (percentage < 50) color = 'bg-rose-500';
    else if (percentage < 80) color = 'bg-amber-500';
    else color = 'bg-emerald-500';

    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-700 w-8 text-right">{score}/{max}</span>
        </div>
    );
};
