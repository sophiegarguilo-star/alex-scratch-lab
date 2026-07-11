/* Menu de leçons + vérificateur de .sb3 — Alex Scratch Lab (tout côté navigateur) */
(function () {
  // ---------- Menu (sommaire) ----------
  var heads = [].slice.call(document.querySelectorAll('h2.chap, .lecon-h'));
  var list = document.getElementById('menuList');
  if (list) {
    heads.forEach(function (h, i) {
      if (!h.id) h.id = 'sec' + i;
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.replace(/\s+/g, ' ').trim();
      a.className = h.classList.contains('lecon-h') ? 'm-lecon' : 'm-chap';
      list.appendChild(a);
    });
    var menu = document.getElementById('menu');
    var ov = document.getElementById('menuOverlay');
    var btn = document.getElementById('menuBtn');
    function toggle(open) { menu.classList.toggle('open', open); ov.classList.toggle('open', open); }
    if (btn) btn.addEventListener('click', function () { toggle(!menu.classList.contains('open')); });
    if (ov) ov.addEventListener('click', function () { toggle(false); });
    list.addEventListener('click', function (e) { if (e.target.tagName === 'A' && window.innerWidth < 1200) toggle(false); });
  }

  // ---------- Vérificateur de .sb3 ----------
  var input = document.getElementById('sb3input');
  if (!input) return;
  var drop = document.getElementById('verifdrop');
  var vbtn = document.getElementById('verifBtn');
  var out = document.getElementById('verifResult');

  vbtn.addEventListener('click', function () { input.click(); });
  input.addEventListener('change', function () { if (input.files[0]) handle(input.files[0]); });
  ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('drag'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f) handle(f); });

  var CHECKS = [
    { sec: 'Préparation du projet', items: [
      { t: 'Le sprite « Carte »', f: function (a) { return a.sprites['Carte']; } },
      { t: 'Variables « dé » et « carte »', f: function (a) { return a.vars['dé'] && a.vars['carte']; } },
      { t: 'Listes noms / possede / niveau', f: function (a) { return a.lists['noms'] && a.lists['possede'] && a.lists['niveau']; } },
      { t: 'Liste « noms » = 36 lignes', f: function (a) { return a.lists['noms'] && a.lists['noms'].length === 36; } },
      { t: 'Les 7 listes de rareté', f: function (a) { return ['communes', 'rares', 'epiques', 'legendaires', 'dorees', 'diamants', 'arcs'].every(function (n) { return a.lists[n]; }); } },
      { t: 'communes = 12 · rares = 8 · arcs = 1', f: function (a) { return a.lists['communes'] && a.lists['communes'].length === 12 && a.lists['rares'] && a.lists['rares'].length === 8 && a.lists['arcs'] && a.lists['arcs'].length === 1; } }
    ]},
    { sec: 'Leçon 2 — le dé', items: [
      { t: 'Bloc « nombre aléatoire »', f: function (a) { return a.opcodes['operator_random']; } }
    ]},
    { sec: 'Leçon 3 — tirer une carte', items: [
      { t: 'Bloc perso « tirer une carte »', f: function (a) { return a.proccodes['tirer une carte']; } },
      { t: "L'escalier de « si … sinon »", f: function (a) { return a.opcodes['control_if_else']; } },
      { t: 'Comparaison « inférieur à »', f: function (a) { return a.opcodes['operator_lt']; } }
    ]},
    { sec: 'Leçon 4 — nouvelle / double', items: [
      { t: 'Remplacer un élément de liste', f: function (a) { return a.opcodes['data_replaceitemoflist']; } },
      { t: 'Bloc « regrouper »', f: function (a) { return a.opcodes['operator_join']; } }
    ]},
    { sec: 'Leçon 5 — le booster', items: [
      { t: '« quand ce sprite est cliqué »', f: function (a) { return a.opcodes['event_whenthisspriteclicked']; } },
      { t: 'Boucle « répéter … fois »', f: function (a) { return a.opcodes['control_repeat']; } }
    ]},
    { sec: 'Avancé — le Paquet', items: [
      { t: 'Le sprite « Paquet »', f: function (a) { return a.sprites['Paquet']; } },
      { t: 'Jouer un son', f: function (a) { return a.opcodes['sound_play']; } }
    ]},
    { sec: 'Avancé — la révélation', items: [
      { t: 'Glissement (« glisser en … »)', f: function (a) { return a.opcodes['motion_glidesecstoxy']; } }
    ]},
    { sec: "Avancé — l'album à pages", items: [
      { t: 'Le sprite « Slot »', f: function (a) { return a.sprites['Slot']; } },
      { t: 'Créer un clone', f: function (a) { return a.opcodes['control_create_clone_of']; } },
      { t: '« quand je commence comme un clone »', f: function (a) { return a.opcodes['control_start_as_clone']; } }
    ]},
    { sec: 'Avancé — les autres lutins', items: [
      { t: 'Sprite « Niveau » (badges)', f: function (a) { return a.sprites['Niveau']; } },
      { t: 'Sprite « Reserve »', f: function (a) { return a.sprites['Reserve']; } },
      { t: 'Boutons « Booster » et « Album »', f: function (a) { return a.sprites['Booster'] && a.sprites['Album']; } },
      { t: 'Flèches « Prec » et « Suiv »', f: function (a) { return a.sprites['Prec'] && a.sprites['Suiv']; } }
    ]}
  ];

  function analyze(p) {
    var vars = {}, lists = {}, sprites = {}, opcodes = {}, proccodes = {};
    (p.targets || []).forEach(function (t) {
      if (!t.isStage) sprites[t.name] = 1;
      var v = t.variables || {}; for (var id in v) vars[v[id][0]] = 1;
      var l = t.lists || {}; for (var id2 in l) lists[l[id2][0]] = l[id2][1];
      var b = t.blocks || {};
      for (var bid in b) { var bl = b[bid]; if (bl && bl.opcode) { opcodes[bl.opcode] = 1; if (bl.mutation && bl.mutation.proccode) proccodes[bl.mutation.proccode] = 1; } }
    });
    return { vars: vars, lists: lists, sprites: sprites, opcodes: opcodes, proccodes: proccodes };
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function render(a) {
    var total = 0, ok = 0, html = '';
    CHECKS.forEach(function (sec) {
      html += '<div class="vr-sec"><h4>' + esc(sec.sec) + '</h4>';
      sec.items.forEach(function (it) {
        total++; var pass = false; try { pass = !!it.f(a); } catch (e) {}
        if (pass) ok++;
        html += '<div class="vr-item ' + (pass ? 'vr-ok' : 'vr-no') + '"><span>' + (pass ? '✅' : '❌') + '</span><span>' + esc(it.t) + '</span></div>';
      });
      html += '</div>';
    });
    var cls = ok === total ? 'ok' : (ok >= total * 0.5 ? 'mid' : 'low');
    var msg = ok === total ? ' 🎉 Bravo, tout y est !' : (ok === 0 ? ' — on dirait un projet tout neuf, continue les leçons !' : ' — continue, tu avances bien !');
    out.innerHTML = '<div class="vr-score ' + cls + '">' + ok + ' / ' + total + ' vérifications réussies' + msg + '</div>' + html;
  }

  function handle(file) {
    out.innerHTML = '<p>⏳ Lecture de « ' + esc(file.name) + ' »…</p>';
    var reader = file.arrayBuffer ? file.arrayBuffer() : new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsArrayBuffer(file); });
    reader.then(function (buf) { return JSZip.loadAsync(buf); })
      .then(function (zip) { var pj = zip.file('project.json'); if (!pj) throw new Error('no project.json'); return pj.async('string'); })
      .then(function (txt) { render(analyze(JSON.parse(txt))); })
      .catch(function (e) {
        out.innerHTML = '<div class="vr-err">😕 Je n\'ai pas pu lire ce fichier. Vérifie que c\'est bien un fichier <b>.sb3</b> exporté depuis Scratch (Fichier → « Enregistrer sur votre ordinateur »).</div>';
      });
  }
})();
