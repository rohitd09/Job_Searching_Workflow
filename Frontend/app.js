/* ===================================================
   app.js – Job Search Chatbot Frontend Logic
   =================================================== */

const API_URL = 'http://127.0.0.1:8000/execute-workflow';

// DOM References
const triggerBtn       = document.getElementById('triggerBtn');
const btnLabel         = document.getElementById('btnLabel');
const messagesEl       = document.getElementById('messages');
const chatWindow       = document.getElementById('chatWindow');
const welcomeScreen    = document.getElementById('welcomeScreen');
const actionHint       = document.getElementById('actionHint');
const menuBtn          = document.getElementById('menuBtn');
const sidebar          = document.getElementById('sidebar');
const newChatBtn       = document.getElementById('newChatBtn');
const chatHistoryEl    = document.getElementById('chatHistory');

// State
let isLoading   = false;
let messageCount = 0;
let sessionCount = 0;

/* ===================================================
   Sidebar Toggle
   =================================================== */
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

/* ===================================================
   New Chat
   =================================================== */
newChatBtn.addEventListener('click', () => {
  clearChat();
});

function clearChat() {
  messagesEl.innerHTML = '';
  welcomeScreen.style.display = 'flex';
  welcomeScreen.style.flexDirection = 'column';
  welcomeScreen.style.alignItems = 'center';
  welcomeScreen.style.justifyContent = 'center';
  messageCount = 0;
  actionHint.textContent = 'Ready to find your next opportunity?';
  btnLabel.textContent = 'Run Workflow';
}

/* ===================================================
   Trigger Button – Main Action
   =================================================== */
triggerBtn.addEventListener('click', async () => {
  if (isLoading) return;
  startLoading();

  // Hide welcome screen on first use
  if (messageCount === 0) {
    welcomeScreen.style.display = 'none';

    // Add to sidebar history
    sessionCount++;
    addHistoryItem(`Session ${sessionCount}`);
  }

  // Add a "user" request bubble
  appendUserMessage('▶ Run Workflow');

  // Show typing indicator
  const typingEl = showTypingIndicator();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
    });

    removeTypingIndicator(typingEl);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Try to parse as JSON, fall back to raw text
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      // If the response is an object, format it nicely; otherwise use directly
      data = typeof json === 'object' ? formatJsonResponse(json) : String(json);
    } else {
      data = await response.text();
    }

    appendAIMessage(data);
    messageCount++;
    actionHint.textContent = 'Click again to run another query.';
    btnLabel.textContent = 'Run Again';

  } catch (err) {
    removeTypingIndicator(typingEl);
    const userMsg = err.message.includes('Failed to fetch')
      ? 'Could not connect to the server. Make sure the backend is running at http://127.0.0.1:8000'
      : err.message;
    appendAIMessage(`⚠️ ${userMsg}`, true);
    showToast(userMsg);
    messageCount++;
  } finally {
    stopLoading();
  }
});

/* ===================================================
   Message Helpers
   =================================================== */
function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user-row';
  row.innerHTML = `
    <div class="avatar user-avatar-msg">U</div>
    <div class="message-content">
      <div class="message-meta">
        <span class="message-sender">You</span>
        <span class="message-time">${getTime()}</span>
      </div>
      <div class="message-bubble user-bubble">${escapeHTML(text)}</div>
    </div>
  `;
  const group = wrapInGroup(row);
  messagesEl.appendChild(group);
  scrollToBottom();
}

function appendAIMessage(text, isError = false) {
  const row = document.createElement('div');
  row.className = 'message-row';

  const bubbleClass = isError
    ? 'message-bubble ai-bubble'
    : 'message-bubble ai-bubble';

  row.innerHTML = `
    <div class="avatar ai-avatar">✦</div>
    <div class="message-content">
      <div class="message-meta">
        <span class="message-sender">Job AI</span>
        <span class="message-time">${getTime()}</span>
      </div>
      <div class="${bubbleClass}">${formatText(text)}</div>
    </div>
  `;

  const group = wrapInGroup(row);
  messagesEl.appendChild(group);
  scrollToBottom();
}

function wrapInGroup(row) {
  const group = document.createElement('div');
  group.className = 'message-group';
  group.appendChild(row);
  return group;
}

/* ===================================================
   Typing Indicator
   =================================================== */
function showTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'typing-indicator';
  el.id = 'typingIndicator';
  el.innerHTML = `
    <div class="avatar ai-avatar">✦</div>
    <div class="typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  messagesEl.appendChild(el);
  scrollToBottom();
  return el;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

/* ===================================================
   Sidebar History
   =================================================== */
function addHistoryItem(label) {
  // Deactivate current active
  document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));

  const li = document.createElement('li');
  li.className = 'history-item active';
  li.textContent = label;
  li.addEventListener('click', () => {
    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
    li.classList.add('active');
  });
  chatHistoryEl.appendChild(li);
}

/* ===================================================
   Loading State
   =================================================== */
function startLoading() {
  isLoading = true;
  triggerBtn.disabled = true;
  btnLabel.textContent = 'Running…';
  actionHint.textContent = 'Fetching response from the AI workflow…';

  // Animate button icon to spinner-like look
  const icon = triggerBtn.querySelector('.btn-icon svg');
  if (icon) icon.style.animation = 'spin 1s linear infinite';
}

function stopLoading() {
  isLoading = false;
  triggerBtn.disabled = false;

  const icon = triggerBtn.querySelector('.btn-icon svg');
  if (icon) icon.style.animation = '';
}

/* ===================================================
   Toast Notification
   =================================================== */
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ===================================================
   Utilities
   =================================================== */
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Basic Markdown-like formatting for AI response text:
 * - **bold** → <strong>
 * - *italic* → <em>
 * - `code` → <code>
 * - Newlines → <br>
 * - Bullet lines starting with - or * → list items
 */
function formatText(text) {
  // Escape HTML first
  let escaped = escapeHTML(text);

  // Bold: **text**
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code: `text`
  escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">$1</code>');

  // Convert newlines to <br>
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}

function formatJsonResponse(json) {
  // If there's a "result", "answer", "response", or "output" key, surface it
  const knownKeys = ['result', 'answer', 'response', 'output', 'message', 'content', 'data', 'text'];
  for (const key of knownKeys) {
    if (json[key] !== undefined) {
      const val = json[key];
      return typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
    }
  }
  // Fallback: pretty-print the JSON
  return JSON.stringify(json, null, 2);
}
