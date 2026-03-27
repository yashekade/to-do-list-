// --- DOM Elements ---
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskDate = document.getElementById('task-date');
const taskTime = document.getElementById('task-time');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');

const xpBar = document.getElementById('xp-bar');
const xpText = document.getElementById('xp-text');
const levelDisplay = document.getElementById('level-display');
const badgeDisplay = document.getElementById('league-badge');
const iconContainer = document.getElementById('league-icon-container');

const barChart = document.getElementById('bar-chart');
const statusChart = document.getElementById('status-chart');
const completionRate = document.getElementById('completion-rate');

const modal = document.getElementById('league-up-modal');
const modalBadge = document.getElementById('new-badge-display');
const modalIcon = document.getElementById('new-badge-icon');
const closeModal = document.getElementById('close-modal');

// --- Game State ---
let currentXP = 0;
let currentLevel = 1;
const xpPerTask = 25;
const xpToLevelUp = 100;

let stats = { total: 0, completed: 0 };
let weeklyHistory = [3, 5, 2, 8, 4, 0, 0];

// --- League System (Every 10 Levels) + SVG Logos ---
const leagues = [
    { threshold: 1, name: 'Novice', class: 'novice', 
      svg: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' }, // Shield
    
    { threshold: 10, name: 'Bronze', class: 'bronze', 
      svg: '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' }, // Star
    
    { threshold: 20, name: 'Silver', class: 'silver', 
      svg: '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><circle cx="12" cy="12" r="3"/></svg>' }, // Star with Core
    
    { threshold: 30, name: 'Gold', class: 'gold', 
      svg: '<svg viewBox="0 0 24 24"><path d="M2 22h20l-2-13-4 4-6-8-6 8-4-4 2 13z"/></svg>' }, // Crown
    
    { threshold: 40, name: 'Diamond', class: 'diamond', 
      svg: '<svg viewBox="0 0 24 24"><polygon points="12 2 22 8.5 12 22 2 8.5 12 2"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="22" y1="8.5" x2="2" y2="8.5"/></svg>' } // Gem
];

// Initialize
updateDashboard();
checkLeagueUpgrade(); // Set initial logo

// --- Events ---
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
closeModal.addEventListener('click', () => modal.classList.add('hidden'));

// --- Core Logic ---
function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;
    
    const cat = taskCategory.value;
    const dateVal = taskDate.value;
    const timeVal = taskTime.value;

    stats.total++;

    // Format Date & Time nicely
    let scheduleHTML = '';
    if (dateVal || timeVal) {
        let displayStr = [];
        if (dateVal) {
            const dateObj = new Date(dateVal);
            displayStr.push(dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        if (timeVal) {
            // Convert 24h to 12h format
            const [h, m] = timeVal.split(':');
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            displayStr.push(`${h12}:${m} ${ampm}`);
        }
        scheduleHTML = `<div class="task-meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${displayStr.join(' at ')}
        </div>`;
    }

    const li = document.createElement('li');
    li.classList.add('task-item');
    li.innerHTML = `
        <div class="checkbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="task-content">
            <span class="task-text"><span class="cat-tag">${cat}</span>${text}</span>
            ${scheduleHTML}
        </div>
        <button class="delete-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;

    li.querySelector('.checkbox').addEventListener('click', () => toggleTask(li));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(li));

    taskList.prepend(li);
    
    // Clear Inputs
    taskInput.value = '';
    taskDate.value = '';
    taskTime.value = '';
    
    updateDashboard();
}

function toggleTask(taskElement) {
    const isCompleted = taskElement.classList.contains('completed');
    if (!isCompleted) {
        taskElement.classList.add('completed');
        stats.completed++;
        weeklyHistory[6]++; 
        gainXP();
    } else {
        taskElement.classList.remove('completed');
        stats.completed--;
        weeklyHistory[6]--;
        loseXP();
    }
    updateDashboard();
}

function deleteTask(taskElement) {
    if (taskElement.classList.contains('completed')) {
        stats.completed--;
        weeklyHistory[6]--;
    }
    stats.total--;
    taskElement.remove();
    updateDashboard();
}

// --- Gamification & Leagues ---
function gainXP() {
    currentXP += xpPerTask;
    if (currentXP >= xpToLevelUp) {
        currentLevel++;
        currentXP = currentXP - xpToLevelUp; 
        checkLeagueUpgrade();
    }
    updateGamificationUI();
}

function loseXP() {
    currentXP -= xpPerTask;
    if (currentXP < 0) {
        if (currentLevel > 1) {
            currentLevel--;
            currentXP = xpToLevelUp + currentXP;
            checkLeagueDowngrade();
        } else { currentXP = 0; }
    }
    updateGamificationUI();
}

function updateGamificationUI() {
    levelDisplay.innerText = currentLevel;
    xpText.innerText = `${currentXP} / ${xpToLevelUp} XP`;
    xpBar.style.width = `${(currentXP / xpToLevelUp) * 100}%`;
}

function getCurrentLeague() {
    return leagues.slice().reverse().find(l => currentLevel >= l.threshold);
}

function checkLeagueUpgrade() {
    const league = getCurrentLeague();
    
    if (!badgeDisplay.classList.contains(league.class)) {
        // Update Header
        badgeDisplay.className = `league-badge ${league.class}`;
        badgeDisplay.innerText = league.name;
        iconContainer.innerHTML = league.svg;
        iconContainer.className = `league-icon-sm ${league.class}`;
        
        // Skip modal for level 1 initial load
        if (currentLevel > 1) {
            modalBadge.className = `massive-badge ${league.class}`;
            modalBadge.innerText = league.name;
            modalIcon.innerHTML = league.svg;
            modalIcon.className = `massive-icon-container ${league.class}`;
            modal.classList.remove('hidden');
        }
    }
}

function checkLeagueDowngrade() {
    const league = getCurrentLeague();
    badgeDisplay.className = `league-badge ${league.class}`;
    badgeDisplay.innerText = league.name;
    iconContainer.innerHTML = league.svg;
    iconContainer.className = `league-icon-sm ${league.class}`;
}

// --- Dashboard Updates ---
function updateDashboard() {
    let percentage = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
    completionRate.innerText = `${percentage}%`;
    statusChart.style.background = `conic-gradient(var(--success) 0% ${percentage}%, var(--pending) ${percentage}% 100%)`;

    barChart.innerHTML = '';
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const maxTasks = Math.max(...weeklyHistory, 10); 

    weeklyHistory.forEach((val, index) => {
        const heightPercent = (val / maxTasks) * 100;
        const isToday = index === 6;
        barChart.innerHTML += `
            <div class="bar-wrapper">
                <div class="bar-fill ${isToday ? 'today' : ''}" style="height: ${heightPercent}%"></div>
                <span>${days[index]}</span>
            </div>
        `;
    });
}