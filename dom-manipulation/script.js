// Default quotes
const defaultQuotes = [
  {
    text: "The only way to do great work is to love what you do.",
    category: "Motivation",
    id: 1,
    timestamp: Date.now(),
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    category: "Leadership",
    id: 2,
    timestamp: Date.now(),
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    category: "Life",
    id: 3,
    timestamp: Date.now(),
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    category: "Inspiration",
    id: 4,
    timestamp: Date.now(),
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    category: "Motivation",
    id: 5,
    timestamp: Date.now(),
  },
];

// Global variables
let quotes = [];
let currentFilter = "all";
let filteredQuotes = [];
let autoSyncEnabled = true;
let syncInterval = null;
let lastSyncTime = null;
let nextQuoteId = 100;

// Mock server URL (using JSONPlaceholder)
const SERVER_API = "https://jsonplaceholder.typicode.com/posts";

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilterSelect = document.getElementById("categoryFilter");
const filterInfo = document.getElementById("filterInfo");
const syncStatus = document.getElementById("syncStatus");
const syncIndicator = document.getElementById("syncIndicator");
const syncText = document.getElementById("syncText");
const syncTime = document.getElementById("syncTime");

// ==================== LOCAL STORAGE ====================

function saveQuotes() {
  try {
    localStorage.setItem("quotes", JSON.stringify(quotes));
    localStorage.setItem("lastSyncTime", lastSyncTime);
  } catch (error) {
    console.error("Error saving quotes:", error);
  }
}

function loadQuotes() {
  try {
    const stored = localStorage.getItem("quotes");
    quotes = stored ? JSON.parse(stored) : [...defaultQuotes];
    if (!stored) saveQuotes();

    lastSyncTime = localStorage.getItem("lastSyncTime");
    updateSyncTime();
  } catch (error) {
    console.error("Error loading quotes:", error);
    quotes = [...defaultQuotes];
  }
}

function saveLastFilter(category) {
  localStorage.setItem("lastFilter", category);
}

function loadLastFilter() {
  return localStorage.getItem("lastFilter") || "all";
}

// ==================== SERVER SYNC ====================

/**
 * Fetch quotes from server (simulated)
 */
async function fetchFromServer() {
  try {
    updateSyncStatus("syncing", "Syncing with server...");

    // Simulate fetching from server using JSONPlaceholder
    const response = await fetch(SERVER_API + "?_limit=5");
    const serverData = await response.json();

    // Transform server data to quote format
    const serverQuotes = serverData.map((post) => ({
      id: post.id + 1000, // Offset to avoid ID conflicts
      text: post.title,
      category: "Server",
      timestamp: Date.now() - Math.random() * 1000000,
      source: "server",
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching from server:", error);
    updateSyncStatus("error", "Sync failed");
    throw error;
  }
}

/**
 * Post quotes to server (simulated)
 */
async function postToServer(quote) {
  try {
    const response = await fetch(SERVER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: quote.text,
        body: quote.category,
        userId: 1,
      }),
    });

    const data = await response.json();
    console.log("Posted to server:", data);
    return true;
  } catch (error) {
    console.error("Error posting to server:", error);
    return false;
  }
}

/**
 * Detect conflicts between local and server data
 */
function detectConflicts(serverQuotes) {
  const conflicts = [];

  serverQuotes.forEach((serverQuote) => {
    const localQuote = quotes.find((q) => q.id === serverQuote.id);

    if (localQuote) {
      // Check if there are differences
      if (
        localQuote.text !== serverQuote.text ||
        localQuote.category !== serverQuote.category
      ) {
        // Determine which is newer
        const localTime = localQuote.timestamp || 0;
        const serverTime = serverQuote.timestamp || 0;

        conflicts.push({
          local: localQuote,
          server: serverQuote,
          newerSource: serverTime > localTime ? "server" : "local",
        });
      }
    }
  });

  return conflicts;
}

/**
 * Merge server data with local data
 */
