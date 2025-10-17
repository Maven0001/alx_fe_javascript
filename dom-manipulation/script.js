// script.js - Dynamic Quote Generator with storage, import/export, filtering, and simulated sync

// ----- Storage keys -----
const STORAGE_KEY = "dqg_quotes_v1";
const FILTER_KEY = "dqg_last_filter";
const SESSION_LAST_QUOTE = "dqg_last_viewed_quote";

// ----- DOM elements -----
const categoryFilter = document.getElementById("categoryFilter");
const quoteTextEl = document.getElementById("quoteText");
const quoteCategoryEl = document.getElementById("quoteCategory");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const randomByCategoryBtn = document.getElementById("randomByCategory");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const addQuoteForm = document.getElementById("addQuoteForm");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");
const importFile = document.getElementById("importFile");
const exportJsonBtn = document.getElementById("exportJson");
const quotesTableBody = document.querySelector("#quotesTable tbody");
const notify = document.getElementById("notify");
const conflictBanner = document.getElementById("conflictBanner");
const showDetailsBtn = document.getElementById("showDetails");
const manualMergeBtn = document.getElementById("manualMerge");
const clearStorageBtn = document.getElementById("clearStorage");

// ----- Initial default quotes -----
let quotes = [
  {
    text: "Be yourself; everyone else is already taken.",
    category: "inspiration",
    id: uid(),
  },
  {
    text: "Simplicity is the soul of efficiency.",
    category: "productivity",
    id: uid(),
  },
  {
    text: "The best way to predict the future is to invent it.",
    category: "innovation",
    id: uid(),
  },
  {
    text: "Learning never exhausts the mind.",
    category: "learning",
    id: uid(),
  },
];

// helper to generate unique IDs
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ----- Storage helpers -----
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        quotes = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse stored quotes", e);
    }
  } else {
    saveQuotes(); // persist default set
  }
}

// ----- UI / DOM rendering -----
function populateCategories() {
  // extract unique categories
  const cats = new Set(quotes.map((q) => q.category));
  // remember the current selection to restore later
  const current =
    categoryFilter.value || localStorage.getItem(FILTER_KEY) || "all";
  // rebuild options
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  Array.from(cats)
    .sort()
    .forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = capitalize(cat);
      categoryFilter.appendChild(opt);
    });
  // restore selection if possible
  if ([...categoryFilter.options].some((o) => o.value === current)) {
    categoryFilter.value = current;
  } else {
    categoryFilter.value = "all";
  }
}

function populateQuotesTable() {
  quotesTableBody.innerHTML = "";
  quotes.forEach((q) => {
    const tr = document.createElement("tr");
    const tdText = document.createElement("td");
    tdText.textContent = q.text;
    const tdCat = document.createElement("td");
    tdCat.textContent = q.category;
    const tdActions = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "secondary";
    delBtn.onclick = () => {
      quotes = quotes.filter((x) => x.id !== q.id);
      saveQuotes();
      populateCategories();
      populateQuotesTable();
      showNotification("Quote deleted");
    };
    tdActions.appendChild(delBtn);
    tr.appendChild(tdText);
    tr.appendChild(tdCat);
    tr.appendChild(tdActions);
    quotesTableBody.appendChild(tr);
  });
}

function showQuote(q) {
  if (!q) {
    quoteTextEl.textContent = "No quote available.";
    quoteCategoryEl.textContent = "";
    return;
  }
  quoteTextEl.textContent = q.text;
  quoteCategoryEl.textContent = `Category: ${capitalize(q.category)}`;
  // Save last viewed quote in session storage
  sessionStorage.setItem(SESSION_LAST_QUOTE, JSON.stringify(q));
}

function getRandomQuote(filteredList) {
  if (!filteredList || filteredList.length === 0) return null;
  const idx = Math.floor(Math.random() * filteredList.length);
  return filteredList[idx];
}

// ----- Business logic functions -----
function showRandomQuote() {
  const selected = categoryFilter.value;
  const filtered =
    selected === "all" ? quotes : quotes.filter((q) => q.category === selected);
  const q = getRandomQuote(filtered);
  if (q) {
    showQuote(q);
  } else {
    showQuote(null);
  }
}

function showRandomByCategory() {
  const selected = categoryFilter.value;
  if (selected === "all") {
    showNotification("Please choose a category first");
    return;
  }
  const filtered = quotes.filter((q) => q.category === selected);
  const q = getRandomQuote(filtered);
  showQuote(q || null);
}

function addQuoteObject(text, category) {
  const obj = {
    text: text.trim(),
    category: category.trim().toLowerCase(),
    id: uid(),
  };
  quotes.push(obj);
  saveQuotes();
  populateCategories();
  populateQuotesTable();
  showNotification("Quote added");
  return obj;
}

function addQuoteFromForm() {
  const text = newQuoteText.value.trim();
  const cat = newQuoteCategory.value.trim().toLowerCase();
  if (!text || !cat) {
    showNotification("Please provide quote text and category", true);
    return;
  }
  addQuoteObject(text, cat);
  newQuoteText.value = "";
  newQuoteCategory.value = "";
}

