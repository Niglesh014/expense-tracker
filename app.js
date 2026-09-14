// GitHub Actions test
/**
 * ============================================================================
 * Expense Tracker Application
 * Handles State Management, CRUD Operations, Search, Filter,
 * Budget Calculations, and LocalStorage Persistence.
 * ============================================================================
 */

(function () {
  'use strict';

  // Category Icon Map
  const CATEGORY_META = {
    Food: { icon: '🍔', label: 'Food' },
    Travel: { icon: '🚗', label: 'Travel' },
    Shopping: { icon: '🛍️', label: 'Shopping' },
    Education: { icon: '📚', label: 'Education' },
    Entertainment: { icon: '🎬', label: 'Entertainment' },
    Bills: { icon: '💡', label: 'Bills' },
    Other: { icon: '📦', label: 'Other' },
  };

  // State
  let expenses = [];
  let monthlyBudget = 0;
  let searchTerm = '';
  let selectedCategory = 'All';

  // DOM Elements
  const expenseForm = document.getElementById('expense-form');
  const expenseNameInput = document.getElementById('expense-name');
  const expenseAmountInput = document.getElementById('expense-amount');
  const expenseCategorySelect = document.getElementById('expense-category');
  const expenseDateInput = document.getElementById('expense-date');

  const budgetForm = document.getElementById('budget-form');
  const budgetInput = document.getElementById('budget-input');
  const displayBudget = document.getElementById('display-budget');
  const displayBudgetSpent = document.getElementById('display-budget-spent');
  const displayBudgetRemaining = document.getElementById('display-budget-remaining');
  const budgetProgressFill = document.getElementById('budget-progress-fill');
  const budgetProgressText = document.getElementById('budget-progress-text');
  const budgetStatusBadge = document.getElementById('budget-status-badge');

  const totalSpentEl = document.getElementById('total-spent');
  const expenseCountEl = document.getElementById('expense-count');
  const highestExpenseEl = document.getElementById('highest-expense');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const categoryFilterSelect = document.getElementById('category-filter');
  const activeFilterIndicator = document.getElementById('active-filter-indicator');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  const expenseTable = document.getElementById('expense-table');
  const expenseTableBody = document.getElementById('expense-table-body');
  const emptyStateEl = document.getElementById('empty-state');
  const emptyDescEl = document.getElementById('empty-desc');
  const filteredCountText = document.getElementById('filtered-count-text');
  const filteredTotalText = document.getElementById('filtered-total-text');

  const loadSampleBtn = document.getElementById('load-sample-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const toastContainer = document.getElementById('toast-container');

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Format number to Indian Rupee currency format (e.g. ₹ 3,500)
   */
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return '₹ ' + num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    });
  }

  /**
   * Format date from YYYY-MM-DD to DD-MM-YYYY
   */
  function formatDate(isoDateStr) {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDateStr;
  }

  /**
   * Get today's date formatted as YYYY-MM-DD for date picker default
   */
  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Display toast notification
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '🗑️';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // ==========================================================================
  // LocalStorage Persistence (Level 5)
  // ==========================================================================

  const STORAGE_KEYS = {
    EXPENSES: 'expense_tracker_items_v1',
    BUDGET: 'expense_tracker_budget_v1',
  };

  function loadState() {
    try {
      const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (storedExpenses) {
        expenses = JSON.parse(storedExpenses);
      } else {
        expenses = [];
      }

      const storedBudget = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (storedBudget) {
        monthlyBudget = parseFloat(storedBudget) || 0;
      } else {
        monthlyBudget = 0;
      }
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
      expenses = [];
      monthlyBudget = 0;
    }
  }

  function saveExpenses() {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to save expenses to localStorage:', e);
    }
  }

  function saveBudget() {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, monthlyBudget.toString());
    } catch (e) {
      console.error('Failed to save budget to localStorage:', e);
    }
  }

  // ==========================================================================
  // Calculation & Rendering Logic
  // ==========================================================================

  function getFilteredExpenses() {
    return expenses.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  function render() {
    // 1. Calculate overall summary statistics
    const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const count = expenses.length;
    const highest = expenses.length > 0 ? Math.max(...expenses.map((e) => Number(e.amount))) : 0;

    totalSpentEl.textContent = formatCurrency(totalSpent);
    expenseCountEl.textContent = count.toString();
    highestExpenseEl.textContent = formatCurrency(highest);

    // 2. Render Budget Section (Feature 4)
    displayBudget.textContent = formatCurrency(monthlyBudget);
    displayBudgetSpent.textContent = formatCurrency(totalSpent);
    
    const remaining = monthlyBudget - totalSpent;
    displayBudgetRemaining.textContent = formatCurrency(remaining);
    
    if (remaining < 0) {
      displayBudgetRemaining.className = 'metric-value text-danger';
    } else {
      displayBudgetRemaining.className = 'metric-value text-success';
    }

    if (monthlyBudget > 0) {
      const percentage = Math.round((totalSpent / monthlyBudget) * 100);
      const cappedFill = Math.min(percentage, 100);
      budgetProgressFill.style.width = `${cappedFill}%`;

      budgetProgressFill.className = 'progress-bar-fill';
      budgetStatusBadge.className = 'badge';

      if (percentage > 100) {
        budgetProgressFill.classList.add('danger');
        budgetStatusBadge.classList.add('badge-danger');
        budgetStatusBadge.textContent = 'Exceeded Budget';
        budgetProgressText.textContent = `${percentage}% used (${formatCurrency(Math.abs(remaining))} over limit)`;
      } else if (percentage >= 80) {
        budgetProgressFill.classList.add('warning');
        budgetStatusBadge.classList.add('badge-warning');
        budgetStatusBadge.textContent = 'Near Limit';
        budgetProgressText.textContent = `${percentage}% of budget used`;
      } else {
        budgetStatusBadge.classList.add('badge-safe');
        budgetStatusBadge.textContent = 'On Track';
        budgetProgressText.textContent = `${percentage}% of budget used`;
      }
    } else {
      budgetProgressFill.style.width = '0%';
      budgetProgressFill.className = 'progress-bar-fill';
      budgetStatusBadge.className = 'badge badge-safe';
      budgetStatusBadge.textContent = 'No Budget Set';
      budgetProgressText.textContent = 'Enter a monthly budget above to track limits';
    }

    // 3. Render Filtered Table (Features 1, 2, 3)
    const filteredList = getFilteredExpenses();
    const isFilterActive = searchTerm.trim() !== '' || selectedCategory !== 'All';

    // Show/hide active filter bar
    if (isFilterActive && expenses.length > 0) {
      activeFilterIndicator.style.display = 'flex';
    } else {
      activeFilterIndicator.style.display = 'none';
    }

    // Clear existing rows
    expenseTableBody.innerHTML = '';

    if (filteredList.length === 0) {
      expenseTable.style.display = 'none';
      emptyStateEl.style.display = 'flex';

      if (expenses.length === 0) {
        emptyDescEl.textContent = "You haven't recorded any expenses yet. Fill the form on the left to add your first expense!";
      } else {
        emptyDescEl.textContent = `No expenses match your search "${searchTerm}" in category "${selectedCategory}".`;
      }
    } else {
      expenseTable.style.display = 'table';
      emptyStateEl.style.display = 'none';

      // Inject rows
      filteredList.forEach((item) => {
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;

        const catInfo = CATEGORY_META[item.category] || { icon: '🏷️', label: item.category };

        tr.innerHTML = `
          <td>${formatDate(item.date)}</td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td>
            <span class="category-badge cat-${item.category}">
              <span>${catInfo.icon}</span>
              <span>${item.category}</span>
            </span>
          </td>
          <td class="text-right expense-amount-cell">${formatCurrency(item.amount)}</td>
          <td class="text-center">
            <button 
              type="button" 
              class="btn-delete" 
              data-id="${item.id}" 
              title="Delete this expense"
              aria-label="Delete ${escapeHtml(item.name)}"
            >
              🗑️ Delete
            </button>
          </td>
        `;

        expenseTableBody.appendChild(tr);
      });
    }

    // Update table footer summary
    const filteredSum = filteredList.reduce((sum, item) => sum + Number(item.amount), 0);
    filteredCountText.textContent = `Showing ${filteredList.length} of ${expenses.length} expenses`;
    filteredTotalText.textContent = `Filtered Total: ${formatCurrency(filteredSum)}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  // Add Expense
  expenseForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const category = expenseCategorySelect.value;
    const date = expenseDateInput.value;

    if (!name) {
      showToast('Please enter an expense name', 'danger');
      expenseNameInput.focus();
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid positive amount', 'danger');
      expenseAmountInput.focus();
      return;
    }

    if (!category) {
      showToast('Please select a category', 'danger');
      expenseCategorySelect.focus();
      return;
    }

    if (!date) {
      showToast('Please select a date', 'danger');
      expenseDateInput.focus();
      return;
    }

    const newExpense = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name,
      amount,
      category,
      date,
    };

    // Prepend to show newest first
    expenses.unshift(newExpense);
    saveExpenses();

    // Reset Form
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    expenseCategorySelect.selectedIndex = 0;
    expenseDateInput.value = getTodayDateString();
    expenseNameInput.focus();

    showToast(`Added "${newExpense.name}" (${formatCurrency(newExpense.amount)})`, 'success');
    render();
  });

  // Delete Expense (Feature 1)
  expenseTableBody.addEventListener('click', function (e) {
    const deleteBtn = e.target.closest('.btn-delete');
    if (!deleteBtn) return;

    const id = deleteBtn.dataset.id;
    const itemToDelete = expenses.find((exp) => exp.id === id);

    if (itemToDelete) {
      expenses = expenses.filter((exp) => exp.id !== id);
      saveExpenses();
      showToast(`Deleted "${itemToDelete.name}"`, 'danger');
      render();
    }
  });

  // Save Budget (Feature 4)
  budgetForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const value = parseFloat(budgetInput.value);

    if (isNaN(value) || value < 0) {
      showToast('Please enter a valid budget amount', 'danger');
      return;
    }

    monthlyBudget = value;
    saveBudget();
    budgetInput.value = '';
    showToast(`Monthly budget set to ${formatCurrency(monthlyBudget)}`, 'success');
    render();
  });

  // Search by Name (Feature 2)
  searchInput.addEventListener('input', function (e) {
    searchTerm = e.target.value;
    clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
    render();
  });

  clearSearchBtn.addEventListener('click', function () {
    searchInput.value = '';
    searchTerm = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    render();
  });

  // Filter by Category (Feature 3)
  categoryFilterSelect.addEventListener('change', function (e) {
    selectedCategory = e.target.value;
    render();
  });

  // Reset all filters
  resetFiltersBtn.addEventListener('click', function () {
    searchInput.value = '';
    searchTerm = '';
    clearSearchBtn.style.display = 'none';
    categoryFilterSelect.value = 'All';
    selectedCategory = 'All';
    render();
  });

  // Load Sample Data
  loadSampleBtn.addEventListener('click', function () {
    const sampleExpenses = [
      { id: '1', name: 'Pizza', amount: 350, category: 'Food', date: '2026-08-28' },
      { id: '2', name: 'Bus', amount: 50, category: 'Travel', date: '2026-08-28' },
      { id: '3', name: 'Book', amount: 500, category: 'Education', date: '2026-08-27' },
      { id: '4', name: 'Grocery Shopping', amount: 1200, category: 'Food', date: '2026-08-26' },
      { id: '5', name: 'Electricity Bill', amount: 850, category: 'Bills', date: '2026-08-25' },
      { id: '6', name: 'Movie Night', amount: 450, category: 'Entertainment', date: '2026-08-24' },
      { id: '7', name: 'New Shirt', amount: 600, category: 'Shopping', date: '2026-08-23' },
    ];

    expenses = sampleExpenses;
    monthlyBudget = 10000;
    saveExpenses();
    saveBudget();
    showToast('Loaded sample expenses and budget!', 'success');
    render();
  });

  // Clear All
  clearAllBtn.addEventListener('click', function () {
    if (expenses.length === 0 && monthlyBudget === 0) {
      showToast('No data to clear', 'info');
      return;
    }

    const confirmClear = window.confirm('Are you sure you want to clear all expenses and reset the budget?');
    if (confirmClear) {
      expenses = [];
      monthlyBudget = 0;
      saveExpenses();
      saveBudget();
      showToast('All expenses and budget cleared', 'danger');
      render();
    }
  });

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    // Set default date picker to today
    expenseDateInput.value = getTodayDateString();

    // Load data from LocalStorage
    loadState();

    // If initial run and empty, provide a clean experience (empty state is ready)
    render();
  }

  // Run on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
// GitHub Actions automatic test