function mergeData(serverQuotes, resolveConflicts = true) {
  const conflicts = detectConflicts(serverQuotes);

  if (conflicts.length > 0 && !resolveConflicts) {
    // Show conflict notification
    showConflictNotification(conflicts);
    return false;
  }

  // Add new quotes from server that don't exist locally
  serverQuotes.forEach((serverQuote) => {
    const exists = quotes.find((q) => q.id === serverQuote.id);
    if (!exists) {
      quotes.push(serverQuote);
    }
  });

  // Resolve conflicts (server takes precedence)
  conflicts.forEach((conflict) => {
    const index = quotes.findIndex((q) => q.id === conflict.server.id);
    if (index !== -1) {
      quotes[index] = conflict.server;
    }
  });

  return true;
}

/**
 * Perform sync with server
 */
async function syncWithServer() {
  if (!autoSyncEnabled) return;

  try {
    // Fetch from server
    const serverQuotes = await fetchFromServer();

    // Check for conflicts
    const conflicts = detectConflicts(serverQuotes);

    if (conflicts.length > 0) {
      // Show conflict notification
      showConflictNotification(conflicts);
      updateSyncStatus("conflict", `${conflicts.length} conflict(s) detected`);
    } else {
      // Merge data
      mergeData(serverQuotes, true);
      saveQuotes();

      // Update UI
      populateCategories();
      filterQuotes();
      updateStats();

      lastSyncTime = Date.now();
      localStorage.setItem("lastSyncTime", lastSyncTime);
      updateSyncTime();

      updateSyncStatus("success", "Synced successfully");

      // Show success notification
      showNotification(
        "success",
        "Sync Complete",
        `Successfully synced with server. ${serverQuotes.length} quotes checked.`
      );
    }

    document.getElementById("serverQuotes").textContent = serverQuotes.length;
  } catch (error) {
    updateSyncStatus("error", "Sync failed");
    showNotification(
      "error",
      "Sync Failed",
      "Failed to connect to server. Will retry automatically."
    );
  }
}

/**
 * Manual sync triggered by user
 */
async function manualSync() {
  const btn = document.getElementById("manualSyncBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Syncing...";

  await syncWithServer();

  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "🔄 Sync Now";
  }, 1000);
}

/**
 * Toggle auto-sync on/off
 */
function toggleAutoSync() {
  autoSyncEnabled = !autoSyncEnabled;
  const btn = document.getElementById("autoSyncBtn");

  if (autoSyncEnabled) {
    btn.textContent = "⏸ Pause Auto-Sync";
    startAutoSync();
    showNotification(
      "success",
      "Auto-Sync Enabled",
      "Quotes will sync automatically every 30 seconds."
    );
  } else {
    btn.textContent = "▶ Resume Auto-Sync";
    stopAutoSync();
    showNotification(
      "warning",
      "Auto-Sync Paused",
      "Auto-sync has been paused. Click to resume."
    );
  }
}

/**
 * Start automatic syncing
 */
function startAutoSync() {
  if (syncInterval) clearInterval(syncInterval);

  // Sync every 30 seconds
  syncInterval = setInterval(() => {
    syncWithServer();
  }, 30000);
}

/**
 * Stop automatic syncing
 */
function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// ==================== UI UPDATES ====================

/**
 * Update sync status display
 */
function updateSyncStatus(status, message) {
  syncStatus.className = "sync-status " + status;
  syncIndicator.className = "sync-indicator " + status;
  syncText.textContent = message;
}

/**
 * Update last sync time display
 */
function updateSyncTime() {
  if (!lastSyncTime) {
    syncTime.textContent = "Last synced: Never";
    return;
  }

  const now = Date.now();
  const diff = now - lastSyncTime;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 60) {
    syncTime.textContent = "Last synced: >1 hour ago";
  } else if (minutes > 0) {
    syncTime.textContent = `Last synced: ${minutes} min ago`;
  } else {
    syncTime.textContent = `Last synced: ${seconds} sec ago`;
  }
}

// Update sync time every 5 seconds
setInterval(updateSyncTime, 5000);

// ==================== NOTIFICATIONS ====================

/**
 * Show notification to user
 */