// ----- Import / Export JSON -----
function exportQuotesToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported))
        throw new Error("Invalid format: expected array");
      // preserve unique ids; if missing, generate
      const normalized = imported.map((it) => ({
        text: String(it.text || ""),
        category: String(it.category || "").toLowerCase(),
        id: it.id || uid(),
      }));
      quotes.push(...normalized);
      saveQuotes();
      populateCategories();
      populateQuotesTable();
      showNotification("Quotes imported successfully!");
    } catch (err) {
      showNotification("Import failed: invalid JSON", true);
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// ----- Filter logic -----
function filterQuotes() {
  const sel = categoryFilter.value;
  localStorage.setItem(FILTER_KEY, sel);
  populateQuotesTable(); // nothing filtered inside table, but relevant for chosen filter
  showRandomQuote();
}

// ----- Notifications -----
let notifyTimer = null;
function showNotification(message, isError = false, timeout = 3000) {
  notify.style.display = "block";
  notify.style.background = isError ? "#f8d7da" : "#d1ecf1";
  notify.style.border = isError ? "1px solid #f5c6cb" : "1px solid #bee5eb";
  notify.textContent = message;
  if (notifyTimer) clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    notify.style.display = "none";
  }, timeout);
}

// ----- Utility -----
function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ----- Session restore -----
function restoreLastViewed() {
  const raw = sessionStorage.getItem(SESSION_LAST_QUOTE);
  if (raw) {
    try {
      const q = JSON.parse(raw);
      showQuote(q);
      return;
    } catch (e) {}
  }
  showRandomQuote();
}

// ----- Simulated server syncing & conflict resolution -----
// This is a simulation. In production you'd use a real API and proper conflict resolution.
let lastServerSnapshot = null; // will hold simulated server data
function simulateServerFetch() {
  // Simulate server by returning an array similar to quotes (here we simply return a slightly modified dataset randomly)
  // In a live app you'd fetch: fetch('https://api.example.com/quotes').then(...)
  return new Promise((resolve) => {
    // create a "server" copy; sometimes server adds a quote to simulate remote update
    const serverCopy = JSON.parse(JSON.stringify(quotes));
    // 30% chance server added a new quote (simulate remote edit)
    if (Math.random() < 0.3) {
      serverCopy.push({
        text: "Server-added quote " + Math.floor(Math.random() * 1000),
        category: "server",
        id: uid(),
      });
    }
    // also sometimes change an existing quote text (simulate conflict)
    if (serverCopy.length && Math.random() < 0.2) {
      serverCopy[0].text = serverCopy[0].text + " (server update)";
    }
    setTimeout(() => resolve(serverCopy), 500);
  });
}

async function syncWithServer() {
  try {
    const serverData = await simulateServerFetch();
    // Simple conflict detection: compare by id and text; if differences, server wins
    const merged = [];
    const localMap = new Map(quotes.map((q) => [q.id, q]));
    const serverMap = new Map(serverData.map((q) => [q.id, q]));

    // if server has item not in local => add it
    serverData.forEach((sd) => {
      merged.push(sd);
    });

    // add local-only items (not present on server) - server wins for duplicates but local-only still included
    quotes.forEach((lq) => {
      if (!serverMap.has(lq.id)) {
        merged.push(lq);
      }
    });

    // If merged differs from local quotes => we had changes
    const mergedJson = JSON.stringify(merged);
    const localJson = JSON.stringify(quotes);
    if (mergedJson !== localJson) {
      quotes = merged;
      saveQuotes();
      populateCategories();
      populateQuotesTable();
      conflictBanner.style.display = "block";
      lastServerSnapshot = serverData;
      showNotification(
        "Data synced with server; changes applied (server precedence)"
      );
    }
  } catch (err) {
    console.error("Sync failed", err);
    showNotification("Sync failed", true);
  }
}

// Manual merge view (very simple)
showDetailsBtn?.addEventListener("click", () => {
  if (!lastServerSnapshot) {
    showNotification("No server snapshot available");
    return;
  }
  alert(
    "Server snapshot example (first items):\n" +
      JSON.stringify(lastServerSnapshot.slice(0, 5), null, 2)
  );
});

manualMergeBtn?.addEventListener("click", () => {
  if (!lastServerSnapshot) {
    showNotification("No server snapshot available");
    return;
  }
  // For demo: ask user whether to accept server or keep local
  const keepLocal = confirm(
    "Click OK to keep LOCAL version, Cancel to accept SERVER version."
  );
  if (keepLocal) {
    // do nothing; we already stored server version earlier; we can restore local from backup if we saved one
    showNotification("Kept local changes (no-op in demo)");
  } else {
    // accept server => already applied by sync; just hide banner
    showNotification("Server version kept");
  }
  conflictBanner.style.display = "none";
});

// ----- Initialization -----
function init() {
  loadQuotes();
  populateCategories();
  populateQuotesTable();

  // restore last chosen filter
  const lastFilter = localStorage.getItem(FILTER_KEY);
  if (lastFilter) categoryFilter.value = lastFilter;

  // restore last quote from session or show random
  restoreLastViewed();

  // Event listeners
  newQuoteBtn.addEventListener("click", showRandomQuote);
  randomByCategoryBtn.addEventListener("click", showRandomByCategory);
  addQuoteBtn.addEventListener("click", addQuoteFromForm);
  importFile.addEventListener("change", importFromJsonFile);
  exportJsonBtn.addEventListener("click", exportQuotesToJson);
  categoryFilter.addEventListener("change", filterQuotes);
  clearStorageBtn.addEventListener("click", () => {
    if (confirm("Clear local storage? This will remove all saved quotes.")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FILTER_KEY);
      quotes = [];
      saveQuotes();
      populateCategories();
      populateQuotesTable();
      showNotification("Local storage cleared");
    }
  });

  // Periodic sync simulation every 25 seconds
  setInterval(() => {
    // only sync if user allows demo to run
    syncWithServer();
  }, 25000);
}

init();
