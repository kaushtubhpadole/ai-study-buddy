/* =============================================
   AI Study Buddy — Frontend Logic
   ============================================= */

// ---- DOM References ----
const topicInput     = document.getElementById('topicInput');
const modeSelect     = document.getElementById('modeSelect');
const generateBtn    = document.getElementById('generateBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorBox       = document.getElementById('errorBox');
const errorMsg       = document.getElementById('errorMsg');
const outputSection  = document.getElementById('outputSection');
const downloadBtn    = document.getElementById('downloadBtn');
const charCount      = document.getElementById('charCount');
const darkToggle     = document.getElementById('darkToggle');
const historyBtn     = document.getElementById('historyBtn');
const historyDrawer  = document.getElementById('historyDrawer');
const historyList    = document.getElementById('historyList');
const historyEmpty   = document.getElementById('historyEmpty');
const clearHistoryBtn= document.getElementById('clearHistoryBtn');

// ---- State ----
let lastResult = '';
let lastTopic  = '';

// ---- Dark Mode ----
(function initTheme() {
  const saved = localStorage.getItem('studybuddy_theme') || 'light';
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

darkToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('studybuddy_theme', isDark ? 'light' : 'dark');
});

// ---- Char Counter ----
topicInput.addEventListener('input', () => {
  charCount.textContent = topicInput.value.length;
});

// ---- History ----
function getHistory() {
  try { return JSON.parse(localStorage.getItem('studybuddy_history') || '[]'); }
  catch { return []; }
}
function saveToHistory(topic, mode, result) {
  const history = getHistory();
  history.unshift({
    id: Date.now(),
    topic: topic.slice(0, 120),
    mode,
    result,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  });
  if (history.length > 15) history.pop();
  localStorage.setItem('studybuddy_history', JSON.stringify(history));
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = '';
  if (history.length === 0) {
    historyEmpty.classList.remove('hidden');
    return;
  }
  historyEmpty.classList.add('hidden');
  const modeLabels = { simple: '🎓 Simple', exam: '📋 Exam', analogy: '💡 Analogy' };
  history.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <div class="history-item-content">
        <div class="history-item-topic">${escapeHtml(item.topic)}</div>
        <div class="history-item-meta">${modeLabels[item.mode] || item.mode} &middot; ${item.date}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    `;
    el.addEventListener('click', () => {
      topicInput.value = item.topic;
      charCount.textContent = item.topic.length;
      modeSelect.value = item.mode;
      lastResult = item.result;
      lastTopic = item.topic;
      renderOutput(item.result);
      historyDrawer.classList.add('hidden');
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    historyList.appendChild(el);
  });
}

historyBtn.addEventListener('click', () => {
  const isVisible = !historyDrawer.classList.contains('hidden');
  if (isVisible) {
    historyDrawer.classList.add('hidden');
  } else {
    renderHistory();
    historyDrawer.classList.remove('hidden');
  }
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem('studybuddy_history');
  renderHistory();
});

// ---- Markdown-ish parser ----
function parseMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^###\s(.+)/gm, '<h4>$1</h4>')
    .replace(/^##\s(.+)/gm, '<h3>$1</h3>')
    .replace(/^#\s(.+)/gm, '<h2>$1</h2>')
    .replace(/^[-•]\s(.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hl]|<ul|<li)(.+)/gm, '$1');
}

function formatAsHtml(text) {
  const lines = text.trim().split('\n');
  let html = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      return;
    }
    if (/^[-•*]\s/.test(trimmed)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${parseInline(trimmed.replace(/^[-•*]\s/, ''))}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${parseInline(trimmed)}</p>`;
    }
  });

  if (inList) html += '</ul>';
  return html;
}

function parseInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---- Parse AI Output ----
function parseOutput(raw) {
  const result = { explanation: '', summary: '', mcqs: [], flashcards: [] };

  // Extract sections by headers
  const explanationMatch = raw.match(/EXPLANATION:\s*([\s\S]*?)(?=SUMMARY:|MCQS:|FLASHCARDS:|$)/i);
  const summaryMatch     = raw.match(/SUMMARY:\s*([\s\S]*?)(?=EXPLANATION:|MCQS:|FLASHCARDS:|$)/i);
  const mcqsMatch        = raw.match(/MCQS?:\s*([\s\S]*?)(?=FLASHCARDS:|EXPLANATION:|SUMMARY:|$)/i);
  const flashcardsMatch  = raw.match(/FLASHCARDS?:\s*([\s\S]*?)(?=MCQS?:|EXPLANATION:|SUMMARY:|$)/i);

  if (explanationMatch) result.explanation = explanationMatch[1].trim();
  if (summaryMatch)     result.summary     = summaryMatch[1].trim();

  // Parse MCQs
  if (mcqsMatch) {
    const mcqText = mcqsMatch[1].trim();
    const questionBlocks = mcqText.split(/\n(?=\d+[\.\)])/);
    questionBlocks.forEach(block => {
      if (!block.trim()) return;
      const lines = block.trim().split('\n');
      if (lines.length < 2) return;
      const questionLine = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
      const options = [];
      let answer = '';

      lines.slice(1).forEach(l => {
        const optMatch = l.match(/^([a-dA-D])[\.\)]\s*(.*)/);
        const ansMatch = l.match(/^Answer:\s*([a-dA-D])/i);
        if (optMatch) options.push({ letter: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
        if (ansMatch) answer = ansMatch[1].toLowerCase();
      });

      if (questionLine) result.mcqs.push({ question: questionLine, options, answer });
    });
  }

  // Parse Flashcards
  if (flashcardsMatch) {
    const fcText = flashcardsMatch[1].trim();
    const qaPairs = fcText.split(/\n(?=Q:)/i);
    qaPairs.forEach(pair => {
      const qMatch = pair.match(/Q:\s*([\s\S]*?)(?=A:|$)/i);
      const aMatch = pair.match(/A:\s*([\s\S]*?)(?=Q:|$)/i);
      if (qMatch && aMatch) {
        result.flashcards.push({
          q: qMatch[1].trim(),
          a: aMatch[1].trim()
        });
      }
    });
  }

  return result;
}

