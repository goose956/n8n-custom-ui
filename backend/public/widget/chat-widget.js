/**
 * Chat Widget — embeddable chat agent
 * 
 * Usage:
 *   <script src="https://yourserver.com/widget/chat-widget.js"
 *           data-agent-id="agent_xxx"
 *           data-color="#667eea"
 *           data-position="bottom-right"
 *           defer></script>
 */
(function () {
  'use strict';

  // ── Read config from script tag ─────────────────────────────
  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('chat-widget.js') !== -1) return scripts[i];
    }
    return null;
  })();

  if (!script) { console.error('[ChatWidget] Could not find script tag'); return; }

  var agentId = script.getAttribute('data-agent-id');
  var brandColor = script.getAttribute('data-color') || '#667eea';
  var position = script.getAttribute('data-position') || 'bottom-right';

  if (!agentId) { console.error('[ChatWidget] data-agent-id is required'); return; }

  // Derive API base from script src
  var apiBase = script.src.replace(/\/widget\/chat-widget\.js.*$/, '');

  // ── State ───────────────────────────────────────────────────
  var isOpen = false;
  var conversationId = null;
  var messages = [];
  var isLoading = false;

  // ── Styles ──────────────────────────────────────────────────
  var css = '\n' +
    '#cw-container * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }\n' +
    '#cw-bubble { position: fixed; ' + (position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;') + ' bottom: 20px; width: 60px; height: 60px; border-radius: 50%; background: ' + brandColor + '; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 99999; transition: transform 0.2s; }\n' +
    '#cw-bubble:hover { transform: scale(1.1); }\n' +
    '#cw-bubble svg { width: 28px; height: 28px; fill: #fff; }\n' +
    '#cw-window { position: fixed; ' + (position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;') + ' bottom: 90px; width: 380px; max-width: calc(100vw - 40px); height: 520px; max-height: calc(100vh - 120px); background: #fff; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.15); z-index: 99999; display: flex; flex-direction: column; overflow: hidden; opacity: 0; transform: translateY(20px) scale(0.95); transition: opacity 0.25s, transform 0.25s; pointer-events: none; }\n' +
    '#cw-window.cw-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }\n' +
    '#cw-header { background: ' + brandColor + '; color: #fff; padding: 16px; display: flex; align-items: center; gap: 10px; }\n' +
    '#cw-header-title { font-size: 15px; font-weight: 600; flex: 1; }\n' +
    '#cw-close { background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; padding: 4px; line-height: 1; }\n' +
    '#cw-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }\n' +
    '.cw-msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }\n' +
    '.cw-msg-user { background: ' + brandColor + '; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }\n' +
    '.cw-msg-assistant { background: #f0f0f5; color: #1a1a2e; align-self: flex-start; border-bottom-left-radius: 4px; }\n' +
    '.cw-msg-assistant a { color: ' + brandColor + '; }\n' +
    '#cw-typing { align-self: flex-start; padding: 10px 14px; background: #f0f0f5; border-radius: 14px; font-size: 13px; color: #999; display: none; }\n' +
    '#cw-input-row { padding: 12px; border-top: 1px solid #eee; display: flex; gap: 8px; background: #fff; }\n' +
    '#cw-input { flex: 1; border: 1px solid #ddd; border-radius: 10px; padding: 10px 14px; font-size: 14px; outline: none; resize: none; min-height: 40px; max-height: 100px; }\n' +
    '#cw-input:focus { border-color: ' + brandColor + '; }\n' +
    '#cw-send { background: ' + brandColor + '; color: #fff; border: none; border-radius: 10px; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }\n' +
    '#cw-send:disabled { opacity: 0.5; cursor: default; }\n' +
    '#cw-send svg { width: 18px; height: 18px; fill: #fff; }\n' +
    '#cw-powered { text-align: center; padding: 6px; font-size: 11px; color: #bbb; }\n' +
    '@media (max-width: 450px) { #cw-window { width: calc(100vw - 20px); right: 10px; left: 10px; bottom: 80px; height: calc(100vh - 100px); } }\n';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── Build DOM ───────────────────────────────────────────────
  var container = document.createElement('div');
  container.id = 'cw-container';

  // Chat bubble
  var bubble = document.createElement('div');
  bubble.id = 'cw-bubble';
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
  bubble.onclick = toggleWidget;

  // Chat window
  var win = document.createElement('div');
  win.id = 'cw-window';

  var header = document.createElement('div');
  header.id = 'cw-header';
  header.innerHTML = '<div id="cw-header-title">Chat</div><button id="cw-close" onclick="return false">&times;</button>';

  var messagesDiv = document.createElement('div');
  messagesDiv.id = 'cw-messages';

  var typingDiv = document.createElement('div');
  typingDiv.id = 'cw-typing';
  typingDiv.textContent = 'Typing...';

  var inputRow = document.createElement('div');
  inputRow.id = 'cw-input-row';

  var input = document.createElement('textarea');
  input.id = 'cw-input';
  input.placeholder = 'Type a message...';
  input.rows = 1;

  var sendBtn = document.createElement('button');
  sendBtn.id = 'cw-send';
  sendBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  var powered = document.createElement('div');
  powered.id = 'cw-powered';
  powered.textContent = 'Powered by AI';

  inputRow.appendChild(input);
  inputRow.appendChild(sendBtn);
  messagesDiv.appendChild(typingDiv);
  win.appendChild(header);
  win.appendChild(messagesDiv);
  win.appendChild(inputRow);
  win.appendChild(powered);
  container.appendChild(bubble);
  container.appendChild(win);
  document.body.appendChild(container);

  // Attach close handler
  header.querySelector('#cw-close').onclick = function (e) { e.preventDefault(); toggleWidget(); };

  // ── Events ──────────────────────────────────────────────────
  sendBtn.onclick = sendMessage;
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // ── Functions ───────────────────────────────────────────────
  function toggleWidget() {
    isOpen = !isOpen;
    win.classList.toggle('cw-open', isOpen);
    if (isOpen && messages.length === 0) {
      // Fetch agent metadata for welcome message
      fetchAgentMeta();
    }
    if (isOpen) input.focus();
  }

  function fetchAgentMeta() {
    fetch(apiBase + '/api/chat-agents/' + agentId)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.agent) {
          header.querySelector('#cw-header-title').textContent = data.agent.name;
          if (data.agent.welcomeMessage) {
            addMessage('assistant', data.agent.welcomeMessage);
          }
        }
      })
      .catch(function () { /* ignore */ });
  }

  function addMessage(role, content) {
    messages.push({ role: role, content: content });
    var div = document.createElement('div');
    div.className = 'cw-msg cw-msg-' + role;
    // Basic markdown: **bold**, `code`, links, newlines
    var html = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:#e0e0e0;padding:1px 4px;border-radius:3px">$1</code>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
    div.innerHTML = html;
    messagesDiv.insertBefore(div, typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return div;
  }

  function sendMessage() {
    var text = input.value.trim();
    if (!text || isLoading) return;

    addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';
    isLoading = true;
    sendBtn.disabled = true;
    typingDiv.style.display = 'block';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Stream via SSE
    fetch(apiBase + '/api/chat-agents/public/' + agentId + '/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        conversationId: conversationId,
      }),
    }).then(function (response) {
      if (!response.ok) {
        return response.json().then(function (err) {
          throw new Error(err.error || 'Request failed');
        });
      }

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var assistantDiv = null;
      var fullText = '';

      function read() {
        reader.read().then(function (result) {
          if (result.done) {
            isLoading = false;
            sendBtn.disabled = false;
            typingDiv.style.display = 'none';
            // Store the full message in our local array
            if (fullText) {
              messages.push({ role: 'assistant', content: fullText });
            }
            return;
          }

          var text = decoder.decode(result.value, { stream: true });
          var lines = text.split('\n');
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line.startsWith('data: ')) continue;
            var data = line.substring(6);
            if (data === '[DONE]') continue;
            try {
              var parsed = JSON.parse(data);
              if (parsed.type === 'meta' && parsed.conversationId) {
                conversationId = parsed.conversationId;
              } else if (parsed.type === 'token' && parsed.token) {
                typingDiv.style.display = 'none';
                if (!assistantDiv) {
                  assistantDiv = document.createElement('div');
                  assistantDiv.className = 'cw-msg cw-msg-assistant';
                  messagesDiv.insertBefore(assistantDiv, typingDiv);
                }
                fullText += parsed.token;
                // Render markdown
                var html = fullText
                  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/`(.*?)`/g, '<code style="background:#e0e0e0;padding:1px 4px;border-radius:3px">$1</code>')
                  .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
                  .replace(/\n/g, '<br>');
                assistantDiv.innerHTML = html;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
              } else if (parsed.type === 'error') {
                addMessage('assistant', 'Sorry, something went wrong. Please try again.');
              }
            } catch (e) { /* ignore partial JSON */ }
          }
          read();
        }).catch(function (err) {
          isLoading = false;
          sendBtn.disabled = false;
          typingDiv.style.display = 'none';
          addMessage('assistant', 'Connection error. Please try again.');
        });
      }
      read();
    }).catch(function (err) {
      isLoading = false;
      sendBtn.disabled = false;
      typingDiv.style.display = 'none';
      addMessage('assistant', 'Sorry, could not connect. ' + (err.message || ''));
    });
  }
})();
