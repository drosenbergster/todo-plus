(() => {
  const STORAGE_KEY = "otter_todo_v1";

  /** @typedef {{ id: string, text: string, completed: boolean, createdAt: number }} Todo */
  /** @typedef {{ id: string, name: string, todos: Todo[] }} Section */

  /** @type {{ sectionsTop: Section[], sectionsBottom: Section[] }} */
  let state = migrateState(loadState()) || createInitialState();

  const els = {
    boardsTop: document.getElementById("boardsTop"),
    boardsBottom: document.getElementById("boardsBottom"),
    addSectionTopBtn: document.getElementById("addSectionTopBtn"),
    addSectionBottomBtn: document.getElementById("addSectionBottomBtn"),
    sectionTemplate: document.getElementById("sectionTemplate"),
    todoItemTemplate: document.getElementById("todoItemTemplate"),
    calendarWidget: document.getElementById("calendarWidget"),
    calendarMonthYear: document.getElementById("calendarMonthYear"),
    calendarGrid: document.getElementById("calendarGrid"),
    prevMonth: document.getElementById("prevMonth"),
    nextMonth: document.getElementById("nextMonth"),
  };

  let currentCalendarDate = new Date();

  // Otter puns, jokes, and facts
  const otterMessages = [
    "Have an otterly productive day!",
    "Stay afloat and get things done!",
    "Don't be otterwhelmed—just take it one task at a time!",
    "What's an otter's favorite subject in school? Otter-mathematics!",
    "Why do otters love organizing? Because they're nat-otter-ly good at it!",
    "Why did the otter cross the river? To get to the otter side of productivity!",
    "Sea otters hold hands while sleeping to keep from drifting apart!",
    "Otters can hold their breath for up to 8 minutes underwater!",
    "A group of otters is called a 'romp'—just like your to-do list when you finish everything!",
    "Sea otters have the densest fur of any mammal—up to 1 million hairs per square inch!",
    "Otters use tools, like rocks, to crack open shellfish—smart problem solvers!",
    "River otters can swim at speeds up to 7 miles per hour!",
    "Baby otters are called 'pups'—aww-dorable little organizers!",
    "Otters have webbed feet perfect for navigating through tasks!",
    "Sea otters wrap themselves in kelp while sleeping—nature's productivity hack!",
    "What do you call a playful otter? An otter delight!",
    "Otters have built-in pocket flaps in their armpits to store food—like nature's task organizers!",
    "The otter's whiskers are so sensitive they can detect movements from 100 feet away!",
    "Why don't otters ever get lost? They always know which way the tide is going!",
    "Otters are the only marine mammals without a layer of blubber—they rely on their fur!",
  ];

  // Set random footer message
  function setRandomFooterMessage() {
    const footerEl = document.getElementById("footerMessage");
    if (footerEl) {
      const randomMessage = otterMessages[Math.floor(Math.random() * otterMessages.length)];
      footerEl.textContent = randomMessage;
    }
  }

  // Init
  setRandomFooterMessage();
  renderAll();
  wireGlobalEvents();
  initCalendar();

  function createInitialState() {
    const sectionsTop = [
      createSection("Today"),
      createSection("This Week"),
    ];
    const sectionsBottom = [
      createSection("Someday"),
    ];
    return { sectionsTop, sectionsBottom };
  }

  function migrateState(loaded) {
    if (!loaded) return null;
    if (loaded.sectionsTop && loaded.sectionsBottom) return loaded;
    if (loaded.sections) {
      return { sectionsTop: loaded.sections, sectionsBottom: [] };
    }
    return null;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("Failed to load saved state", e);
      return null;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state", e);
    }
  }

  function createId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function createSection(name) {
    return { id: createId("sec"), name, todos: [] };
  }

  function formatTodoText(text) {
    if (!text) return text;
    text = text.trim();
    // Capitalize first letter
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    // No automatic punctuation - keep text as entered
    return text;
  }

  function createTodo(text) {
    return { id: createId("todo"), text: formatTodoText(text), completed: false, createdAt: Date.now() };
  }

  function wireGlobalEvents() {
    els.addSectionTopBtn.addEventListener("click", () => {
      const name = prompt("New section name?", "New Section");
      if (!name) return;
      const section = createSection(name.trim());
      state.sectionsTop.push(section);
      saveState();
      renderAll();
    });
    els.addSectionBottomBtn.addEventListener("click", () => {
      const name = prompt("New section name?", "New Section");
      if (!name) return;
      const section = createSection(name.trim());
      state.sectionsBottom.push(section);
      saveState();
      renderAll();
    });
  }

  function removeSection(sectionId, sectionsArr) {
    const idx = sectionsArr.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const ok = confirm("Delete this section? Tasks inside will be removed.");
    if (!ok) return;
    sectionsArr.splice(idx, 1);
    saveState();
    renderAll();
  }

  function renameSection(sectionId, sectionsArr) {
    const section = sectionsArr.find(s => s.id === sectionId);
    if (!section) return;
    const name = prompt("Rename section", section.name);
    if (!name) return;
    section.name = name.trim();
    saveState();
    renderAll();
  }

  function renderAll() {
    renderBoards(els.boardsTop, state.sectionsTop);
    renderBoards(els.boardsBottom, state.sectionsBottom);
  }

  function renderBoards(containerEl, sectionsArr) {
    containerEl.innerHTML = "";
    containerEl.style.setProperty("--section-count", sectionsArr.length.toString());
    
    sectionsArr.forEach((section, index) => {
      const node = /** @type {HTMLDivElement} */ (els.sectionTemplate.content.firstElementChild.cloneNode(true));
      node.dataset.sectionId = section.id;
      node.dataset.sectionIndex = index.toString();
      const titleEl = node.querySelector(".board-title");
      titleEl.textContent = section.name + " 🦦";
      // Allow double-click to rename section
      titleEl.addEventListener("dblclick", () => renameSection(section.id, sectionsArr));

      // Progressive blue tint per column (greater contrast, still calming)
      const total = Math.max(1, sectionsArr.length);
      const t = total === 1 ? 0 : index / (total - 1); // 0 for first, 1 for last column
      // Keep within blue family with slight hue shift through teal to blue
      const hue = Math.round(195 + t * 10); // 195 -> 205
      // Increase saturation a bit for clarity, and expand lightness/alpha ranges
      const satBg = 55; // background saturation
      const lightBg = Math.round(97 - t * 25); // 97% -> 72% (stronger darkening)
      const alphaBg = (0.20 + t * 0.35).toFixed(2); // 0.20 -> 0.55
      const satBorder = 50;
      const lightBorder = Math.max(35, Math.round(lightBg - 22)); // ensure darker border
      const alphaBorder = (0.40 + t * 0.30).toFixed(2); // 0.40 -> 0.70

      node.style.setProperty("--board-bg", `hsla(${hue}, ${satBg}%, ${lightBg}%, ${alphaBg})`);
      node.style.setProperty("--board-border", `hsla(${hue}, ${satBorder}%, ${lightBorder}%, ${alphaBorder})`);

      node.querySelector(".rename-section").addEventListener("click", () => renameSection(section.id, sectionsArr));
      node.querySelector(".delete-section").addEventListener("click", () => removeSection(section.id, sectionsArr));

      // Column drag and drop handlers
      setupColumnDragDrop(node, section, index, sectionsArr, containerEl);

      const form = node.querySelector(".add-todo");
      const input = node.querySelector(".todo-input");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        section.todos.push(createTodo(text));
        input.value = "";
        saveState();
        renderBoardList(node, section);
        if (els.calendarGrid) renderCalendar();
      });

      renderBoardList(node, section, sectionsArr);
      containerEl.appendChild(node);
    });
  }

  function setupColumnDragDrop(boardEl, section, index, sectionsArr, containerEl) {
    const headerEl = boardEl.querySelector(".board-header");
    const dragHandle = boardEl.querySelector(".board-drag-handle");
    
    // Make header draggable for column reordering
    const startColumnDrag = (e) => {
      // Don't interfere with button clicks or todo item drags
      if (e.target.tagName === "BUTTON" || 
          e.target.closest("button") ||
          e.target.classList.contains("todo-item") || 
          e.target.closest(".todo-item")) {
        return;
      }
      
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify({
        type: "column",
        sectionId: section.id,
        sectionIndex: index
      }));
      boardEl.classList.add("dragging");
      
      // Add visual indicator to other boards
      document.querySelectorAll(".board").forEach(b => {
        if (b !== boardEl) {
          b.style.transition = "transform 0.2s ease";
        }
      });
    };
    
    // Make header and drag handle trigger column drag
    headerEl.addEventListener("dragstart", startColumnDrag);
    if (dragHandle) {
      dragHandle.addEventListener("dragstart", startColumnDrag);
    }
    
    // Also allow dragging the board from its border/empty areas (not from todo items)
    boardEl.addEventListener("dragstart", (e) => {
      // Only allow if dragging from board itself, header, or areas without todo items
      if (e.target === boardEl || 
          e.target === headerEl ||
          e.target.classList.contains("board-header") ||
          (e.target.closest(".board-header") && !e.target.closest("button"))) {
        startColumnDrag(e);
      } else if (e.target.classList.contains("todo-item") || 
                 e.target.closest(".todo-item") ||
                 e.target.closest(".todo-list")) {
        return; // Let todo item drag handle it
      }
    });

    boardEl.addEventListener("dragend", () => {
      boardEl.classList.remove("dragging");
      document.querySelectorAll(".board").forEach(b => {
        b.classList.remove("drag-over-target");
        b.style.transition = "";
      });
      els.boards.classList.remove("drag-over");
    });

    // Make board a drop zone
    boardEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      
      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data && data.type === "column" && data.sectionId !== section.id) {
          e.dataTransfer.dropEffect = "move";
          boardEl.classList.add("drag-over-target");
          containerEl.classList.add("drag-over");
        }
      } catch (err) {
        // Not a column drag
      }
    });

    boardEl.addEventListener("dragleave", () => {
      boardEl.classList.remove("drag-over-target");
      if (!document.querySelector(".drag-over-target")) {
        containerEl.classList.remove("drag-over");
      }
    });

    boardEl.addEventListener("drop", (e) => {
      e.preventDefault();
      boardEl.classList.remove("drag-over-target");
      containerEl.classList.remove("drag-over");
      
      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (!data || data.type !== "column") return;
        
        const sourceIndex = parseInt(data.sectionIndex);
        const targetIndex = index;
        
        if (sourceIndex === targetIndex) return;
        
        // Reorder sections
        const [movedSection] = sectionsArr.splice(sourceIndex, 1);
        sectionsArr.splice(targetIndex, 0, movedSection);
        
        saveState();
        renderAll();
      } catch (err) {
        console.warn("Error handling column drop", err);
      }
    });

    // Also make the boards container a drop zone for edge cases
    containerEl.addEventListener("dragover", (e) => {
      const data = e.dataTransfer.getData("text/plain");
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.type === "column") {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }
        } catch (err) {
          // Not a column drag
        }
      }
    });
  }

  function renderBoardList(boardEl, section, withinSectionsArr) {
    const list = boardEl.querySelector(".todo-list");
    list.innerHTML = "";

    // Sort: incomplete first (by createdAt), then completed (by createdAt)
    const incomplete = section.todos.filter(t => !t.completed).sort((a,b) => a.createdAt - b.createdAt);
    const completed = section.todos.filter(t => t.completed).sort((a,b) => a.createdAt - b.createdAt);
    const ordered = [...incomplete, ...completed];

    ordered.forEach(todo => {
      const item = /** @type {HTMLLIElement} */ (els.todoItemTemplate.content.firstElementChild.cloneNode(true));
      item.dataset.todoId = todo.id;
      item.dataset.sectionId = section.id;
      if (todo.completed) item.classList.add("completed");
      const checkbox = item.querySelector(".todo-check");
      const textSpan = item.querySelector(".todo-text");
      const editBtn = item.querySelector(".edit-todo");
      const deleteBtn = item.querySelector(".delete-todo");
      const moveSelect = item.querySelector(".move-todo-select");

      checkbox.checked = todo.completed;
      textSpan.textContent = todo.text;

      // Populate dropdown with other sections
      moveSelect.innerHTML = '<option value=""></option>';
      withinSectionsArr.forEach(s => {
        if (s.id !== section.id) {
          const option = document.createElement("option");
          option.value = s.id;
          option.textContent = s.name;
          moveSelect.appendChild(option);
        }
      });

      // Handle dropdown move
      moveSelect.addEventListener("change", (e) => {
        const targetSectionId = e.target.value;
        if (!targetSectionId) return;
        const targetSection = withinSectionsArr.find(s => s.id === targetSectionId);
        if (!targetSection) return;
        
        // Remove from current section
        section.todos = section.todos.filter(t => t.id !== todo.id);
        // Add to target section
        targetSection.todos.push(todo);
        
        // Reset dropdown
        moveSelect.value = "";
        saveState();
        renderAll(); // Re-render all boards to update both sections
      });

      // Drag and drop handlers
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify({
          todoId: todo.id,
          sectionId: section.id
        }));
        item.classList.add("dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        document.querySelectorAll(".todo-list").forEach(l => l.classList.remove("drag-over"));
      });

      // Make lists drop zones
      list.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        list.classList.add("drag-over");
      });

      list.addEventListener("dragleave", () => {
        list.classList.remove("drag-over");
      });

      list.addEventListener("drop", (e) => {
        e.preventDefault();
        list.classList.remove("drag-over");
        
        try {
          const data = JSON.parse(e.dataTransfer.getData("text/plain"));
          if (!data.todoId || !data.sectionId) return;
          
          const sourceSection = withinSectionsArr.find(s => s.id === data.sectionId);
          if (!sourceSection) return;
          
          const draggedTodo = sourceSection.todos.find(t => t.id === data.todoId);
          if (!draggedTodo) return;
          
          // If dropping in same section, do nothing
          if (data.sectionId === section.id) return;
          
          // Remove from source section
          sourceSection.todos = sourceSection.todos.filter(t => t.id !== data.todoId);
          // Add to target section (this section)
          if (!section.todos.find(t => t.id === data.todoId)) {
            section.todos.push(draggedTodo);
          }
          
          saveState();
          renderAll();
        } catch (err) {
          console.warn("Error handling drop", err);
        }
      });

      checkbox.addEventListener("change", () => {
        todo.completed = checkbox.checked;
        // Move to bottom if completed, or reposition among incompletes
        saveState();
        renderBoardList(boardEl, section);
      });

      editBtn.addEventListener("click", () => {
        const isEditing = textSpan.getAttribute("contenteditable") === "true";
        if (!isEditing) {
          textSpan.setAttribute("contenteditable", "true");
          textSpan.focus();
          editBtn.textContent = "Save";
        } else {
          textSpan.setAttribute("contenteditable", "false");
          todo.text = formatTodoText(textSpan.textContent);
          saveState();
          editBtn.textContent = "Edit";
          renderBoardList(boardEl, section);
          if (els.calendarGrid) renderCalendar();
        }
      });

      textSpan.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          textSpan.blur();
        }
      });
      textSpan.addEventListener("blur", () => {
        if (textSpan.getAttribute("contenteditable") === "true") {
          textSpan.setAttribute("contenteditable", "false");
          todo.text = formatTodoText(textSpan.textContent);
          saveState();
          editBtn.textContent = "Edit";
          renderBoardList(boardEl, section);
          if (els.calendarGrid) renderCalendar();
        }
      });

      deleteBtn.addEventListener("click", () => {
        const ok = confirm("Delete this task?");
        if (!ok) return;
        section.todos = section.todos.filter(t => t.id !== todo.id);
        saveState();
        renderBoardList(boardEl, section);
      });

      list.appendChild(item);
    });
  }

  // Calendar functions
  function extractDatesFromTodos() {
    const dates = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    [...state.sectionsTop, ...state.sectionsBottom].forEach(section => {
      section.todos.forEach(todo => {
        const text = todo.text.toLowerCase();
        
        // Parse various date formats
        // Today, Tomorrow
        if (text.includes('today')) {
          dates.add(today.getTime());
        }
        if (text.includes('tomorrow')) {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          dates.add(tomorrow.getTime());
        }
        
        // Month Day patterns: "Dec 15", "December 15", "12/15", "12-15", "Dec 15th"
        const monthDayPattern = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?/gi;
        let match;
        while ((match = monthDayPattern.exec(text)) !== null) {
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
          const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const monthStr = match[1].toLowerCase();
          const day = parseInt(match[2]);
          
          let monthIndex = monthNames.indexOf(monthStr);
          if (monthIndex === -1) {
            monthIndex = monthAbbr.indexOf(monthStr);
          }
          
          if (monthIndex !== -1 && day >= 1 && day <= 31) {
            const year = currentCalendarDate.getFullYear();
            const date = new Date(year, monthIndex, day);
            date.setHours(0, 0, 0, 0);
            dates.add(date.getTime());
            
            // Also check next year in case it's a past date
            const dateNextYear = new Date(year + 1, monthIndex, day);
            dateNextYear.setHours(0, 0, 0, 0);
            dates.add(dateNextYear.getTime());
          }
        }
        
        // Numeric patterns: "12/15", "12-15", "1/5", etc.
        const numericPattern = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/g;
        while ((match = numericPattern.exec(text)) !== null) {
          let month = parseInt(match[1]);
          let day = parseInt(match[2]);
          let year = match[3] ? parseInt(match[3]) : currentCalendarDate.getFullYear();
          
          if (match[3] && match[3].length === 2) {
            year = 2000 + parseInt(match[3]);
          }
          
          // Handle both M/D and D/M formats - assume M/D if month > 12
          if (month > 12 && day <= 12) {
            [month, day] = [day, month];
          }
          
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);
            dates.add(date.getTime());
          }
        }
        
        // Day of week: "Monday", "Tuesday", etc. - find next occurrence
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayNames.forEach((dayName, index) => {
          if (text.includes(dayName) || text.includes(dayName.substring(0, 3))) {
            const targetDay = index;
            const currentDay = today.getDay();
            let daysUntil = (targetDay - currentDay + 7) % 7;
            if (daysUntil === 0) daysUntil = 7; // Next week if same day
            
            const nextDate = new Date(today);
            nextDate.setDate(nextDate.getDate() + daysUntil);
            nextDate.setHours(0, 0, 0, 0);
            dates.add(nextDate.getTime());
          }
        });
      });
    });
    
    return dates;
  }

  function initCalendar() {
    els.prevMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      renderCalendar();
    });
    
    els.nextMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      renderCalendar();
    });
    
    renderCalendar();
  }

  function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    els.calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get dates from todos
    const todoDates = extractDatesFromTodos();
    
    // Clear grid
    els.calendarGrid.innerHTML = '';
    
    // Day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(day => {
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = day;
      els.calendarGrid.appendChild(header);
    });
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      els.calendarGrid.appendChild(emptyDay);
    }
    
    // Days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const dateTime = date.getTime();
      
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;
      
      if (dateTime === today.getTime()) {
        dayEl.classList.add('today');
      }
      
      if (todoDates.has(dateTime)) {
        dayEl.classList.add('has-date');
      }
      
      els.calendarGrid.appendChild(dayEl);
    }
    
    // Empty cells for days after month ends
    const totalCells = 7 * 6; // 7 days * 6 rows max
    const usedCells = dayHeaders.length + startingDayOfWeek + daysInMonth;
    for (let i = usedCells; i < totalCells; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      els.calendarGrid.appendChild(emptyDay);
    }
  }

  // Hook calendar updates into render cycle
  const originalRenderAll = renderAll;
  renderAll = function() {
    originalRenderAll();
    if (els.calendarGrid) {
      renderCalendar();
    }
  };
})();


