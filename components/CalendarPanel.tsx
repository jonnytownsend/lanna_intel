
import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, CheckSquare, Plus, Bell, Link as LinkIcon, Clock, CalendarDays, X } from 'lucide-react';
import { dbService, STORES } from '../services/db';
import { AppTask } from '../types';

const CalendarPanel: React.FC = () => {
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskUrl, setNewTaskUrl] = useState('');

  const loadTasks = async () => {
    const data = await dbService.getAll<AppTask>(STORES.TASKS);
    // Sort by due date
    const sorted = data.sort((a, b) => {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return timeA - timeB;
    });
    setTasks(sorted);
  };

  useEffect(() => {
    loadTasks();
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    // Construct Due Date ISO String
    let dueISO = undefined;
    if(newTaskDate) {
        const dateStr = newTaskDate;
        const timeStr = newTaskTime || '09:00';
        dueISO = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    }

    const task: AppTask = {
      id: Date.now(),
      title: newTaskTitle,
      date: new Date().toISOString(),
      dueDate: dueISO,
      url: newTaskUrl.trim() || undefined,
      completed: false,
      priority: 'medium'
    };
    await dbService.add(STORES.TASKS, task);
    
    // Reset
    setNewTaskTitle('');
    setNewTaskDate('');
    setNewTaskTime('');
    setNewTaskUrl('');
    setIsAdding(false);
    
    loadTasks();
    
    if (Notification.permission === 'granted') {
      new Notification('Lanna Intel: Task Added', { body: task.title });
    }
  };

  const toggleTask = async (task: AppTask) => {
    const updated = { ...task, completed: !task.completed };
    await dbService.add(STORES.TASKS, updated); 
    loadTasks();
  };

  const openLink = (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-3 text-white shadow-xl w-[280px] mt-2 max-h-[500px] flex flex-col transition-all duration-300">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
           <CalIcon size={12}/> Ops Calendar
         </span>
         <button onClick={() => setIsAdding(!isAdding)} className="text-slate-500 hover:text-cyan-400">
             {isAdding ? <X size={14}/> : <Plus size={14}/>}
         </button>
      </div>

      {isAdding && (
          <div className="bg-slate-800/50 p-2 rounded mb-2 space-y-2 border border-slate-700 animate-in slide-in-from-top-2">
              <input 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task Title..."
                  className="w-full bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white focus:border-cyan-500 outline-none"
              />
              <div className="flex gap-2">
                  <div className="flex-1 relative">
                       <input 
                          type="date"
                          value={newTaskDate}
                          onChange={(e) => setNewTaskDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded text-[10px] px-2 py-1 text-slate-300 focus:border-cyan-500 outline-none"
                       />
                  </div>
                  <div className="w-20 relative">
                       <input 
                          type="time"
                          value={newTaskTime}
                          onChange={(e) => setNewTaskTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded text-[10px] px-2 py-1 text-slate-300 focus:border-cyan-500 outline-none"
                       />
                  </div>
              </div>
              <div className="flex gap-2">
                  <input 
                      value={newTaskUrl}
                      onChange={(e) => setNewTaskUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white focus:border-cyan-500 outline-none"
                  />
                  <button onClick={addTask} className="bg-cyan-600 hover:bg-cyan-500 text-white p-1 rounded w-8 flex items-center justify-center">
                      <Plus size={14}/>
                  </button>
              </div>
          </div>
      )}

      <div className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar min-h-[100px]">
        {tasks.length === 0 && <div className="text-xs text-slate-600 text-center py-4">No active operations.</div>}
        {tasks.map(task => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            const hasLink = !!task.url;

            return (
              <div key={task.id} className="bg-slate-800/30 rounded p-1.5 border border-transparent hover:border-slate-700 transition-colors group">
                <div className="flex items-start gap-2">
                    <button onClick={() => toggleTask(task)} className={`mt-0.5 text-slate-500 hover:text-cyan-400 ${task.completed ? 'text-green-500' : ''}`}>
                      <CheckSquare size={14} />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                        <div className={`text-xs break-words ${task.completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                           {task.title}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                            {task.dueDate && (
                                <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                                    <Clock size={10}/>
                                    {new Date(task.dueDate).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                </span>
                            )}
                            {hasLink && (
                                <button onClick={() => openLink(task.url!)} className="text-[10px] text-cyan-500 hover:text-cyan-300 flex items-center gap-1 bg-cyan-900/30 px-1 rounded">
                                    <LinkIcon size={10}/> Link
                                </button>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default CalendarPanel;
