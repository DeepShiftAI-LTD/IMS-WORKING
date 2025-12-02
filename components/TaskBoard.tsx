

import React, { useState } from 'react';
import { Task, TaskStatus, FeedbackType, Goal } from '../types';
import { Card, PriorityBadge, FeedbackBadge } from './UI';
import { Clock, CheckCircle2, Circle, Link as LinkIcon, UploadCloud, ExternalLink, MessageSquarePlus, AlertCircle, Target } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  goals?: Goal[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  readOnly?: boolean;
  onSubmitDeliverable?: (task: Task) => void;
  onGiveFeedback?: (task: Task) => void;
}

interface TaskItemProps {
  task: Task;
  columnStatus: TaskStatus;
  goals?: Goal[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  readOnly?: boolean;
  onSubmitDeliverable?: (task: Task) => void;
  onGiveFeedback?: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  columnStatus, 
  goals,
  onStatusChange, 
  readOnly, 
  onSubmitDeliverable, 
  onGiveFeedback 
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleStatusAction = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      // If marking as completed, trigger animation first
      if (newStatus === TaskStatus.COMPLETED && columnStatus !== TaskStatus.COMPLETED) {
        setIsExiting(true);
        setTimeout(() => {
          onStatusChange(task.id, newStatus);
        }, 400); // Duration matches CSS transition
      } else {
        onStatusChange(task.id, newStatus);
      }
    }
  };

  const needsFeedback = onGiveFeedback && columnStatus === TaskStatus.COMPLETED && !task.feedback;
  const linkedGoal = goals?.find(g => g.id === task.linkedGoalId);

  return (
    <Card 
      className={`p-4 hover:shadow-md border-l-4 hover:border-l-indigo-500 flex flex-col gap-2 transform transition-all duration-500 ease-in-out ${
        isExiting ? 'opacity-0 scale-90 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
      } ${needsFeedback ? 'border-l-indigo-400 ring-2 ring-indigo-50 border-t border-r border-b border-indigo-100' : 'border-l-transparent'}`}
    >
      <div className="flex justify-between items-start">
        <PriorityBadge priority={task.priority} />
        <span className="text-xs text-slate-400">{new Date(task.dueDate).toLocaleDateString()}</span>
      </div>

      {needsFeedback && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full w-fit animate-pulse">
              <AlertCircle size={10} /> Feedback Due
          </div>
      )}
      
      <h4 className="font-medium text-slate-900">{task.title}</h4>

      {linkedGoal && (
           <div className="flex items-center gap-1.5 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit border border-blue-100" title={`Linked to: ${linkedGoal.description}`}>
               <Target size={10} className="flex-shrink-0" />
               <span className="truncate max-w-[180px] font-medium">{linkedGoal.description}</span>
           </div>
       )}

      <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
      
      {/* Feedback Section */}
      {task.feedback && (
          <div className="mt-2 pt-2 border-t border-slate-50">
              <div className="mb-1">
                  <FeedbackBadge type={task.feedback.type} />
              </div>
              <p className="text-xs text-slate-600 italic break-words">"{task.feedback.comment}"</p>
          </div>
      )}

      {/* Give Feedback Trigger (Only for Supervisor on Completed Tasks without feedback) */}
      {needsFeedback && (
          <button 
              onClick={() => onGiveFeedback!(task)}
              className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 shadow-sm shadow-indigo-200"
          >
              <MessageSquarePlus size={14} /> Give Feedback
          </button>
      )}

      {/* Deliverable Section */}
      {task.deliverable ? (
          <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded p-2 flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 size={12} />
              <span className="font-medium flex-1">Work Submitted</span>
              {task.deliverable.url && (
                  <a href={task.deliverable.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      View <ExternalLink size={10}/>
                  </a>
              )}
          </div>
      ) : (
          !readOnly && onSubmitDeliverable && (columnStatus === TaskStatus.IN_PROGRESS || columnStatus === TaskStatus.COMPLETED || columnStatus === TaskStatus.OVERDUE) && (
              <button 
                  onClick={() => onSubmitDeliverable(task)}
                  className="mt-2 w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-md text-xs font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                  <UploadCloud size={14} /> Submit Deliverable
              </button>
          )
      )}

      {/* Action Buttons */}
      {!readOnly && onStatusChange && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
          {columnStatus !== TaskStatus.TODO && (
              <button 
                  onClick={() => handleStatusAction(TaskStatus.TODO)}
                  className="text-xs px-2 py-1 rounded hover:bg-slate-100 text-slate-500">
                  To Do
              </button>
          )}
          {columnStatus !== TaskStatus.IN_PROGRESS && (
              <button 
                  onClick={() => handleStatusAction(TaskStatus.IN_PROGRESS)}
                  className="text-xs px-2 py-1 rounded hover:bg-amber-50 text-amber-600 font-medium">
                  In Progress
              </button>
          )}
          {columnStatus !== TaskStatus.COMPLETED && (
              <button 
                  onClick={() => handleStatusAction(TaskStatus.COMPLETED)}
                  className="text-xs px-2 py-1 rounded hover:bg-emerald-50 text-emerald-600 font-medium">
                  Done
              </button>
          )}
        </div>
      )}
    </Card>
  );
};

