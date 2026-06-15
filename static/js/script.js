/* ═══════════════════════════════════════════════════════════════
   PDFMind — script.js
   Handles: theme toggle · sidebar · drag-drop upload · chat ·
            typing indicator · stats · char count · starter chips
═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── DOM refs ───────────────────────────────────────────────── */
  const html            = document.documentElement;
  const themeToggle     = document.getElementById("themeToggle");
  const sidebar         = document.getElementById("sidebar");
  const sidebarToggle   = document.getElementById("sidebarToggle");
  const sidebarOverlay  = document.getElementById("sidebarOverlay");
  const dropZone        = document.getElementById("dropZone");
  const pdfFileInput    = document.getElementById("pdfFileInput");
  const uploadForm      = document.getElementById("uploadForm");
  const uploadBtn       = document.getElementById("uploadBtn");
  const uploadStatus    = document.getElementById("uploadStatus");
  const chatForm        = document.getElementById("chatForm");
  const userInput       = document.getElementById("userInput");
  const sendBtn         = document.getElementById("sendBtn");
  const charCount       = document.getElementById("charCount");
  const messagesContainer = document.getElementById("messagesContainer");
  const emptyState      = document.getElementById("emptyState");
  const typingIndicator = document.getElementById("typingIndicator");
  const newChatBtn      = document.getElementById("newChatBtn");
  const docList         = document.getElementById("docList");
  const statPdfs        = document.getElementById("statPdfs");
  const statPages       = document.getElementById("statPages");
  const statChats       = document.getElementById("statChats");
  const pdfBar          = document.getElementById("pdfBar");
  const pageBar         = document.getElementById("pageBar");
  const chatBar         = document.getElementById("chatBar");
  const starterChips    = document.querySelectorAll(".chip");
  const toastContainer  = document.getElementById("toastContainer");

  /* ── State ──────────────────────────────────────────────────── */
  const state = {
    theme:         localStorage.getItem("pdfmind-theme") || "dark",
    sidebarOpen:   window.innerWidth > 768,
    pdfsUploaded:  0,
    totalPages:    0,
    totalMessages: 0,
    uploadedDocs:  [],
  };

  /* ════════════════════════════════════════════════════════════
     THEME
  ════════════════════════════════════════════════════════════ */
  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    state.theme = theme;
    localStorage.setItem("pdfmind-theme", theme);
  }
  applyTheme(state.theme);

  themeToggle?.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });

  /* ════════════════════════════════════════════════════════════
     SIDEBAR TOGGLE
  ════════════════════════════════════════════════════════════ */
  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("visible");
    state.sidebarOpen = true;
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("visible");
    state.sidebarOpen = false;
  }
  function toggleSidebar() {
    state.sidebarOpen ? closeSidebar() : openSidebar();
  }

  sidebarToggle?.addEventListener("click", toggleSidebar);
  sidebarOverlay?.addEventListener("click", closeSidebar);

  // On desktop, sidebar always visible (CSS handles it)
  function handleResize() {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("open");
      sidebarOverlay.classList.remove("visible");
    }
  }
  window.addEventListener("resize", handleResize);

  /* ════════════════════════════════════════════════════════════
     DRAG & DROP UPLOAD
  ════════════════════════════════════════════════════════════ */
  dropZone?.addEventListener("click", () => pdfFileInput?.click());

  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone?.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type === "application/pdf") {
      attachFile(file);
    } else {
      showUploadStatus("Only PDF files are accepted.", "error");
    }
  });

  pdfFileInput?.addEventListener("change", () => {
    const file = pdfFileInput.files?.[0];
    if (file) attachFile(file);
  });

  function attachFile(file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    pdfFileInput.files = dt.files;

    dropZone.classList.add("has-file");
    dropZone.querySelector(".drop-zone-text").textContent = file.name;
    dropZone.querySelector(".drop-zone-sub").textContent  = formatBytes(file.size);
    showUploadStatus("Ready to upload.", "");
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  /* ── Upload form submit ─────────────────────────────────────── */
  uploadForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = pdfFileInput?.files?.[0];
    if (!file) {
      showUploadStatus("Select a PDF first.", "error");
      return;
    }

    setUploadLoading(true);
    showUploadStatus("Uploading & indexing…", "");

    const formData = new FormData(uploadForm);

    try {
      const res = await fetch("/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const pages = data.pages || 0;
        addDocToList(file.name, pages);
        incrementStat("pdfs", 1);
        incrementStat("pages", pages);
        const statChunks =
    document.getElementById("statChunks");

const chunkBar =
    document.getElementById("chunkBar");

if (statChunks) {
    statChunks.innerText = data.chunks || 0;
}

if (chunkBar) {
    chunkBar.style.width = "100%";
}
        showUploadStatus(`Indexed ${pages} page${pages !== 1 ? "s" : ""} successfully.`, "success");
        dropZone.classList.remove("has-file");
        dropZone.querySelector(".drop-zone-text").textContent = "Drop PDF here";
        dropZone.querySelector(".drop-zone-sub").textContent  = "or click to browse";
        pdfFileInput.value = "";
      } else {
        showUploadStatus(data.error || "Upload failed. Try again.", "error");
      }
    } catch (err) {
      showUploadStatus("Network error. Please try again.", "error");
    } finally {
      setUploadLoading(false);
    }
  });

  function setUploadLoading(loading) {
    if (!uploadBtn) return;
    if (loading) {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = `<span class="spinner"></span> Indexing…`;
    } else {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Upload &amp; Index`;
    }
  }

  function showUploadStatus(msg, type) {
    if (!uploadStatus) return;
    uploadStatus.textContent = msg;
    uploadStatus.className = "upload-status" + (type ? " " + type : "");
  }

  /* ── Document list ──────────────────────────────────────────── */
  function addDocToList(name, pages) {
    const empty = docList?.querySelector(".doc-list-empty");
    if (empty) empty.remove();

    const li = document.createElement("li");
    li.className = "doc-item active";
    li.innerHTML = `
      <div class="doc-item-icon">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="doc-item-info">
        <div class="doc-item-name" title="${name}">${name}</div>
        <div class="doc-item-meta">${pages} pages</div>
      </div>`;

    // Remove active class from others
    docList?.querySelectorAll(".doc-item").forEach(el => el.classList.remove("active"));
    docList?.prepend(li);
    state.uploadedDocs.push({ name, pages });
  }

  /* ════════════════════════════════════════════════════════════
     STATISTICS
  ════════════════════════════════════════════════════════════ */
  function incrementStat(type, amount) {
    if (type === "pdfs") {
      state.pdfsUploaded += amount;
      animateCountUp(statPdfs, state.pdfsUploaded);
      if (pdfBar) pdfBar.style.width = Math.min(state.pdfsUploaded * 20, 100) + "%";
    } else if (type === "pages") {
      state.totalPages += amount;
      animateCountUp(statPages, state.totalPages);
      if (pageBar) pageBar.style.width = Math.min(state.totalPages / 5, 100) + "%";
    } else if (type === "messages") {
      state.totalMessages += amount;
      animateCountUp(statChats, state.totalMessages);
      if (chatBar) chatBar.style.width = Math.min(state.totalMessages * 5, 100) + "%";
    }
  }

  function animateCountUp(el, target) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const diff  = target - start;
    const steps = 20;
    let   step  = 0;

    const tick = () => {
      step++;
      const progress = step / steps;
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent  = Math.round(start + diff * eased);
      if (step < steps) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ════════════════════════════════════════════════════════════
     TEXTAREA AUTO-RESIZE + CHAR COUNT
  ════════════════════════════════════════════════════════════ */
  userInput?.addEventListener("input", () => {
    autoResize(userInput);
    updateCharCount();
    sendBtn.disabled = userInput.value.trim().length === 0;
  });

  userInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) chatForm?.dispatchEvent(new Event("submit"));
    }
  });

  function autoResize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }

  function updateCharCount() {
    const len = userInput.value.length;
    const max = parseInt(userInput.getAttribute("maxlength")) || 2000;
    charCount.textContent = `${len} / ${max}`;
    charCount.className = "char-count";
    if (len > max * 0.85) charCount.classList.add("near-limit");
    if (len >= max)        charCount.classList.add("at-limit");
  }

  /* ════════════════════════════════════════════════════════════
     STARTER CHIPS
  ════════════════════════════════════════════════════════════ */
  starterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      if (!userInput) return;
      userInput.value = chip.getAttribute("data-prompt") || "";
      userInput.focus();
      autoResize(userInput);
      updateCharCount();
      sendBtn.disabled = false;
    });
  });

  /* ════════════════════════════════════════════════════════════
     CHAT FORM SUBMIT
  ════════════════════════════════════════════════════════════ */
  chatForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = userInput.value.trim();
    if (!question) return;

    // Hide empty state
    emptyState?.classList.add("hidden");

    // Append user message
    appendMessage("user", question);
    incrementStat("messages", 1);

    // Clear input
    userInput.value = "";
    autoResize(userInput);
    updateCharCount();
    sendBtn.disabled = true;

    // Show typing indicator
    showTyping(true);
    scrollToBottom();

    try {
      const res = await fetch("/ask", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question }),
      });
      const data = await res.json();

      showTyping(false);

      if (res.ok) {
        const answer = data.answer || data.response || data.message || "No response received.";
        appendMessage("ai", answer);
        incrementStat("messages", 1);
      } else {
        appendMessage("ai", data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      showTyping(false);
      appendMessage("ai", "Network error. Please check your connection and try again.");
    }

    scrollToBottom();
  });

  /* ── Message helpers ────────────────────────────────────────── */
  function appendMessage(role, text) {
    const row = document.createElement("div");
    row.className = `message-row ${role === "user" ? "user-row" : ""}`;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const avatarHTML = role === "user"
      ? `<div class="avatar avatar-user">You</div>`
      : `<div class="avatar avatar-ai">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
             <circle cx="12" cy="12" r="3" fill="currentColor"/>
             <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           </svg>
         </div>`;

    row.innerHTML = `
      ${avatarHTML}
      <div class="bubble bubble-${role === "user" ? "user" : "ai"}">
        ${text}
        <span class="bubble-time">${now}</span>
      </div>`;

    messagesContainer?.appendChild(row);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showTyping(show) {
    if (!typingIndicator) return;
    typingIndicator.hidden = !show;
  }

  function scrollToBottom() {
    if (!messagesContainer) return;
    requestAnimationFrame(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }

  /* ════════════════════════════════════════════════════════════
     NEW CHAT
  ════════════════════════════════════════════════════════════ */
  newChatBtn?.addEventListener("click", () => {
    if (messagesContainer) messagesContainer.innerHTML = "";
    emptyState?.classList.remove("hidden");
    if (userInput) { userInput.value = ""; autoResize(userInput); }
    sendBtn.disabled = true;
  });

  /* ════════════════════════════════════════════════════════════
     TOAST AUTO-DISMISS
  ════════════════════════════════════════════════════════════ */
  document.querySelectorAll(".toast").forEach(toast => {
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  });

  /* ════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════ */
  // Make sure sidebar shows correctly at load
  if (window.innerWidth <= 768) {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("visible");
  }

  // Focus input if not mobile
  if (window.innerWidth > 768) userInput?.focus();

  // Initial char count
  updateCharCount();

})();