function showNotification(type, title, message, actions = null) {
  const container = document.getElementById("notificationContainer");

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">${title}</div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="notification-body">${message}</div>
        ${actions ? `<div class="notification-actions">${actions}</div>` : ""}
    `;

  container.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

/**
 * Show conflict resolution notification
 */
function showConflictNotification(conflicts) {
  const message = `Found ${conflicts.length} conflict(s) between local and server data. Server version is newer and will be used.`;

  const actions = `
        <button class="btn-notification btn-accept" onclick="resolveConflicts(true)">✓ Accept Server Version</button>
        <button class="btn-notification btn-reject" onclick="resolveConflicts(false)">✗ Keep Local Version</button>
        <button class="btn-notification btn-view" onclick="viewConflicts()">👁 View Details</button>
    `;

  showNotification("conflict", "Sync Conflict Detected", message, actions);

  // Store conflicts for later reference
  window.currentConflicts = conflicts;
}

/**
 * Resolve conflicts
 */
function resolveConflicts(acceptServer) {
  const conflicts = window.currentConflicts;
  if (!conflicts) return;

  conflicts.forEach((conflict) => {
    const index = quotes.findIndex((q) => q.id === conflict.local.id);
    if (index !== -1) {
      quotes[index] = acceptServer ? conflict.server : conflict.local;
    }
  });

  saveQuotes();
  populateCategories();
  filterQuotes();
  updateStats();

  const msg = acceptServer
    ? "Server versions accepted. Your local data has been updated."
    : "Local versions kept. Server changes were ignored.";

  showNotification("success", "Conflicts Resolved", msg);
  updateSyncStatus("success", "Conflicts resolved");

  // Clear notification
  document.getElementById("notificationContainer").innerHTML = "";
  window.currentConflicts = null;
}

/**
 * View conflict details
 */
function viewConflicts() {
  const conflicts = window.currentConflicts;
  if (!conflicts) return;

  let details = '<div style="max-height: 300px; overflow-y: auto;">';
  conflicts.forEach((conflict, index) => {
    details += `
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <strong>Conflict ${index + 1}:</strong><br>
                <div style="margin: 5px 0;">
                    <em>Local:</em> "${conflict.local.text}" (${
      conflict.local.category
    })
                </div>
                <div style="margin: 5px 0;">
                    <em>Server:</em> "${conflict.server.text}" (${
      conflict.server.category
    })
                </div>
            </div>
        `;
  });
  details += "</div>";

  showNotification("warning", "Conflict Details", details);
}

// ==================== SESSION STORAGE ====================

function incrementSessionViews() {
  let views = parseInt(sessionStorage.getItem("quotesViewed") || "0") + 1;
  sessionStorage.setItem("quotesViewed", views.toString());
  document.getElementById("sessionViews").textContent = views;
}

function saveLastViewedQuote(quote) {
  try {
    sessionStorage.setItem("lastQuote", JSON.stringify(quote));
  } catch (error) {
    console.error("Error saving to session storage:", error);
  }
}

// ==================== CATEGORIES ====================

function getUniqueCategories() {
  const categories = quotes.map((quote) => quote.category);
  return [...new Set(categories)].sort();
}

function populateCategories() {
  categoryFilterSelect.innerHTML =
    '<option value="all">All Categories</option>';
  const categories = getUniqueCategories();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.toLowerCase();
    option.textContent = category;
    categoryFilterSelect.appendChild(option);
  });

  categoryFilterSelect.value = currentFilter;
}

// ==================== FILTERING ====================

function filterQuotes() {
  currentFilter = categoryFilterSelect.value;
  saveLastFilter(currentFilter);

  if (currentFilter === "all") {
    filteredQuotes = [...quotes];
  } else {
    filteredQuotes = quotes.filter(
      (quote) => quote.category.toLowerCase() === currentFilter
    );
  }

  updateFilterInfo();
  updateStats();
}

function updateFilterInfo() {
  const categoryName = currentFilter === "all" ? "all quotes" : currentFilter;
  filterInfo.textContent = `Showing ${
    filteredQuotes.length
  } ${categoryName} quote${filteredQuotes.length !== 1 ? "s" : ""}`;
}

// ==================== DISPLAY ====================

function showRandomQuote() {
  quoteDisplay.innerHTML = "";

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML =
      '<p class="empty-quote">No quotes available. Try adding one!</p>';
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = `
        <p class="quote-text">${quote.text}</p>
        <span class="quote-category">${quote.category}</span>
    `;

  saveLastViewedQuote(quote);
  incrementSessionViews();

  quoteDisplay.style.opacity = "0";
  setTimeout(() => {
    quoteDisplay.style.transition = "opacity 0.5s ease";
    quoteDisplay.style.opacity = "1";
  }, 10);
}

function showAllQuotes() {
  quoteDisplay.innerHTML = "";

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = '<p class="empty-quote">No quotes available.</p>';
    return;
  }

  const container = document.createElement("div");
  container.style.cssText =
    "max-height: 400px; overflow-y: auto; padding: 10px;";

  filteredQuotes.forEach((quote, index) => {
    const quoteItem = document.createElement("div");
    quoteItem.style.cssText =
      "background: rgba(255,255,255,0.1); padding: 15px; margin-bottom: 10px; border-radius: 6px;";
    quoteItem.innerHTML = `
            <p style="color: white; font-size: 16px; margin-bottom: 8px;">${
              index + 1
            }. "${quote.text}"</p>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px;">— ${
              quote.category
            }</p>
        `;
    container.appendChild(quoteItem);
  });

  quoteDisplay.appendChild(container);
  incrementSessionViews();
}

// ==================== ADD QUOTE ====================

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please fill in both fields!");
    return;
  }

  const newQuote = {
    id: nextQuoteId++,
    text: text,
    category: category,
    timestamp: Date.now(),
    source: "local",
  };

  quotes.push(newQuote);
  saveQuotes();

  // Post to server
  postToServer(newQuote);

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  populateCategories();
  filterQuotes();

  showNotification(
    "success",
    "Quote Added",
    "Quote added successfully and synced to server!"
  );

  if (currentFilter === "all" || category.toLowerCase() === currentFilter) {
    showRandomQuote();
  }
}

// ==================== STATISTICS ====================

function updateStats() {
  document.getElementById("totalQuotes").textContent = quotes.length;
  document.getElementById("totalCategories").textContent =
    getUniqueCategories().length;
  document.getElementById("filteredCount").textContent = filteredQuotes.length;
  document.getElementById("sessionViews").textContent =
    sessionStorage.getItem("quotesViewed") || "0";
}

// ==================== JSON IMPORT/EXPORT ====================

function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `quotes_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  showNotification(
    "success",
    "Export Complete",
    "Quotes exported successfully!"
  );
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);

      if (!Array.isArray(imported)) {
        alert("Invalid JSON format.");
        return;
      }

      const validQuotes = imported.filter((q) => q.text && q.category);

      if (validQuotes.length === 0) {
        alert("No valid quotes found.");
        return;
      }

      // Add timestamps and IDs if missing
      validQuotes.forEach((q) => {
        if (!q.id) q.id = nextQuoteId++;
        if (!q.timestamp) q.timestamp = Date.now();
      });

      quotes.push(...validQuotes);
      saveQuotes();

      populateCategories();
      filterQuotes();

      showNotification(
        "success",
        "Import Complete",
        `${validQuotes.length} quotes imported successfully!`
      );
      showRandomQuote();
    } catch (error) {
      alert("Error importing file: " + error.message);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

// ==================== UTILITY ====================

function clearAllQuotes() {
  if (confirm("Are you sure? This cannot be undone.")) {
    quotes = [];
    saveQuotes();
    populateCategories();
    filterQuotes();
    quoteDisplay.innerHTML = '<p class="empty-quote">All quotes cleared!</p>';
    showNotification(
      "warning",
      "Quotes Cleared",
      "All quotes have been deleted."
    );
  }
}

function resetToDefaults() {
  if (confirm("Reset to defaults? Custom quotes will be lost.")) {
    quotes = [...defaultQuotes];
    saveQuotes();
    populateCategories();
    filterQuotes();
    showRandomQuote();
    showNotification("success", "Reset Complete", "Reset to default quotes!");
  }
}

// ==================== INITIALIZATION ====================

function initializeApp() {
  loadQuotes();
  currentFilter = loadLastFilter();
  populateCategories();
  filterQuotes();
  updateStats();
  showRandomQuote();

  // Start auto-sync
  startAutoSync();

  // Initial sync
  setTimeout(() => {
    syncWithServer();
  }, 2000);

  console.log("App initialized with server sync enabled");
}

// Event listeners
document.getElementById("newQuoteText").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addQuote();
});

document
  .getElementById("newQuoteCategory")
  .addEventListener("keypress", (e) => {
    if (e.key === "Enter") addQuote();
  });

// Initialize
initializeApp();
