
import React, { useState, useMemo } from 'react';
import { LogEntry, AttendanceException } from '../types';
import { Card } from './UI';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface AttendanceCalendarProps {
  studentId: string;
  logs: LogEntry[];
  exceptions?: AttendanceException[];
  startDate?: string;
  endDate?: string;
  onDateClick?: (dateStr: string) => void;
  interactive?: boolean;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ studentId, logs, exceptions = [], startDate, endDate, onDateClick, interactive = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Filter logs for this specific student
  const studentLogs = useMemo(() => logs.filter(l => l.studentId === studentId), [logs, studentId]);

  // Helper to get status of a day
  const getDayData = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(dateObj);
    compareDate.setHours(0, 0, 0, 0);

    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const isFuture = compareDate > today;
    
    // Check if outside internship duration
    const isBeforeStart = startDate && dateStr < startDate;
    const isAfterEnd = endDate && dateStr > endDate;
    const isOutOfRange = isBeforeStart || isAfterEnd;

    // Check Exceptions (Holidays or Excused)
    const exception = exceptions.find(e => (e.studentId === 'ALL' || e.studentId === studentId) && e.date === dateStr);
    
    const dayLogs = studentLogs.filter(l => l.date === dateStr);
    const hasLog = dayLogs.length > 0;
    const totalHours = dayLogs.reduce((acc, log) => acc + log.hoursWorked, 0);

    let status: 'present' | 'absent' | 'weekend' | 'future' | 'excused' | 'holiday' | 'disabled' = 'absent';

    if (isOutOfRange) status = 'disabled';
    else if (isFuture) status = 'future';
    else if (hasLog) status = 'present';
    else if (exception) {
        status = exception.type === 'HOLIDAY' ? 'holiday' : 'excused';
    }
    else if (isWeekend) status = 'weekend';
    // otherwise it remains 'absent' (past weekday with no logs)

    return { status, totalHours, dateStr, exception };
  };

  // Generate grid cells
  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Empty cells for padding before 1st of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-full" />);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const { status, totalHours, exception, dateStr } = getDayData(day);
      let bgClass = '';
      let content = <>{day}</>;
      let cursorClass = interactive && status !== 'disabled' ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400' : 'cursor-default';
      
      const isToday = dateStr === todayStr;

      switch (status) {
        case 'present':
          bgClass = 'bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 shadow-sm';
          break;
        case 'absent':
          bgClass = 'bg-rose-100 text-rose-600 font-medium border border-rose-200';
          break;
        case 'excused':
          bgClass = 'bg-blue-100 text-blue-600 font-medium border border-blue-200';
          break;
        case 'holiday':
          bgClass = 'bg-purple-100 text-purple-600 font-medium border border-purple-200';
          break;
        case 'weekend':
          bgClass = 'bg-slate-100 text-slate-400';
          break;
        case 'disabled':
          bgClass = 'bg-slate-50 text-slate-300 border border-slate-100 opacity-50';
          break;
        case 'future':
        default:
          bgClass = 'bg-white text-slate-300 border border-slate-100';
          break;
      }

      // Add indicator for exception if we want extra visual, but background color is now distinct
      if (exception && status !== 'disabled' && status !== 'holiday' && status !== 'excused') {
          // Fallback if for some reason it's present AND exception (e.g. worked on holiday)
          content = (
              <>
                {day}
                <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${exception.type === 'HOLIDAY' ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
              </>
          );
      }

      days.push(
        <div 
          key={day} 
          onClick={() => interactive && status !== 'disabled' && onDateClick && onDateClick(dateStr)}
          className={`h-9 w-full rounded-md flex items-center justify-center text-xs transition-all duration-200 relative group ${bgClass} ${cursorClass} ${isToday ? 'ring-2 ring-indigo-600 z-10' : ''}`}
          title={
             (isToday ? 'TODAY - ' : '') + 
             (status === 'present' ? `${totalHours} Hours Logged` 
             : status === 'excused' ? `Excused: ${exception?.reason}`
             : status === 'holiday' ? `Holiday: ${exception?.reason}`
             : status === 'absent' ? 'Missing Log Entry' 
             : status === 'disabled' ? 'Outside Internship Period'
             : '')
          }
        >
          {content}
        </div>
      );
    }
    return days;
  };

  // Calculate stats for current view
  const stats = useMemo(() => {
    let present = 0;
    let totalWeekdaysPast = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        if (dateObj > today) continue; // Don't count future
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // Skip out of range
        if (startDate && dateStr < startDate) continue;
        if (endDate && dateStr > endDate) continue;

        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        
        const exception = exceptions.find(e => (e.studentId === 'ALL' || e.studentId === studentId) && e.date === dateStr);
        const isExcused = !!exception;

        if (!isWeekend && !isExcused) {
            totalWeekdaysPast++;
            if (studentLogs.some(l => l.date === dateStr)) {
                present++;
            }
        } else if (isExcused && studentLogs.some(l => l.date === dateStr)) {
            // If they worked on an excused day, simplified count as present
            present++;
        }
    }
    return { present, total: totalWeekdaysPast };
  }, [year, month, studentLogs, daysInMonth, exceptions, studentId, startDate, endDate]);

  const attendanceRate = stats.total > 0 ? Math.min(100, Math.round((stats.present / stats.total) * 100)) : 0;
  let rateColor = 'text-slate-500';
  if (attendanceRate >= 90) rateColor = 'text-emerald-600';
  else if (attendanceRate < 70) rateColor = 'text-rose-600';

  return (
    <Card className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CalendarIcon size={18} />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 text-sm">Attendance Overview</h3>
                <div className={`text-xs font-bold ${rateColor}`}>
                    {attendanceRate}% Rate <span className="font-normal text-slate-400">({stats.present}/{stats.total} days)</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-white rounded text-slate-600 transition-colors"><ChevronLeft size={14}/></button>
          <span className="text-xs font-bold text-slate-700 w-16 text-center select-none">{monthName.slice(0, 3)}</span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-white rounded text-slate-600 transition-colors"><ChevronRight size={14}/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center border-b border-slate-100 pb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1.5 flex-1 content-start">
        {renderCalendarDays()}
      </div>

      <div className="flex gap-4 mt-4 text-[10px] font-medium justify-center border-t border-slate-100 pt-3 flex-wrap">
          <div className="flex items-center gap-1.5" title="Log submitted">
              <div className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-200 rounded-sm"></div>
              <span className="text-slate-600">Present</span>
          </div>
          <div className="flex items-center gap-1.5" title="Weekday in past with no log">
              <div className="w-2.5 h-2.5 bg-rose-100 border border-rose-200 rounded-sm"></div>
              <span className="text-slate-600">Missed</span>
          </div>
           <div className="flex items-center gap-1.5" title="Excused Absence">
              <div className="w-2.5 h-2.5 bg-blue-100 border border-blue-200 rounded-sm"></div>
              <span className="text-slate-600">Excused</span>
          </div>
          <div className="flex items-center gap-1.5" title="Public Holiday">
              <div className="w-2.5 h-2.5 bg-purple-100 border border-purple-200 rounded-sm"></div>
              <span className="text-slate-600">Holiday</span>
          </div>
           <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border-2 border-indigo-600 rounded-sm bg-transparent"></div>
              <span className="text-slate-600">Today</span>
          </div>
      </div>
    </Card>
  );
};
