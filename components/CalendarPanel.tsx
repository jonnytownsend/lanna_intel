import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, CheckSquare, Plus, Bell } from 'lucide-react';
import { dbService, STORES } from '../services/db';
import { AppTask } from '../types';

const CalendarPanel: React.FC = () => {
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [newTask, setNewTask] = useState('');

  const loadTasks = async () => {
    const data = await dbService.getAll<AppTask>(STORES.TASKS);
    setTasks(data);
  };

  useEffect(() => {
    loadTasks();
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const task: AppTask = {
      id: Date.now(),
      title: newTask,
      date: new Date().toISOString(),
      completed: false,
      priority: 'medium'
    };
    await dbService.add(STORES.TASKS, task);
    setNewTask('');
    loadTasks();
    
    // Trigger notification
    if (Notification.permission === 'granted') {
      new Notification('Lanna Intel: Task Added', { body: task.title });
    }
  };

  const toggleTask = async (task: AppTask) => {
    const updated = { ...task, completed: !task.completed };
    await dbService.add(STORES.TASKS, updated); // Put overwrites if key exists
    loadTasks();
  };

  return (
    <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-3 text-white shadow-xl w-[280px] mt-2 max-h-[300px] flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
           <CalIcon size={12}/> Ops Calendar
         </span>
         <Bell size={12} className="text-slate-500 hover:text-cyan-400 cursor-pointer"/>
      </div>

      <div className="flex gap-2 mb-2">
        <input 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New intel task..."
          className="flex-1 bg-slate-800 border-none rounded text-xs px-2 py-1 text-white focus:ring-1 focus:ring-cyan-500"
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        <button onClick={addTask} className="bg-cyan-600 hover:bg-cyan-500 p-1 rounded">
          <Plus size={14} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar">
        {tasks.length === 0 && <div className="text-xs text-slate-600 text-center py-4">No active operations.</div>}
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 group">
            <button onClick={() => toggleTask(task)} className={`text-slate-500 hover:text-cyan-400 ${task.completed ? 'text-green-500' : ''}`}>
              <CheckSquare size={14} />
            </button>
            <span className={`text-xs ${task.completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>
              {task.title}
            </span>
            <span className="text-[10px] text-slate-600 ml-auto">
              {new Date(task.date).getDate()}/{new Date(task.date).getMonth()+1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPanel;
