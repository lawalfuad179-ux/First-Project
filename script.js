document.addEventListener('DOMContentLoaded', () => {
  const taskList = document.getElementById('task-list');
  const searchInput = document.getElementById('search-input');
  const currentDateEl = document.getElementById('current-date');
  const listHeader = document.querySelector('.list-header h2');
  
  const quickAddBtn = document.getElementById('quick-add-btn');
  const addModal = document.getElementById('add-modal');
  const closeModal = document.getElementById('close-modal');
  const addTaskForm = document.getElementById('add-task-form');
  
  const filterBtns = document.querySelectorAll('.filter-btn');
  let currentFilter = 'today';
  const categoryItems = document.querySelectorAll('.category-item');
  let currentCategory = null;

  // Stats
  const circle = document.getElementById('progress-ring-circle');
  const percentageText = document.getElementById('progress-percentage');
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;

  // Date
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);

  // Default tasks from the image to populate local storage if empty
  const defaultTasks = [
    {
      id: "1",
      title: "Design UI for Zenith App",
      desc: "Finalize dark mode mockups, gradients.",
      priority: "high",
      tag: "#design",
      time: "10:30",
      completed: true
    },
    {
      id: "2",
      title: "Team Meeting: Weekly Sync",
      desc: "Project updates, milestones.",
      priority: "high",
      tag: "#team",
      time: "14:00",
      completed: false
    },
    {
      id: "3",
      title: "Review Q4 Marketing Strategy",
      desc: "Analyze performance data.",
      priority: "medium",
      tag: "#marketing",
      time: "16:30",
      completed: false
    },
    {
      id: "4",
      title: "Launch New Website Feature",
      desc: "Deploy updates to staging.",
      priority: "medium",
      tag: "#dev",
      time: "09:00",
      completed: false
    }
  ];

  let tasks = JSON.parse(localStorage.getItem('zenithDashTasks'));
  if (!tasks || tasks.length === 0) {
    tasks = defaultTasks;
    saveTasks();
  }

  // Modals
  quickAddBtn.addEventListener('click', () => {
    addModal.style.opacity = '1';
    addModal.style.pointerEvents = 'auto';
  });

  closeModal.addEventListener('click', () => {
    addModal.style.opacity = '0';
    addModal.style.pointerEvents = 'none';
  });

  // Adding task
  addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('new-task-title').value;
    const desc = document.getElementById('new-task-desc').value;
    const priority = document.getElementById('new-task-priority').value;
    const tag = document.getElementById('new-task-tag').value;
    const time = document.getElementById('new-task-time').value;

    tasks.push({
      id: Date.now().toString(),
      title,
      desc,
      priority,
      tag,
      time,
      completed: false
    });

    saveTasks();
    renderTasks();
    addModal.style.opacity = '0';
    addModal.style.pointerEvents = 'none';
    addTaskForm.reset();
  });

  // Delegated events
  taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
      const id = e.target.closest('.task-item').dataset.id;
      toggleTask(id);
    }
    if (e.target.classList.contains('fa-trash') || e.target.classList.contains('delete-btn')) {
      const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
      const id = btn.closest('.task-item').dataset.id;
      deleteTask(id);
    }
  });

  // Filter tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      currentCategory = null;
      categoryItems.forEach(c => c.classList.remove('active'));
      renderTasks(searchInput.value.toLowerCase());
    });
  });

  // Category filter
  categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      categoryItems.forEach(c => c.classList.remove('active'));
      item.classList.add('active');
      currentCategory = item.textContent.toLowerCase();
      filterBtns.forEach(b => b.classList.remove('active'));
      renderTasks(searchInput.value.toLowerCase());
    });
  });

  // Search filter
  searchInput.addEventListener('input', (e) => {
    renderTasks(e.target.value.toLowerCase());
  });

  function saveTasks() {
    localStorage.setItem('zenithDashTasks', JSON.stringify(tasks));
  }

  function getPriorityIcon(priority) {
    if (priority === 'high') return '<i class="fa-solid fa-fire"></i> High Priority';
    if (priority === 'medium') return '<i class="fa-solid fa-signal"></i> Medium Priority';
    return '<i class="fa-solid fa-check"></i> Low Priority';
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks(searchInput.value.toLowerCase());
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks(searchInput.value.toLowerCase());
  }

  function renderTasks(filterText = '') {
    taskList.innerHTML = '';
    
    let filtered = tasks;
    
    if (currentCategory) {
      filtered = filtered.filter(t => t.tag && t.tag.toLowerCase().includes(currentCategory));
      listHeader.innerHTML = `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}`;
    } else {
      switch (currentFilter) {
        case 'inbox':
          filtered = filtered.filter(t => !t.completed);
          listHeader.innerHTML = `Inbox <span class="task-count">(${filtered.length})</span>`;
          break;
        case 'today':
          filtered = filtered.filter(t => !t.completed);
          listHeader.innerHTML = `Today: <span id="current-date">${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>`;
          break;
        case 'upcoming':
          filtered = filtered.filter(t => !t.completed);
          listHeader.innerHTML = `Upcoming <span class="task-count">(${filtered.length})</span>`;
          break;
        case 'projects':
          const tags = [...new Set(filtered.filter(t => t.tag).map(t => t.tag.replace('#', '').toLowerCase()))];
          if (tags.length === 0) {
            taskList.innerHTML = '<li class="empty-state">No projects yet. Add tasks with tags like #design, #marketing.</li>';
            updateProgress();
            return;
          }
          taskList.innerHTML = tags.map(tag => `
            <li class="project-card" data-tag="${tag}">
              <div class="project-icon"><i class="fa-solid fa-folder"></i></div>
              <div class="project-info">
                <h3>${tag.charAt(0).toUpperCase() + tag.slice(1)}</h3>
                <span>${filtered.filter(t => t.tag && t.tag.toLowerCase().includes(tag)).length} tasks</span>
              </div>
              <i class="fa-solid fa-chevron-right project-arrow"></i>
            </li>
          `).join('');
          document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
              categoryItems.forEach(c => c.classList.remove('active'));
              const tag = card.dataset.tag;
              const catItem = [...categoryItems].find(c => c.textContent.toLowerCase() === tag);
              if (catItem) {
                currentCategory = tag;
                catItem.classList.add('active');
                filterBtns.forEach(b => b.classList.remove('active'));
                renderTasks(searchInput.value.toLowerCase());
              }
            });
          });
          updateProgress();
          return;
      }
    }
    
    if (filterText) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(filterText) || (t.desc && t.desc.toLowerCase().includes(filterText)));
    }

    if (filtered.length === 0) {
      taskList.innerHTML = '<li class="empty-state">No tasks found.</li>';
    }

    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
          <h3 class="task-title">${escapeHTML(task.title)}</h3>
          ${task.desc ? `<p class="task-desc">${escapeHTML(task.desc)}</p>` : ''}
          <div class="task-meta">
            <span class="meta-priority ${task.priority}">${getPriorityIcon(task.priority)}</span>
            ${task.tag ? `<span class="meta-tag">${escapeHTML(task.tag)}</span>` : ''}
          </div>
        </div>
        ${task.time ? `<div class="task-due">Due: ${formatTime(task.time)}</div>` : ''}
        <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
      `;
      taskList.appendChild(li);
    });

    updateProgress();
  }

  function updateProgress() {
    if (tasks.length === 0) {
      setProgress(0);
      percentageText.textContent = '0%';
      return;
    }
    const completedCount = tasks.filter(t => t.completed).length;
    const percent = Math.round((completedCount / tasks.length) * 100);
    setProgress(percent);
    percentageText.textContent = `${percent}%`;
  }

  function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

  // Initial load
  renderTasks();
});
