// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const durationInput = document.getElementById('duration');
const taskList = document.getElementById('task-list');

// Initialize the app
function init() {
    // Load tasks from localStorage
    loadTasks();
    
    // Set today's date as default
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}` +
                   `${String(today.getDate()).padStart(2, '0')}` +
                   `${String(today.getFullYear()).slice(-2)}`;
    dateInput.value = dateStr;
    
    // Set current time as default
    const timeStr = `${String(today.getHours()).padStart(2, '0')}` +
                   `${String(today.getMinutes()).padStart(2, '0')}`;
    timeInput.value = timeStr;
    
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
    
    const task = {
        id: Date.now(),
        title: taskInput.value.trim(),
        date: dateInput.value.trim(),
        time: timeInput.value.trim(),
        duration: parseInt(durationInput.value) || 60,
        completed: false
    };
    
    // Basic validation
    if (!task.title || !task.date || !task.time) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!/^\d{6}$/.test(task.date)) {
        alert('Date must be in MMDDYY format');
        return;
    }
    
    if (!/^\d{4}$/.test(task.time)) {
        alert('Time must be in HHMM format');
        return;
    }
    
    // Save task
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Add to DOM
    addTaskToDOM(task, tasks.length - 1);
    
    // Reset form
    taskForm.reset();
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
    
    // Format dates for ICS with timezone
    const formatDate = (date) => {
        // Get timezone offset in minutes and convert to HHMM
        const tzOffset = -date.getTimezoneOffset();
        const tzSign = tzOffset >= 0 ? '+' : '-';
        const tzHours = Math.floor(Math.abs(tzOffset) / 60);
        const tzMinutes = Math.abs(tzOffset) % 60;
        const tzString = tzSign + 
            String(tzHours).padStart(2, '0') + 
            String(tzMinutes).padStart(2, '0');
            
        // Format date components
        const pad = n => n < 10 ? '0' + n : n;
        return date.getFullYear() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            'T' +
            pad(date.getHours()) +
            pad(date.getMinutes()) +
            pad(date.getSeconds()) +
            tzString;
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
        `DTSTART;TZID=${Intl.DateTimeFormat().resolvedOptions().timeZone}:${start}`,
        `DTEND;TZID=${Intl.DateTimeFormat().resolvedOptions().timeZone}:${end}`,
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