// ---- Render Output ----
function renderOutput(rawText) {
  const parsed = parseOutput(rawText);

  // Explanation
  const expEl = document.getElementById('explanationContent');
  expEl.innerHTML = parsed.explanation
    ? formatAsHtml(parsed.explanation)
    : '<p style="color:var(--text-muted)">No explanation found.</p>';

  // Summary
  const sumEl = document.getElementById('summaryContent');
  sumEl.innerHTML = parsed.summary
    ? formatAsHtml(parsed.summary)
    : '<p style="color:var(--text-muted)">No summary found.</p>';

  // MCQs
  const mcqEl = document.getElementById('mcqContent');
  if (parsed.mcqs.length > 0) {
    mcqEl.innerHTML = parsed.mcqs.map((q, i) => {
      const opts = q.options.map(o => {
        const isCorrect = o.letter === q.answer;
        return `<div class="mcq-option ${isCorrect ? 'correct' : ''}">
          <strong>${o.letter.toUpperCase()})</strong> ${escapeHtml(o.text)}
        </div>`;
      }).join('');
      return `<div class="mcq-item">
        <div class="mcq-question">${i+1}. ${escapeHtml(q.question)}</div>
        <div class="mcq-options">${opts}</div>
        ${q.answer ? `<div class="mcq-answer-label">✓ Correct: ${q.answer.toUpperCase()}</div>` : ''}
      </div>`;
    }).join('');
  } else {
    mcqEl.innerHTML = '<p style="color:var(--text-muted)">No MCQs generated.</p>';
  }

  // Flashcards
  const fcEl = document.getElementById('flashcardContent');
  if (parsed.flashcards.length > 0) {
    fcEl.innerHTML = `<div class="flashcard-grid">${
      parsed.flashcards.map(fc => `
        <div class="flashcard">
          <div class="flashcard-q">
            <div class="flashcard-q-label">Question</div>
            <div class="flashcard-q-text">${escapeHtml(fc.q)}</div>
          </div>
          <div class="flashcard-a">
            <div class="flashcard-a-label">Answer</div>
            <div class="flashcard-a-text">${escapeHtml(fc.a)}</div>
          </div>
        </div>
      `).join('')
    }</div>`;
  } else {
    fcEl.innerHTML = '<p style="color:var(--text-muted)">No flashcards generated.</p>';
  }

  outputSection.classList.remove('hidden');
}

// ---- Generate ----
generateBtn.addEventListener('click', async () => {
  const topic = topicInput.value.trim();
  const mode  = modeSelect.value;

  if (!topic) {
    showError('Please enter a topic or paste some study notes first.');
    return;
  }

  hideError();
  outputSection.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');
  generateBtn.disabled = true;
  generateBtn.querySelector('.btn-text').textContent = 'Generating…';

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, mode })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      showError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    lastResult = data.result;
    lastTopic  = topic;

    renderOutput(data.result);
    saveToHistory(topic, mode, data.result);
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showError('Network error. Make sure the server is running and try again.');
  } finally {
    loadingSpinner.classList.add('hidden');
    generateBtn.disabled = false;
    generateBtn.querySelector('.btn-text').textContent = 'Generate';
  }
});

// ---- Download ----
downloadBtn.addEventListener('click', () => {
  if (!lastResult) return;
  const modeLabel = modeSelect.options[modeSelect.selectedIndex].text;
  const content = `AI STUDY BUDDY — Study Material
================================
Topic: ${lastTopic}
Mode: ${modeLabel}
Generated: ${new Date().toLocaleString()}
================================

${lastResult}
`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `study_${lastTopic.slice(0, 30).replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

// ---- Helpers ----
function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.classList.remove('hidden');
}
function hideError() {
  errorBox.classList.add('hidden');
}

// ---- Allow Enter+Ctrl to generate ----
topicInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') generateBtn.click();
});
