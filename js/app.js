// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const durationInput = document.getElementById('duration');
const taskList = document.getElementById('task-list');
const taskTypeInputs = document.querySelectorAll('input[name="task-type"]');
const appointmentFields = document.getElementById('appointment-fields');
const recurrenceSelect = document.getElementById('recurrence');

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

// Toggle appointment fields based on task type
function toggleAppointmentFields() {
    const isAppointment = document.querySelector('input[name="task-type"]:checked').value === 'appointment';
    appointmentFields.style.display = isAppointment ? 'flex' : 'none';
    if (!isAppointment) {
        // Set default duration for reminders
        durationInput.value = '0';
    } else if (durationInput.value === '0') {
        durationInput.value = '60'; // Default duration for appointments
    }
}
// Initialize the app
function init() {
    // Set default date to today
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
    
    // Set default time to next hour
    const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
    timeInput.value = `${String(nextHour.getHours()).padStart(2, '0')}:00`;
    
    // Toggle time/duration fields based on task type
    const toggleAppointmentFields = (isAppointment) => {
        appointmentFields.style.display = isAppointment ? 'flex' : 'none';
        timeInput.required = isAppointment;
        durationInput.required = isAppointment;
    };
    
    // Set up task type toggle
    document.querySelectorAll('input[name="task-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            toggleAppointmentFields(e.target.value === 'appointment');
        });
    });
    
    // Initialize fields based on default selection
    toggleAppointmentFields(document.querySelector('input[name="task-type"]:checked').value === 'appointment');
    
    // Load tasks
    loadTasks();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
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
    const taskType = document.querySelector('input[name="task-type"]:checked').value;
    const recurrence = recurrenceSelect.value;
    
    if (!taskText || !taskDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Format date as MMDDYY
    const [year, month, day] = taskDate.split('-');
    const formattedDate = `${month}${day}${year.slice(2)}`;
    
    // Format time as HHMM
    let formattedTime = '1200'; // Default for all-day reminders
    let taskDuration = 0; // Default for all-day events
    
    if (taskType === 'appointment') {
        if (!taskTime) {
            alert('Please enter a time for the appointment');
            return;
        }
        const [hours, minutes] = taskTime.split(':');
        formattedTime = `${hours.padStart(2, '0')}${minutes.padStart(2, '0')}`;
        taskDuration = parseInt(durationInput.value) || 60;
    }
    
    const task = {
        id: Date.now().toString(),
        title: taskText,
        type: taskType,
        date: formattedDate,
        time: formattedTime,
        duration: taskType === 'appointment' ? taskDuration : 0,
        recurrence: recurrence === 'none' ? null : recurrence,
        createdAt: new Date().toISOString(),
        completed: false
    };
    
    // Save to localStorage
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
    
    // Export to calendar
    exportToCalendar(task);
}

// Format recurrence text
function getRecurrenceText(recurrence) {
    if (!recurrence) return '';
    const texts = {
        'daily': 'Daily',
        'weekly': 'Weekly',
        'monthly': 'Monthly',
        'yearly': 'Yearly'
    };
    return `<span class="recurrence-badge">${texts[recurrence]}</span>`;
}

// Add task to the DOM
function addTaskToDOM(task, index) {
    // Remove empty state if present
    if (taskList.querySelector('.empty-state')) {
        taskList.innerHTML = '';
    }
    
    // Format date for display (MM/DD/YY)
    const formattedDate = `${task.date.substring(0, 2)}/${task.date.substring(2, 4)}/${task.date.substring(4)}`;
    
    // Create task element
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''} ${task.type}`;
    taskElement.dataset.id = task.id;
    
    // Common task info
    let taskHTML = `
        <div class="task-info">
            <div class="task-title">
                ${task.title}
                ${getRecurrenceText(task.recurrence)}
            </div>
            <div class="task-meta">
                <span>📅 ${formattedDate}</span>
    `;
    
    // Add time and duration for appointments
    if (task.type === 'appointment') {
        // Format time for display (HH:MM AM/PM)
        const taskHours = parseInt(task.time.substring(0, 2));
        const taskMinutes = task.time.substring(2);
        const formattedTime = `${String(taskHours % 12 || 12).padStart(2, '0')}:${taskMinutes} ${taskHours >= 12 ? 'PM' : 'AM'}`;
        
        // Format duration
        const durationHours = Math.floor(task.duration / 60);
        const durationMinutes = task.duration % 60;
        const formattedDuration = durationHours > 0 ? 
            `${durationHours}h ${durationMinutes}m` : 
            `${durationMinutes}m`;
        
        taskHTML += `
                <span>🕒 ${formattedTime}</span>
                <span>⏱️ ${formattedDuration}</span>
        `;
    } else {
        taskHTML += `
                <span>⏰ All day</span>
        `;
    }
    
    // Close task meta and add actions
    taskHTML += `
            </div>
        </div>
        <div class="task-actions">
            <button class="btn-icon calendar-btn" title="Add to Calendar">📅</button>
            <button class="btn-icon delete-btn" title="Delete">🗑️</button>
        </div>
    `;
    
    taskElement.innerHTML = taskHTML;
    
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

// Format date for ICS (UTC)
function formatDateForICS(date) {
    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
        String(date.getUTCDate()).padStart(2, '0'),
        'T',
        String(date.getUTCHours()).padStart(2, '0'),
        String(date.getUTCMinutes()).padStart(2, '0'),
        String(date.getUTCSeconds()).padStart(2, '0'),
        'Z'
    ].join('');
}

// Get RRULE for recurring events
function getRRule(task) {
    if (!task.recurrence) return '';
    
    const dtStart = new Date(
        `20${task.date.slice(4)}-${task.date.slice(0, 2)}-${task.date.slice(2, 4)}T${task.time.slice(0, 2)}:${task.time.slice(2)}:00Z`
    );
    
    const rrule = {
        FREQ: task.recurrence.toUpperCase(),
        INTERVAL: 1,
        DTSTART: formatDateForICS(dtStart)
    };
    
    return Object.entries(rrule)
        .map(([key, value]) => `${key}=${value}`)
        .join(';');
}

// Export task to calendar (ICS format)
function exportToCalendar(task) {
    // Parse task date and time
    const year = `20${task.date.slice(4)}`;
    const month = task.date.slice(0, 2);
    const day = task.date.slice(2, 4);
    
    // Create start date (in local time)
    let startDate, endDate;
    const isAllDay = task.type === 'reminder';
    
    if (isAllDay) {
        // For all-day events, set to start of day and next day
        startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    } else {
        // For appointments, use specific time and add duration
        const hours = task.time.slice(0, 2);
        const minutes = task.time.slice(2);
        startDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
        );
        endDate = new Date(startDate.getTime() + ((task.duration || 60) * 60000));
    }
    
    // Format dates for ICS (in UTC)
    const formatDate = (date, isAllDay = false) => {
        if (isAllDay) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}${m}${d}`;
        }
        return formatDateForICS(new Date(date.toISOString()));
    };
    
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    const now = formatDate(new Date());
    
    // Create ICS content
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Task Manager PWA//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${task.id}@task-manager-pwa`,
        `DTSTAMP:${formatDateForICS(new Date())}`,
        isAllDay ? `DTSTART;VALUE=DATE:${formatDate(startDate, true)}` : `DTSTART:${formatDate(startDate)}`,
        isAllDay ? `DTEND;VALUE=DATE:${formatDate(endDate, true)}` : `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${task.title.replace(/[\,;]/g, '\\$&')}`,
        `DESCRIPTION:${task.title.replace(/[\,;]/g, '\\$&')}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
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
