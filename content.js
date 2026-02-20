/**
 * Content script - floating voice button and inline panel
 */
(function () {
  const FLOAT_ID = 'voice-notebook-float';
  const PANEL_ID = 'voice-notebook-panel';

  /** Donation/support page URL — replace with your own (Donation Alerts, Boosty, Patreon, etc.) */
  var DONATE_URL = 'https://www.donationalerts.com/r/David_Web_Creator'; // replace with your link

  var THEME_STORAGE_KEY = 'voice-notebook-theme';
  var UI_LANG_KEY = 'voice-notebook-ui-lang';

  var STRINGS = {
    en: {
      title: 'Voice input',
      donateTitle: 'Support the project',
      themeLight: 'Light theme',
      themeDark: 'Dark theme',
      themeToggle: 'Toggle theme',
      closePanel: 'Close panel',
      close: 'Close',
      langLabel: 'Language',
      langTitle: 'Speech recognition language',
      micAria: 'Record',
      statusIdle: 'Click and speak',
      placeholder: 'Text will appear here...',
      actionsAria: 'Text actions',
      fixTitle: 'Fix punctuation and capitalization',
      copyTitle: 'Copy to clipboard',
      clearTitle: 'Clear all text',
      injectTitle: 'Insert text into message field',
      statusListening: 'Listening...',
      statusReady: 'Ready',
      statusRequestingMic: 'Requesting microphone access...',
      statusCopied: 'Copied',
      statusCopyFailed: 'Failed to copy',
      statusCleared: 'Text cleared',
      statusInjected: 'Inserted into input field',
      statusClickInput: 'Click in the message field first',
      errors: {
        'not-allowed': 'Allow microphone access (icon in address bar).',
        'no-speech': 'Speech not recognized. Speak closer to the microphone.',
        'network': 'Check your internet connection.',
        'audio-capture': 'Microphone busy or unavailable.',
        'service-not-allowed': 'Recognition service unavailable.',
        'language-not-supported': 'Language not supported.'
      },
      errorPrefix: 'Error: ',
      speechUnsupported: 'Speech not supported (use Chrome/Edge)',
      micAllowSite: 'Allow microphone access in site settings.',
      micUnavailable: 'Microphone unavailable: '
    },
    ru: {
      title: 'Voice input',
      donateTitle: 'Поддержать разработку',
      themeLight: 'Светлая тема',
      themeDark: 'Тёмная тема',
      themeToggle: 'Переключить тему',
      closePanel: 'Закрыть панель',
      close: 'Закрыть',
      langLabel: 'Язык',
      langTitle: 'Язык распознавания речи',
      micAria: 'Запись',
      statusIdle: 'Нажмите и говорите',
      placeholder: 'Текст появится здесь...',
      actionsAria: 'Действия с текстом',
      fixTitle: 'Исправить пунктуацию и заглавные буквы',
      copyTitle: 'Скопировать в буфер обмена',
      clearTitle: 'Очистить весь текст',
      injectTitle: 'Вставить текст в поле сообщения в диалоге',
      statusListening: 'Слушаю...',
      statusReady: 'Готов',
      statusRequestingMic: 'Запрос доступа к микрофону...',
      statusCopied: 'Скопировано',
      statusCopyFailed: 'Не удалось скопировать',
      statusCleared: 'Текст очищен',
      statusInjected: 'Вставлено в поле ввода',
      statusClickInput: 'Сначала кликните в поле сообщения в диалоге',
      errors: {
        'not-allowed': 'Разрешите доступ к микрофону (иконка в адресной строке).',
        'no-speech': 'Речь не распознана. Говорите ближе к микрофону.',
        'network': 'Проверьте интернет.',
        'audio-capture': 'Микрофон занят или недоступен.',
        'service-not-allowed': 'Сервис распознавания недоступен.',
        'language-not-supported': 'Язык не поддерживается.'
      },
      errorPrefix: 'Ошибка: ',
      speechUnsupported: 'Речь не поддерживается (используйте Chrome/Edge)',
      micAllowSite: 'Разрешите доступ к микрофону в настройках сайта.',
      micUnavailable: 'Микрофон недоступен: '
    }
  };

  function getUILang() {
    try {
      var s = localStorage.getItem(UI_LANG_KEY);
      if (s === 'en' || s === 'ru') return s;
    } catch (e) {}
    return (navigator.language && navigator.language.toLowerCase().indexOf('en') === 0) ? 'en' : 'ru';
  }

  function setUILang(lang) {
    try {
      if (lang === 'en' || lang === 'ru') localStorage.setItem(UI_LANG_KEY, lang);
    } catch (e) {}
  }

  function applyUILang(panel, t) {
    if (!panel || !t) return;
    var headerSpan = panel.querySelector('.vn-panel-header > span');
    if (headerSpan) headerSpan.textContent = t.title;
    var donateBtn = panel.querySelector('.vn-donate-btn');
    if (donateBtn) { donateBtn.setAttribute('title', t.donateTitle); donateBtn.setAttribute('aria-label', t.donateTitle); }
    var themeBtn = panel.querySelector('.vn-theme-toggle');
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', t.themeToggle);
      themeBtn.setAttribute('title', panel.classList.contains('vn-theme-light') ? t.themeDark : t.themeLight);
    }
    var closeBtn = panel.querySelector('.vn-close');
    if (closeBtn) { closeBtn.setAttribute('title', t.closePanel); closeBtn.setAttribute('aria-label', t.close); }
    var langLabel = panel.querySelector('.vn-lang-label');
    if (langLabel) langLabel.textContent = t.langLabel;
    var langSelect = panel.querySelector('.vn-lang-select');
    if (langSelect) langSelect.setAttribute('title', t.langTitle);
    var mic = panel.querySelector('.vn-mic');
    if (mic) mic.setAttribute('aria-label', t.micAria);
    var status = panel.querySelector('.vn-status');
    if (status) status.textContent = t.statusIdle;
    var textarea = panel.querySelector('.vn-text');
    if (textarea) textarea.setAttribute('placeholder', t.placeholder);
    var actions = panel.querySelector('.vn-actions');
    if (actions) actions.setAttribute('aria-label', t.actionsAria);
    var fixBtn = panel.querySelector('.vn-fix');
    if (fixBtn) fixBtn.setAttribute('title', t.fixTitle);
    var copyBtn = panel.querySelector('.vn-copy');
    if (copyBtn) copyBtn.setAttribute('title', t.copyTitle);
    var clearBtn = panel.querySelector('.vn-clear');
    if (clearBtn) clearBtn.setAttribute('title', t.clearTitle);
    var injectBtn = panel.querySelector('.vn-inject');
    if (injectBtn) injectBtn.setAttribute('title', t.injectTitle);
    var langBtns = panel.querySelectorAll('.vn-ui-lang');
    langBtns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === getUILang());
    });
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setSavedTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) { }
  }

  /** Detect page light/dark theme from background under the button and body */
  function getPageTheme() {
    var el = document.elementFromPoint(window.innerWidth - 36, window.innerHeight - 36);
    if (!el) el = document.body;
    var bg = window.getComputedStyle(el).backgroundColor;
    var r = 0, g = 0, b = 0;
    var m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      r = parseInt(m[1], 10) / 255;
      g = parseInt(m[2], 10) / 255;
      b = parseInt(m[3], 10) / 255;
    } else {
      m = bg.match(/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/);
      if (m) {
        r = parseInt(m[1], 16) / 255;
        g = parseInt(m[2], 16) / 255;
        b = parseInt(m[3], 16) / 255;
      } else {
        el = document.body;
        bg = window.getComputedStyle(el).backgroundColor;
        m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          r = parseInt(m[1], 10) / 255;
          g = parseInt(m[2], 10) / 255;
          b = parseInt(m[3], 10) / 255;
        }
      }
    }
    if (r === 0 && g === 0 && b === 0) {
      var bodyBg = window.getComputedStyle(document.body).backgroundColor;
      var mb = bodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (mb) {
        r = parseInt(mb[1], 10) / 255;
        g = parseInt(mb[2], 10) / 255;
        b = parseInt(mb[3], 10) / 255;
      }
    }
    var luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 0.55 ? 'light' : 'dark';
  }

  /** Find the best input field: active element first, then typical message input at bottom of viewport */
  function findBestInput() {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      return active;
    }
    const inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea, [contenteditable="true"]');
    const viewportHeight = window.innerHeight;
    let best = null;
    let bestScore = -1;
    for (const el of inputs) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      var score = 0;
      if (el.getAttribute('placeholder') && /сообщен|message|напишите|write|чат|chat/i.test(el.getAttribute('placeholder'))) score += 10;
      if (el.getAttribute('role') === 'textbox') score += 5;
      if (rect.bottom > viewportHeight * 0.4) score += 3;
      if (rect.bottom > viewportHeight * 0.6) score += 5;
      if (score > bestScore) { bestScore = score; best = el; }
    }
    return best || (inputs.length ? inputs[0] : null);
  }

  function injectText(text) {
    const el = findBestInput();
    if (el) {
      el.focus();
      if (el.isContentEditable) {
        document.execCommand('insertText', false, text);
      } else {
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        el.value = el.value.slice(0, start) + text + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start + text.length;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return true;
    }
    return false;
  }

  function fixPunctuation(text) {
    if (!text.trim()) return text;
    let r = text.replace(/\s+/g, ' ').replace(/\s*([.,!?;:])\s*/g, '$1 ').trim();
    r = r.replace(/([.!?]\s+)([a-zа-яёәөүґіїє])/gi, (_, p, l) => p + l.toUpperCase());
    if (r.length) r = r[0].toUpperCase() + r.slice(1);
    return r.replace(/\s+/g, ' ').trim();
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);

    var theme = getSavedTheme() || getPageTheme();
    var uiLang = getUILang();
    var t = STRINGS[uiLang];
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'voice-notebook-panel' + (theme === 'light' ? ' vn-theme-light' : '');
    panel.innerHTML = `
      <div class="vn-panel-header">
        <span>${t.title}</span>
        <div class="vn-header-actions">
          <span class="vn-ui-lang-wrap" title="UI language">
            <button type="button" class="vn-ui-lang ${uiLang === 'en' ? 'active' : ''}" data-lang="en" aria-label="English">EN</button>
            <button type="button" class="vn-ui-lang ${uiLang === 'ru' ? 'active' : ''}" data-lang="ru" aria-label="Русский">RU</button>
          </span>
          <a href="#" class="vn-donate-btn" title="${t.donateTitle}" aria-label="${t.donateTitle}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></a>
          <button type="button" class="vn-theme-toggle" title="${panel.classList.contains('vn-theme-light') ? t.themeDark : t.themeLight}" aria-label="${t.themeToggle}"><svg class="vn-theme-icon vn-theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg><svg class="vn-theme-icon vn-theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
          <button type="button" class="vn-close" title="${t.closePanel}" aria-label="${t.close}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="vn-panel-body">
        <div class="vn-lang-row">
          <label class="vn-lang-label">${t.langLabel}</label>
          <select class="vn-lang-select" title="${t.langTitle}">
            <option value="ru-RU" selected>Русский</option>
            <option value="uk-UA">Українська</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="de-DE">Deutsch</option>
            <option value="fr-FR">Français</option>
            <option value="es-ES">Español</option>
            <option value="it-IT">Italiano</option>
            <option value="pt-BR">Português (BR)</option>
            <option value="pt-PT">Português (PT)</option>
            <option value="zh-CN">中文</option>
            <option value="zh-TW">中文 (繁體)</option>
            <option value="ja-JP">日本語</option>
            <option value="ko-KR">한국어</option>
            <option value="tr-TR">Türkçe</option>
            <option value="pl-PL">Polski</option>
            <option value="nl-NL">Nederlands</option>
            <option value="ar-SA">العربية</option>
            <option value="hi-IN">हिन्दी</option>
          </select>
        </div>
        <button type="button" class="vn-mic" aria-label="${t.micAria}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><line x1="12" y1="12" x2="12" y2="19"/><line x1="8" y1="19" x2="16" y2="19"/></svg></button>
        <div class="vn-status">${t.statusIdle}</div>
        <textarea class="vn-text" placeholder="${t.placeholder}"></textarea>
        <div class="vn-actions" role="toolbar" aria-label="${t.actionsAria}">
          <button type="button" class="vn-btn vn-fix" title="${t.fixTitle}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button type="button" class="vn-btn vn-copy" title="${t.copyTitle}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
          <button type="button" class="vn-btn vn-clear" title="${t.clearTitle}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
          <button type="button" class="vn-btn vn-inject primary" title="${t.injectTitle}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelectorAll('.vn-ui-lang').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = this.getAttribute('data-lang');
        if (lang !== 'en' && lang !== 'ru') return;
        setUILang(lang);
        applyUILang(panel, STRINGS[getUILang()]);
        var themeToggle = panel.querySelector('.vn-theme-toggle');
        if (themeToggle) themeToggle.setAttribute('title', panel.classList.contains('vn-theme-light') ? STRINGS[getUILang()].themeDark : STRINGS[getUILang()].themeLight);
      });
    });

    var donateBtn = panel.querySelector('.vn-donate-btn');
    if (donateBtn) {
      donateBtn.href = DONATE_URL;
      donateBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.open(DONATE_URL, '_blank', 'noopener,noreferrer');
      });
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;
    var committedText = '';

    function getErrorText(errorCode) {
      var t = STRINGS[getUILang()];
      return (t.errors && t.errors[errorCode]) || (t.errorPrefix + errorCode);
    }

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = function () {
        isRecording = true;
        var ta = panel.querySelector('.vn-text');
        committedText = ta.value || '';
        panel.querySelector('.vn-mic').classList.add('recording');
        panel.querySelector('.vn-status').textContent = STRINGS[getUILang()].statusListening;
      };

      recognition.onend = function () {
        if (isRecording) {
          try { recognition.start(); } catch (_) { }
          return;
        }
        isRecording = false;
        panel.querySelector('.vn-mic').classList.remove('recording');
        panel.querySelector('.vn-status').textContent = STRINGS[getUILang()].statusReady;
      };

      recognition.onerror = function (e) {
        if (e.error === 'aborted') return;
        if (e.error === 'no-speech' && isRecording) {
          try { recognition.start(); } catch (_) { }
          return;
        }
        panel.querySelector('.vn-status').textContent = getErrorText(e.error);
        panel.querySelector('.vn-mic').classList.remove('recording');
        isRecording = false;
      };

      recognition.onresult = function (e) {
        var ta = panel.querySelector('.vn-text');
        var final = '', interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t; else interim += t;
        }
        if (final) committedText = (committedText ? committedText + ' ' : '') + final;
        ta.value = committedText + (interim ? (committedText ? ' ' : '') + interim : '');
      };
    }

    var mic = panel.querySelector('.vn-mic');
    var textarea = panel.querySelector('.vn-text');
    var status = panel.querySelector('.vn-status');

    mic.addEventListener('click', function () {
      var t = STRINGS[getUILang()];
      if (!recognition) { status.textContent = t.speechUnsupported; return; }
      if (isRecording) {
        isRecording = false;
        recognition.stop();
      } else {
        var langSelect = panel.querySelector('.vn-lang-select');
        recognition.lang = langSelect ? langSelect.value : 'ru-RU';
        status.textContent = t.statusRequestingMic;
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(function (stream) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            recognition.start();
          })
          .catch(function (err) {
            status.textContent = err.name === 'NotAllowedError'
              ? t.micAllowSite
              : t.micUnavailable + (err.message || err.name);
          });
      }
    });

    panel.querySelector('.vn-fix').addEventListener('click', function () {
      if (textarea.value.trim()) textarea.value = fixPunctuation(textarea.value);
    });

    panel.querySelector('.vn-copy').addEventListener('click', function () {
      var text = textarea.value.trim();
      if (!text) return;
      var t = STRINGS[getUILang()];
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = t.statusCopied;
        setTimeout(function () { status.textContent = t.statusReady; }, 1500);
      }).catch(function () {
        status.textContent = t.statusCopyFailed;
      });
    });

    panel.querySelector('.vn-clear').addEventListener('click', function () {
      textarea.value = '';
      committedText = '';
      var t = STRINGS[getUILang()];
      status.textContent = t.statusCleared;
      setTimeout(function () { status.textContent = t.statusReady; }, 1500);
    });

    panel.querySelector('.vn-inject').addEventListener('click', function () {
      var text = textarea.value.trim();
      if (!text) return;
      var ok = injectText(text);
      var t = STRINGS[getUILang()];
      if (ok) {
        status.textContent = t.statusInjected;
        setTimeout(function () { status.textContent = t.statusReady; }, 1500);
        closePanelWithAnimation(panel);
      } else {
        status.textContent = t.statusClickInput;
      }
    });

    panel.querySelector('.vn-theme-toggle').addEventListener('click', function () {
      var isLight = panel.classList.toggle('vn-theme-light');
      var btn = document.getElementById(FLOAT_ID);
      if (btn) btn.classList.toggle('vn-theme-light', isLight);
      setSavedTheme(isLight ? 'light' : 'dark');
      var t = STRINGS[getUILang()];
      this.setAttribute('title', isLight ? t.themeDark : t.themeLight);
    });

    var themeToggle = panel.querySelector('.vn-theme-toggle');
    if (themeToggle) themeToggle.setAttribute('title', panel.classList.contains('vn-theme-light') ? t.themeDark : t.themeLight);

    panel.querySelector('.vn-close').addEventListener('click', function () {
      if (isRecording) {
        isRecording = false;
        if (recognition) recognition.stop();
      }
      closePanelWithAnimation(panel);
    });

    return panel;
  }

  function closePanelWithAnimation(panel) {
    panel.classList.add('vn-closing');
    panel.classList.remove('open');
    var once = function () {
      panel.removeEventListener('transitionend', once);
      panel.classList.remove('vn-closing');
    };
    panel.addEventListener('transitionend', once);
  }

  function createFloatingButton() {
    if (document.getElementById(FLOAT_ID)) return;

    var theme = getSavedTheme() || getPageTheme();
    const btn = document.createElement('button');
    btn.id = FLOAT_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Voice input');
    btn.className = 'voice-notebook-float-btn' + (theme === 'light' ? ' vn-theme-light' : '');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><line x1="12" y1="12" x2="12" y2="19"/><line x1="8" y1="19" x2="16" y2="19"/></svg>`;
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      const panel = createPanel();
      if (panel.classList.contains('open')) {
        closePanelWithAnimation(panel);
      } else {
        var t = getSavedTheme() || getPageTheme();
        panel.classList.toggle('vn-theme-light', t === 'light');
        var floatBtn = document.getElementById(FLOAT_ID);
        if (floatBtn) floatBtn.classList.toggle('vn-theme-light', t === 'light');
        panel.classList.remove('vn-closing');
        panel.classList.add('open');
      }
    });
  }

  createFloatingButton();
})();
