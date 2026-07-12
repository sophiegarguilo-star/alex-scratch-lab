/* Assistant IA d'Alexandre — volet d'aide + micro + FAQ + réglage de la clé API.
   100% côté navigateur. La clé API n'est JAMAIS écrite dans le fichier ni publiée :
   elle est saisie ici et rangée (brouillée) uniquement dans ce navigateur.
   Elle n'est envoyée qu'à l'API d'Anthropic pour obtenir les réponses. */
(function () {
  'use strict';

  // ---------- Réglages techniques ----------
  var API_URL = 'https://api.anthropic.com/v1/messages';
  var SALT = 'Livre-de-Moutons-Alexandre'; // sert juste à brouiller la clé au repos (pas un vrai chiffrement)
  var K_KEY = 'asl_ia_key', K_MODEL = 'asl_ia_model', K_FAQ = 'asl_ia_faq';
  var MODELS = [
    { id: 'claude-haiku-4-5', label: 'Rapide et économique (Haiku)' },
    { id: 'claude-sonnet-5', label: 'Équilibré (Sonnet)' },
    { id: 'claude-opus-4-8', label: 'Le plus malin (Opus)' }
  ];
  var DEFAULT_MODEL = 'claude-opus-4-8';

  // ---------- Rangement de la clé (brouillage léger, pas du plaintext) ----------
  function scramble(s) { var o = ''; for (var i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length)); try { return btoa(o); } catch (e) { return ''; } }
  function unscramble(b) { try { var s = atob(b), o = ''; for (var i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length)); return o; } catch (e) { return ''; } }
  function getKey() { var v = localStorage.getItem(K_KEY); return v ? unscramble(v) : ''; }
  function setKey(k) { if (k) localStorage.setItem(K_KEY, scramble(k)); else localStorage.removeItem(K_KEY); }
  function getModel() { return localStorage.getItem(K_MODEL) || DEFAULT_MODEL; }
  function setModel(m) { localStorage.setItem(K_MODEL, m); }
  function getFaq() { try { return JSON.parse(localStorage.getItem(K_FAQ) || '[]'); } catch (e) { return []; } }
  function saveFaq(a) { localStorage.setItem(K_FAQ, JSON.stringify(a.slice(0, 200))); }

  // ---------- Styles ----------
  var css = '' +
    '#asl-fab{position:fixed;right:18px;bottom:18px;z-index:9000;background:#7b3ff2;color:#fff;border:none;border-radius:30px;padding:12px 18px;font-size:15px;font-weight:bold;box-shadow:0 6px 18px rgba(80,40,160,.35);cursor:pointer;font-family:inherit}' +
    '#asl-fab:hover{background:#6a2fe0}' +
    '#asl-ov{position:fixed;inset:0;background:rgba(20,20,40,.35);z-index:9100;display:none}' +
    '#asl-ov.on{display:block}' +
    '#asl-panel{position:fixed;top:0;right:-460px;width:430px;max-width:92vw;height:100%;background:#fff;z-index:9200;box-shadow:-8px 0 30px rgba(0,0,0,.2);transition:right .28s ease;display:flex;flex-direction:column;font-family:inherit}' +
    '#asl-panel.on{right:0}' +
    '.asl-head{background:#7b3ff2;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}' +
    '.asl-head b{font-size:17px;flex:1}' +
    '.asl-x{background:rgba(255,255,255,.2);border:none;color:#fff;font-size:18px;width:32px;height:32px;border-radius:16px;cursor:pointer}' +
    '.asl-tabs{display:flex;border-bottom:2px solid #eee}' +
    '.asl-tab{flex:1;padding:10px;background:#f6f4fe;border:none;font-size:14px;font-weight:bold;color:#7b3ff2;cursor:pointer;font-family:inherit}' +
    '.asl-tab.on{background:#fff;box-shadow:inset 0 -3px 0 #7b3ff2}' +
    '.asl-body{flex:1;overflow:auto;padding:14px 16px}' +
    '.asl-q{width:100%;box-sizing:border-box;min-height:74px;border:2px solid #d9d2f5;border-radius:12px;padding:10px 12px;font-size:15px;font-family:inherit;resize:vertical}' +
    '.asl-row{display:flex;gap:8px;margin-top:8px}' +
    '.asl-btn{flex:1;background:#7b3ff2;color:#fff;border:none;border-radius:12px;padding:11px;font-size:15px;font-weight:bold;cursor:pointer;font-family:inherit}' +
    '.asl-btn:disabled{opacity:.5;cursor:default}' +
    '.asl-mic{width:52px;flex:0 0 52px;background:#fff;color:#7b3ff2;border:2px solid #7b3ff2;border-radius:12px;font-size:20px;cursor:pointer}' +
    '.asl-mic.rec{background:#ff4d4f;color:#fff;border-color:#ff4d4f;animation:aslpulse 1s infinite}' +
    '@keyframes aslpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}' +
    '.asl-ans{margin-top:14px;background:#f6f4fe;border:1px solid #e2dbf7;border-radius:12px;padding:12px 14px;font-size:15px;line-height:1.5;white-space:pre-wrap;min-height:8px}' +
    '.asl-ans.err{background:#fff0f0;border-color:#ffc4c4;color:#c0392b}' +
    '.asl-note{font-size:12px;color:#7a7a8c;margin-top:10px;line-height:1.4}' +
    '.asl-faqitem{border:1px solid #e6e1f6;border-radius:12px;margin-bottom:10px;overflow:hidden}' +
    '.asl-faqq{background:#f6f4fe;padding:10px 12px;font-weight:bold;font-size:14px;cursor:pointer;color:#4a2aa0;display:flex;gap:8px;align-items:center}' +
    '.asl-faqa{padding:10px 12px;font-size:14px;line-height:1.5;white-space:pre-wrap;display:none}' +
    '.asl-faqa.on{display:block}' +
    '.asl-del{background:none;border:none;color:#b9b3c9;cursor:pointer;font-size:14px}' +
    '.asl-empty{color:#9a94ab;font-size:14px;text-align:center;padding:24px 8px}' +
    '#asl-set{position:fixed;inset:0;z-index:9300;background:rgba(20,20,40,.45);display:none;align-items:center;justify-content:center}' +
    '#asl-set.on{display:flex}' +
    '.asl-card{background:#fff;border-radius:16px;max-width:440px;width:92vw;padding:20px;font-family:inherit;box-shadow:0 20px 50px rgba(0,0,0,.3)}' +
    '.asl-card h3{margin:0 0 4px;color:#4a2aa0}' +
    '.asl-lab{display:block;font-size:13px;font-weight:bold;color:#555;margin:14px 0 4px}' +
    '.asl-in{width:100%;box-sizing:border-box;border:2px solid #d9d2f5;border-radius:10px;padding:9px 11px;font-size:14px;font-family:inherit}' +
    '.asl-set-row{display:flex;gap:8px;margin-top:16px}' +
    '.asl-ghost{background:#f2f0fb;color:#4a2aa0;border:none;border-radius:10px;padding:10px 12px;font-weight:bold;cursor:pointer;font-family:inherit}' +
    '.asl-danger{color:#c0392b;background:#fff0f0}' +
    '@media(prefers-color-scheme:dark){}';

  // ---------- Petites aides DOM ----------
  function el(tag, attrs, html) { var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ---------- Contexte : quelle leçon Alexandre regarde ----------
  function currentContext() {
    var heads = [].slice.call(document.querySelectorAll('h2.chap, .lecon-h'));
    var mid = window.scrollY + window.innerHeight * 0.35, cur = null;
    heads.forEach(function (h) { if (h.getBoundingClientRect().top + window.scrollY <= mid) cur = h; });
    if (!cur) return '';
    var txt = cur.textContent.replace(/\s+/g, ' ').trim(), n = cur.nextElementSibling, grab = '';
    while (n && grab.length < 1400) {
      if (/^H2$/.test(n.tagName)) break;
      if ((n.className || '').indexOf('lecon-h') >= 0) break;
      grab += ' ' + (n.textContent || '');
      n = n.nextElementSibling;
    }
    return ('Leçon affichée : « ' + txt + ' ». Contenu visible : ' + grab.replace(/\s+/g, ' ').trim()).slice(0, 1600);
  }

  // ---------- Appel à l'IA ----------
  function buildSystem() {
    return "Tu es un assistant très gentil et patient qui aide un enfant, Alexandre, à fabriquer son jeu Scratch « Le Livre de Moutons » (on collectionne 36 cartes de moutons dans des boosters). " +
      "Réponds en français, avec des phrases COURTES et SIMPLES, comme à un enfant de 8-10 ans. Sois encourageant. " +
      "Explique les blocs Scratch avec leurs vrais noms (ex : « quand le drapeau vert est cliqué », « répéter … fois », « si … alors »). Donne des étapes claires et numérotées si besoin. " +
      "Reste sur le sujet Scratch et son jeu. Si la question n'a rien à voir ou n'est pas adaptée à un enfant, ramène gentiment vers le jeu. " +
      "TON FORMAT DE RÉPONSE, obligatoirement :\nQUESTION: <réécris sa question de façon claire et bien formulée, en une phrase>\nRÉPONSE: <ta réponse simple et gentille>";
  }

  function ask(question, onDone) {
    var key = getKey();
    if (!key) { onDone({ err: 'Aucune clé API n\'est configurée. Demande à un adulte d\'ouvrir « ⚙️ Réglages (IA) » dans le menu.' }); return; }
    var ctx = currentContext();
    var userMsg = (ctx ? ctx + '\n\n' : '') + 'Question d\'Alexandre : ' + question;
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: getModel(),
        max_tokens: 1024,
        system: buildSystem(),
        messages: [{ role: 'user', content: userMsg }]
      })
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
    }).then(function (res) {
      if (!res.ok) {
        var m = (res.j && res.j.error && res.j.error.message) || ('Erreur ' + res.status);
        if (res.status === 401) m = 'La clé API n\'est pas valide. Vérifie-la dans « ⚙️ Réglages (IA) ».';
        else if (res.status === 429) m = 'Trop de questions d\'un coup, ou crédit épuisé. Réessaie dans un moment.';
        onDone({ err: m }); return;
      }
      if (res.j.stop_reason === 'refusal') { onDone({ err: 'Je préfère ne pas répondre à ça. Pose-moi plutôt une question sur ton jeu 🐑' }); return; }
      var text = '';
      (res.j.content || []).forEach(function (b) { if (b.type === 'text') text += b.text; });
      var mq = text.match(/QUESTION\s*:\s*([\s\S]*?)\n+R[ÉE]PONSE\s*:\s*([\s\S]*)/i);
      var clean = question, answer = text.trim();
      if (mq) { clean = mq[1].trim(); answer = mq[2].trim(); }
      onDone({ question: clean, answer: answer });
    }).catch(function (e) {
      onDone({ err: 'Impossible de contacter l\'assistant. Vérifie la connexion internet. (' + (e && e.message || e) + ')' });
    });
  }

  // ---------- Construction de l'interface ----------
  function build() {
    var style = el('style'); style.textContent = css; document.head.appendChild(style);

    // Bouton flottant
    var fab = el('button', { id: 'asl-fab' }, '🤖 Besoin d\'aide ?');
    document.body.appendChild(fab);

    // Volet
    var ov = el('div', { id: 'asl-ov' });
    var panel = el('div', { id: 'asl-panel' });
    panel.appendChild(el('div', { class: 'asl-head' }, '🤖 <b>Ton assistant</b>')).lastChild;
    var head = panel.firstChild;
    var xbtn = el('button', { class: 'asl-x', 'aria-label': 'Fermer' }, '✕'); head.appendChild(xbtn);
    var gear = el('button', { class: 'asl-x', title: 'Réglages', 'aria-label': 'Réglages' }, '⚙'); head.insertBefore(gear, xbtn);

    var tabs = el('div', { class: 'asl-tabs' });
    var tabQ = el('button', { class: 'asl-tab on' }, '💬 Poser une question');
    var tabF = el('button', { class: 'asl-tab' }, '📒 Mes questions');
    tabs.appendChild(tabQ); tabs.appendChild(tabF); panel.appendChild(tabs);

    var body = el('div', { class: 'asl-body' }); panel.appendChild(body);

    // Vue "poser une question"
    var viewQ = el('div');
    var ta = el('textarea', { class: 'asl-q', placeholder: 'Écris ta question… ou clique sur le micro 🎤 et parle.' });
    var row = el('div', { class: 'asl-row' });
    var micBtn = el('button', { class: 'asl-mic', title: 'Parler', 'aria-label': 'Parler' }, '🎤');
    var askBtn = el('button', { class: 'asl-btn' }, 'Demander');
    row.appendChild(micBtn); row.appendChild(askBtn);
    var ans = el('div', { class: 'asl-ans' }, 'Pose ta question, je t\'explique en douceur 😊');
    viewQ.appendChild(ta); viewQ.appendChild(row); viewQ.appendChild(ans);
    viewQ.appendChild(el('div', { class: 'asl-note' }, 'Tes questions et réponses sont gardées dans « 📒 Mes questions » pour les relire plus tard.'));
    body.appendChild(viewQ);

    // Vue FAQ
    var viewF = el('div', { style: 'display:none' });
    body.appendChild(viewF);

    document.body.appendChild(ov); document.body.appendChild(panel);

    // Fenêtre de réglages
    var setWrap = el('div', { id: 'asl-set' });
    var card = el('div', { class: 'asl-card' });
    card.appendChild(el('h3', null, '⚙️ Réglages de l\'assistant'));
    card.appendChild(el('div', { class: 'asl-note' }, 'La clé API se colle ici. Elle reste <b>dans ce navigateur seulement</b> (jamais dans le fichier, jamais publiée en ligne). Elle sert uniquement à demander les réponses à l\'API d\'Anthropic. À entrer <b>seulement sur l\'ordinateur d\'Alexandre</b>.'));
    card.appendChild(el('label', { class: 'asl-lab' }, 'Clé API'));
    var keyRow = el('div', { class: 'asl-row' });
    var keyIn = el('input', { class: 'asl-in', type: 'password', placeholder: 'sk-ant-...', autocomplete: 'off', spellcheck: 'false' });
    var eye = el('button', { class: 'asl-ghost', type: 'button', title: 'Voir / cacher' }, '👁');
    keyRow.appendChild(keyIn); keyRow.appendChild(eye); keyRow.firstChild.style.flex = '1';
    card.appendChild(keyRow);
    card.appendChild(el('label', { class: 'asl-lab' }, 'Cerveau de l\'assistant'));
    var modelSel = el('select', { class: 'asl-in' });
    MODELS.forEach(function (m) { var o = el('option', { value: m.id }, m.label); modelSel.appendChild(o); });
    card.appendChild(modelSel);
    var setStatus = el('div', { class: 'asl-note' }, '');
    var setRow = el('div', { class: 'asl-set-row' });
    var saveBtn = el('button', { class: 'asl-btn' }, 'Enregistrer');
    var testBtn = el('button', { class: 'asl-ghost' }, 'Tester');
    var delBtn = el('button', { class: 'asl-ghost asl-danger' }, 'Supprimer');
    var closeSet = el('button', { class: 'asl-ghost' }, 'Fermer');
    setRow.appendChild(saveBtn); setRow.appendChild(testBtn); setRow.appendChild(delBtn); setRow.appendChild(closeSet);
    card.appendChild(setStatus); card.appendChild(setRow);
    setWrap.appendChild(card); document.body.appendChild(setWrap);

    // ---------- Comportements ----------
    function openPanel() { ov.classList.add('on'); panel.classList.add('on'); }
    function closePanel() { ov.classList.remove('on'); panel.classList.remove('on'); }
    fab.addEventListener('click', openPanel);
    xbtn.addEventListener('click', closePanel);
    ov.addEventListener('click', closePanel);

    tabQ.addEventListener('click', function () { tabQ.classList.add('on'); tabF.classList.remove('on'); viewQ.style.display = ''; viewF.style.display = 'none'; });
    tabF.addEventListener('click', function () { tabF.classList.add('on'); tabQ.classList.remove('on'); viewF.style.display = ''; viewQ.style.display = 'none'; renderFaq(); });

    // Réglages : ouverture/fermeture
    function openSet() { keyIn.value = getKey(); keyIn.type = 'password'; modelSel.value = getModel(); setStatus.textContent = getKey() ? 'Une clé est déjà enregistrée.' : 'Aucune clé enregistrée pour l\'instant.'; setWrap.classList.add('on'); }
    gear.addEventListener('click', openSet);
    closeSet.addEventListener('click', function () { setWrap.classList.remove('on'); });
    setWrap.addEventListener('click', function (e) { if (e.target === setWrap) setWrap.classList.remove('on'); });
    eye.addEventListener('click', function () { keyIn.type = keyIn.type === 'password' ? 'text' : 'password'; });
    saveBtn.addEventListener('click', function () { setKey(keyIn.value.trim()); setModel(modelSel.value); setStatus.textContent = keyIn.value.trim() ? '✅ Enregistré.' : 'Clé supprimée.'; });
    delBtn.addEventListener('click', function () { setKey(''); keyIn.value = ''; setStatus.textContent = 'Clé supprimée de ce navigateur.'; });
    testBtn.addEventListener('click', function () {
      var k = keyIn.value.trim(); if (!k) { setStatus.textContent = 'Colle d\'abord une clé.'; return; }
      setKey(k); setModel(modelSel.value); setStatus.textContent = '⏳ Test en cours…';
      ask('Dis juste « Bonjour Alexandre » pour tester.', function (r) { setStatus.textContent = r.err ? ('❌ ' + r.err) : '✅ Ça marche ! L\'assistant est prêt.'; });
    });

    // Poser une question
    function doAsk() {
      var q = ta.value.trim(); if (!q) { ta.focus(); return; }
      askBtn.disabled = true; ans.className = 'asl-ans'; ans.textContent = '🐑 L\'assistant réfléchit…';
      ask(q, function (r) {
        askBtn.disabled = false;
        if (r.err) { ans.className = 'asl-ans err'; ans.textContent = r.err; return; }
        ans.className = 'asl-ans'; ans.textContent = r.answer;
        var faq = getFaq(); faq.unshift({ ts: Date.now(), brut: q, question: r.question, reponse: r.answer }); saveFaq(faq);
      });
    }
    askBtn.addEventListener('click', doAsk);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) doAsk(); });

    // Micro (reconnaissance vocale du navigateur)
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micBtn.style.display = 'none'; }
    else {
      var rec = null, recording = false;
      micBtn.addEventListener('click', function () {
        if (recording && rec) { rec.stop(); return; }
        rec = new SR(); rec.lang = 'fr-FR'; rec.interimResults = true; rec.continuous = false;
        var base = ta.value ? ta.value + ' ' : '';
        rec.onstart = function () { recording = true; micBtn.classList.add('rec'); };
        rec.onerror = function (ev) { recording = false; micBtn.classList.remove('rec'); if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') ans.textContent = 'Le micro est bloqué. Autorise-le dans le navigateur, ou écris ta question.'; };
        rec.onend = function () { recording = false; micBtn.classList.remove('rec'); };
        rec.onresult = function (ev) { var t = ''; for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript; ta.value = base + t; };
        try { rec.start(); } catch (e) { /* déjà en cours */ }
      });
    }

    // FAQ
    function renderFaq() {
      var faq = getFaq(); viewF.innerHTML = '';
      if (!faq.length) { viewF.appendChild(el('div', { class: 'asl-empty' }, 'Tu n\'as pas encore posé de question.<br>Va dans « 💬 Poser une question » 🙂')); return; }
      faq.forEach(function (item, idx) {
        var wrap = el('div', { class: 'asl-faqitem' });
        var q = el('div', { class: 'asl-faqq' }, '<span style="flex:1">❓ ' + esc(item.question || item.brut) + '</span>');
        var del = el('button', { class: 'asl-del', title: 'Supprimer' }, '🗑'); q.appendChild(del);
        var a = el('div', { class: 'asl-faqa' }, esc(item.reponse));
        q.addEventListener('click', function (e) { if (e.target === del) return; a.classList.toggle('on'); });
        del.addEventListener('click', function () { var f = getFaq(); f.splice(idx, 1); saveFaq(f); renderFaq(); });
        wrap.appendChild(q); wrap.appendChild(a); viewF.appendChild(wrap);
      });
    }

    // Entrée « Réglages (IA) » dans le sommaire
    var list = document.getElementById('menuList');
    if (list) {
      var link = el('a', { href: '#', class: 'm-chap' }, '⚙️ Réglages (IA)');
      link.addEventListener('click', function (e) { e.preventDefault(); openSet(); });
      list.insertBefore(link, list.firstChild);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