const TaskColumn: React.FC<{ 
  title: string; 
  status: TaskStatus; 
  tasks: Task[]; 
  goals?: Goal[];
  icon: React.ReactNode;
  colorClass: string;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  readOnly?: boolean;
  onSubmitDeliverable?: (task: Task) => void;
  onGiveFeedback?: (task: Task) => void;
}> = ({ title, status, tasks, goals, icon, colorClass, onStatusChange, readOnly, onSubmitDeliverable, onGiveFeedback }) => {
  return (
    <div className="flex-1 min-w-[280px] flex flex-col gap-3">
      <div className={`flex items-center gap-2 pb-2 border-b-2 ${colorClass} mb-2`}>
        {icon}
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {tasks.map(task => (
          <TaskItem 
            key={task.id}
            task={task}
            goals={goals}
            columnStatus={status}
            onStatusChange={onStatusChange}
            readOnly={readOnly}
            onSubmitDeliverable={onSubmitDeliverable}
            onGiveFeedback={onGiveFeedback}
          />
        ))}
        {tasks.length === 0 && (
            <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                No tasks
            </div>
        )}
      </div>
    </div>
  );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, goals, onStatusChange, readOnly = false, onSubmitDeliverable, onGiveFeedback }) => {
  const todoTasks = tasks.filter(t => t.status === TaskStatus.TODO);
  const progressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

  return (
    <div className="flex overflow-x-auto gap-6 pb-4">
      <TaskColumn 
        title="To Do" 
        status={TaskStatus.TODO} 
        tasks={todoTasks} 
        goals={goals}
        icon={<Circle size={18} className="text-slate-400" />}
        colorClass="border-slate-300"
        onStatusChange={onStatusChange}
        readOnly={readOnly}
        onSubmitDeliverable={onSubmitDeliverable}
        onGiveFeedback={onGiveFeedback}
      />
      <TaskColumn 
        title="In Progress" 
        status={TaskStatus.IN_PROGRESS} 
        tasks={progressTasks} 
        goals={goals}
        icon={<Clock size={18} className="text-amber-500" />}
        colorClass="border-amber-400"
        onStatusChange={onStatusChange}
        readOnly={readOnly}
        onSubmitDeliverable={onSubmitDeliverable}
        onGiveFeedback={onGiveFeedback}
      />
      <TaskColumn 
        title="Completed" 
        status={TaskStatus.COMPLETED} 
        tasks={completedTasks} 
        goals={goals}
        icon={<CheckCircle2 size={18} className="text-emerald-500" />}
        colorClass="border-emerald-400"
        onStatusChange={onStatusChange}
        readOnly={readOnly}
        onSubmitDeliverable={onSubmitDeliverable}
        onGiveFeedback={onGiveFeedback}
      />
    </div>
  );
};