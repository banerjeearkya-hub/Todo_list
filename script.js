// Enhanced Todo List Application with Multi-Select and Restore
class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.trash = this.loadTrash();
        this.selectedIds = new Set();
        
        // DOM elements
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.controlsSection = document.getElementById('controlsSection');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        this.selectedCountSpan = document.getElementById('selectedCount');
        this.trashSection = document.getElementById('trashSection');
        this.trashList = document.getElementById('trashList');
        this.trashCountSpan = document.getElementById('trashCount');
        this.clearTrashBtn = document.getElementById('clearTrashBtn');
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
        
        this.selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
        this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelected());
        this.clearTrashBtn.addEventListener('click', () => this.clearTrash());
        
        // Render initial state
        this.render();
    }
    
    addTodo() {
        const text = this.todoInput.value.trim();
        
        if (text === '') {
            // Shake animation for empty input
            this.todoInput.style.animation = 'shake 0.4s';
            setTimeout(() => {
                this.todoInput.style.animation = '';
            }, 400);
            return;
        }
        
        const todo = {
            id: Date.now(),
            text: text,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(todo);
        this.saveTodos();
        this.todoInput.value = '';
        this.render();
        
        // Focus back on input
        this.todoInput.focus();
    }
    
    toggleSelection(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this.updateSelectionUI();
    }
    
    toggleSelectAll() {
        if (this.selectedIds.size === this.todos.length && this.todos.length > 0) {
            // Deselect all
            this.selectedIds.clear();
            this.selectAllBtn.textContent = 'Select All';
        } else {
            // Select all
            this.selectedIds.clear();
            this.todos.forEach(todo => this.selectedIds.add(todo.id));
            this.selectAllBtn.textContent = 'Deselect All';
        }
        this.updateSelectionUI();
    }
    
    updateSelectionUI() {
        // Update selected count
        this.selectedCountSpan.textContent = this.selectedIds.size;
        
        // Enable/disable delete button
        this.deleteSelectedBtn.disabled = this.selectedIds.size === 0;
        
        // Update select all button text
        if (this.selectedIds.size === this.todos.length && this.todos.length > 0) {
            this.selectAllBtn.textContent = 'Deselect All';
        } else {
            this.selectAllBtn.textContent = 'Select All';
        }
        
        // Update todo item selection states
        document.querySelectorAll('.todo-item').forEach(item => {
            const id = parseInt(item.getAttribute('data-id'));
            const checkbox = item.querySelector('.todo-checkbox');
            
            if (this.selectedIds.has(id)) {
                item.classList.add('selected');
                if (checkbox) checkbox.checked = true;
            } else {
                item.classList.remove('selected');
                if (checkbox) checkbox.checked = false;
            }
        });
    }
    
    deleteSelected() {
        if (this.selectedIds.size === 0) return;
        
        // Move selected todos to trash
        const selectedTodos = this.todos.filter(todo => this.selectedIds.has(todo.id));
        selectedTodos.forEach(todo => {
            todo.deletedAt = new Date().toISOString();
            this.trash.push(todo);
        });
        
        // Remove from active todos
        this.todos = this.todos.filter(todo => !this.selectedIds.has(todo.id));
        
        // Clear selection
        this.selectedIds.clear();
        
        // Save and render
        this.saveTodos();
        this.saveTrash();
        this.render();
    }
    
    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        const todoElement = document.querySelector(`.todo-item[data-id="${id}"]`);
        
        // Add deletion animation
        if (todoElement) {
            todoElement.classList.add('deleting');
            setTimeout(() => {
                // Move to trash
                todo.deletedAt = new Date().toISOString();
                this.trash.push(todo);
                
                // Remove from active todos
                this.todos = this.todos.filter(t => t.id !== id);
                
                // Remove from selection if selected
                this.selectedIds.delete(id);
                
                this.saveTodos();
                this.saveTrash();
                this.render();
            }, 300);
        }
    }
    
    restoreTodo(id) {
        const trashItem = this.trash.find(t => t.id === id);
        if (!trashItem) return;
        
        const trashElement = document.querySelector(`.trash-item[data-id="${id}"]`);
        
        // Add animation
        if (trashElement) {
            trashElement.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                // Remove deletedAt property
                delete trashItem.deletedAt;
                
                // Move back to active todos
                this.todos.push(trashItem);
                
                // Remove from trash
                this.trash = this.trash.filter(t => t.id !== id);
                
                this.saveTodos();
                this.saveTrash();
                this.render();
            }, 300);
        }
    }
    
    clearTrash() {
        if (this.trash.length === 0) return;
        
        // Clear trash immediately (user can restore from regular delete if needed)
        this.trash = [];
        this.saveTrash();
        this.render();
    }
    
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    loadTodos() {
        const stored = localStorage.getItem('todos');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveTrash() {
        localStorage.setItem('trash', JSON.stringify(this.trash));
    }
    
    loadTrash() {
        const stored = localStorage.getItem('trash');
        return stored ? JSON.parse(stored) : [];
    }
    
    render() {
        this.renderTodos();
        this.renderTrash();
        this.updateSelectionUI();
    }
    
    renderTodos() {
        this.todoList.innerHTML = '';
        
        // Show/hide controls section
        if (this.todos.length === 0) {
            this.controlsSection.style.display = 'none';
            this.todoList.innerHTML = `
                <div class="empty-state">
                    No tasks yet. Add one above to get started!
                </div>
            `;
            return;
        }
        
        this.controlsSection.style.display = 'flex';
        
        // Render todos in reverse order (newest first)
        [...this.todos].reverse().forEach(todo => {
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            todoItem.setAttribute('data-id', todo.id);
            
            if (this.selectedIds.has(todo.id)) {
                todoItem.classList.add('selected');
            }
            
            todoItem.innerHTML = `
                <div class="todo-checkbox-container">
                    <input 
                        type="checkbox" 
                        class="todo-checkbox" 
                        ${this.selectedIds.has(todo.id) ? 'checked' : ''}
                        aria-label="Select todo"
                    >
                </div>
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <button class="delete-btn" aria-label="Delete todo"></button>
            `;
            
            // Add event listeners
            const checkbox = todoItem.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleSelection(todo.id);
            });
            
            const deleteBtn = todoItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
            
            this.todoList.appendChild(todoItem);
        });
    }
    
    renderTrash() {
        this.trashList.innerHTML = '';
        this.trashCountSpan.textContent = this.trash.length;
        
        if (this.trash.length === 0) {
            this.trashSection.style.display = 'none';
            return;
        }
        
        this.trashSection.style.display = 'block';
        
        // Render trash items in reverse order (newest first)
        [...this.trash].reverse().forEach(item => {
            const trashItem = document.createElement('div');
            trashItem.className = 'trash-item';
            trashItem.setAttribute('data-id', item.id);
            
            trashItem.innerHTML = `
                <span class="trash-text">${this.escapeHtml(item.text)}</span>
                <button class="restore-btn" aria-label="Restore todo">Restore</button>
            `;
            
            // Add restore event listener
            const restoreBtn = trashItem.querySelector('.restore-btn');
            restoreBtn.addEventListener('click', () => this.restoreTodo(item.id));
            
            this.trashList.appendChild(trashItem);
        });
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
