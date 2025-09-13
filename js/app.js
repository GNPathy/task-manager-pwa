// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const durationInput = document.getElementById('duration');
const taskList = document.getElementById('task-list');

// Format date as YYYY-MM-DD
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format time as HH:MM
function formatTimeForInput(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Initialize the app
function init() {
    // Load tasks from localStorage
    loadTasks();
    
    // Set today's date and current time as default
    const now = new Date();
    dateInput.value = formatDateForInput(now);
    timeInput.value = formatTimeForInput(now);
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/task-manager-pwa/service-worker.js', { scope: '/task-manager-pwa/' })
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}

// Load tasks from localStorage
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>';
        return;
    }
    
    tasks.forEach((task, index) => {
        addTaskToDOM(task, index);
    });
}

// Add a new task
function addTask(event) {
    event.preventDefault();
    
    const taskText = taskInput.value.trim();
    const taskDate = dateInput.value;
    const taskTime = timeInput.value;
    const taskDuration = parseInt(durationInput.value) || 60;
    
    if (!taskText || !taskDate || !taskTime) {
        alert('Please fill in all fields');
        return;
    }
    
    // Format date as MMDDYY
    const [year, month, day] = taskDate.split('-');
    const formattedDate = `${month}${day}${year.slice(2)}`;
    
    // Format time as HHMM
    const [hours, minutes] = taskTime.split(':');
    const formattedTime = `${hours}${minutes}`;
    
    const task = {
        id: Date.now().toString(),
        title: taskText,
        date: formattedDate,
        time: formattedTime,
        duration: taskDuration,
        completed: false
    };
    
    // Save task
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Add to DOM
    addTaskToDOM(task, tasks.length - 1);
    
    // Reset form but keep the current date and time
    taskInput.value = '';
    const now = new Date();
    dateInput.value = formatDateForInput(now);
    timeInput.value = formatTimeForInput(now);
    taskInput.focus();
}

// Add task to the DOM
function addTaskToDOM(task, index) {
    // Remove empty state if present
    if (taskList.querySelector('.empty-state')) {
        taskList.innerHTML = '';
    }
    
    // Format date for display (MM/DD/YY)
    const formattedDate = `${task.date.substring(0, 2)}/${task.date.substring(2, 4)}/${task.date.substring(4)}`;
    
    // Format time for display (HH:MM AM/PM)
    const taskHours = parseInt(task.time.substring(0, 2));
    const taskMinutes = task.time.substring(2);
    const formattedTime = `${String(taskHours % 12 || 12).padStart(2, '0')}:${taskMinutes} ${taskHours >= 12 ? 'PM' : 'AM'}`;
    
    // Format duration
    const durationHours = Math.floor(task.duration / 60);
    const durationMinutes = task.duration % 60;
    const formattedDuration = durationHours > 0 ? `${durationHours}h ${durationMinutes}m` : `${durationMinutes}m`;
    
    // Create task element
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskElement.dataset.id = task.id;
    
    taskElement.innerHTML = `
        <div class="task-info">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                <span>📅 ${formattedDate}</span>
                <span>🕒 ${formattedTime}</span>
                <span>⏱️ ${formattedDuration}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="btn-icon calendar-btn" title="Add to Calendar">📅</button>
            <button class="btn-icon delete-btn" title="Delete">🗑️</button>
        </div>
    `;
    
    // Add event listeners
    const deleteBtn = taskElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    const calendarBtn = taskElement.querySelector('.calendar-btn');
    calendarBtn.addEventListener('click', () => exportToCalendar(task));
    
    taskList.prepend(taskElement);
}

// Delete a task
function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Refresh the task list
    loadTasks();
}

// Export task to calendar (ICS format)
function exportToCalendar(task) {
    // Format date and time for ICS
    const year = `20${task.date.slice(4)}`;
    const month = task.date.slice(0, 2);
    const day = task.date.slice(2, 4);
    const hours = task.time.slice(0, 2);
    const minutes = task.time.slice(2);
    
    // Calculate end time based on duration
    const startDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
    );
    
    const endDate = new Date(startDate.getTime() + (task.duration * 60000));
    
    // Format dates for ICS in Pacific Time
    const formatDate = (date) => {
        // Convert to Pacific Time
        const options = { 
            timeZone: 'America/Los_Angeles',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        // Format date in Pacific Time
        const dtf = new Intl.DateTimeFormat('en-US', options);
        const [
            { value: month },
            ,
            { value: day },
            ,
            { value: year },
            ,
            { value: hour },
            ,
            { value: minute },
            ,
            { value: second }
        ] = dtf.formatToParts(date);
        
        // Format as YYYYMMDDTHHMMSS (Pacific Time is -0700 or -0800 depending on DST)
        const isPDT = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' }).includes('PDT');
        const tzOffset = isPDT ? '-0700' : '-0800';
        
        return `${year}${month}${day}T${hour}${minute}${second}${tzOffset}`;
    };
    
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    const now = formatDate(new Date());
    
    // Create ICS content
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Task Manager//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${task.title}`,
        `DESCRIPTION:${task.title}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
    
    // Create and trigger download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-${task.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
taskForm.addEventListener('submit', addTask);
