/* Minesweeper (simplified): one fixed 8x8 map, so the reset button replays the same board.
   Left click reveals, right click (or F / Shift+click) flags. Hit a mine and the board freezes;
   uncover every safe square and confetti falls. No libraries, nothing stored. */
(function () {
  var MAP = [
    ".*......",
    "........",
    "...*....",
    "......*.",
    "........",
    ".*......",
    "........",
    ".....*.*"
  ];
  var N = MAP.length, M = MAP[0].length;
  var root = document.querySelector('[data-mines]');
  if (!root) return;
  var board = root.querySelector('.mines-board');
  var face = root.querySelector('.mines-face');
  var leftC = root.querySelector('[data-mines-left]');
  var timeC = root.querySelector('[data-mines-time]');
  var base = (root.getAttribute('data-base') || '');
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var FACES = {
    smile: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12.5" fill="#ffe46b" stroke="#25283d" stroke-width="2"/><circle cx="11.5" cy="13" r="1.8" fill="#25283d"/><circle cx="20.5" cy="13" r="1.8" fill="#25283d"/><path d="M9.5 19c1.5 3.5 11.5 3.5 13 0" fill="none" stroke="#25283d" stroke-width="2" stroke-linecap="round"/></svg>',
    ooh:   '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12.5" fill="#ffe46b" stroke="#25283d" stroke-width="2"/><circle cx="11.5" cy="12.5" r="2" fill="#25283d"/><circle cx="20.5" cy="12.5" r="2" fill="#25283d"/><ellipse cx="16" cy="21.5" rx="2.6" ry="3.2" fill="#25283d"/></svg>',
    dead:  '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12.5" fill="#ffe46b" stroke="#25283d" stroke-width="2"/><path d="M8.5 10.5l5 5m0-5l-5 5M18.5 10.5l5 5m0-5l-5 5" stroke="#25283d" stroke-width="2" stroke-linecap="round"/><path d="M10 23c1.5-3.5 10.5-3.5 12 0" fill="none" stroke="#25283d" stroke-width="2" stroke-linecap="round"/></svg>',
    win:   '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12.5" fill="#ffe46b" stroke="#25283d" stroke-width="2"/><path d="M5.5 12h21" stroke="#25283d" stroke-width="2"/><rect x="7" y="11" width="8" height="6" rx="1" fill="#25283d"/><rect x="17" y="11" width="8" height="6" rx="1" fill="#25283d"/><path d="M9.5 21c1.5 3.5 11.5 3.5 13 0" fill="none" stroke="#25283d" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  function setFace(k){ face.innerHTML = FACES[k]; face.setAttribute('data-face', k); }

  var cells, mineCount, state, opened, flags, secs, ticker;
  function pad(n){ n = Math.max(0, Math.min(999, n)); return ('00' + n).slice(-3); }
  function nb(r, c, fn){
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++){
      if (!dr && !dc) continue;
      var rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < M) fn(rr, cc);
    }
  }
  function img(name){ return '<img src="' + base + 'assets/img/y2k/' + name + '.png" alt="" draggable="false">'; }

  function build(){
    clearInterval(ticker);
    board.innerHTML = '';
    cells = []; mineCount = 0; opened = 0; flags = 0; secs = 0; state = 'ready';
    for (var r = 0; r < N; r++){
      cells[r] = [];
      for (var c = 0; c < M; c++){
        var mine = MAP[r][c] === '*';
        if (mine) mineCount++;
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mcell'; b.setAttribute('data-r', r); b.setAttribute('data-c', c);
        b.setAttribute('aria-label', 'Covered square, row ' + (r + 1) + ' column ' + (c + 1));
        board.appendChild(b);
        cells[r][c] = { el: b, mine: mine, n: 0, open: false, flag: false };
      }
    }
    for (r = 0; r < N; r++) for (c = 0; c < M; c++){
      var k = 0; nb(r, c, function(rr, cc){ if (cells[rr][cc].mine) k++; });
      cells[r][c].n = k;
    }
    leftC.textContent = pad(mineCount); timeC.textContent = pad(0);
    setFace('smile');
    root.classList.remove('is-over', 'is-won');
  }

  function startTimer(){
    if (ticker) return;
    ticker = setInterval(function(){ secs++; timeC.textContent = pad(secs); }, 1000);
  }
  function stopTimer(){ clearInterval(ticker); ticker = null; }

  function show(cell){
    cell.open = true; cell.el.classList.add('open'); cell.el.disabled = true;
    if (cell.flag){ cell.flag = false; flags--; leftC.textContent = pad(mineCount - flags); }
    if (cell.n > 0 && !cell.mine){
      cell.el.textContent = cell.n; cell.el.setAttribute('data-n', cell.n);
      cell.el.setAttribute('aria-label', cell.n + ' nearby');
    } else if (!cell.mine) cell.el.setAttribute('aria-label', 'Empty');
  }
  function flood(r, c){
    var stack = [[r, c]];
    while (stack.length){
      var p = stack.pop(), cell = cells[p[0]][p[1]];
      if (cell.open || cell.flag || cell.mine) continue;
      show(cell); opened++;
      if (cell.n === 0) nb(p[0], p[1], function(rr, cc){ if (!cells[rr][cc].open) stack.push([rr, cc]); });
    }
  }

  function lose(r, c){
    state = 'over'; stopTimer(); root.classList.add('is-over'); setFace('dead');
    for (var i = 0; i < N; i++) for (var j = 0; j < M; j++){
      var cell = cells[i][j];
      if (cell.mine){ cell.el.classList.add('open'); cell.el.innerHTML = img('mine'); cell.el.disabled = true; cell.el.setAttribute('aria-label', 'Mine'); }
      else cell.el.disabled = true;
    }
    cells[r][c].el.classList.add('boom');
    if (window.saori && window.saori.say) window.saori.say('Boom. The smiley resets the board.', 6000);
  }
  function win(){
    state = 'over'; stopTimer(); root.classList.add('is-over', 'is-won'); setFace('win');
    for (var i = 0; i < N; i++) for (var j = 0; j < M; j++){
      var cell = cells[i][j];
      if (cell.mine && !cell.flag){ cell.flag = true; cell.el.innerHTML = img('flag'); }
      cell.el.disabled = true;
    }
    leftC.textContent = pad(0);
    if (window.saori && window.saori.say) window.saori.say('You did it! Not a single boom.', 7000);
    confetti();
  }

  function reveal(r, c){
    if (state === 'over') return;
    var cell = cells[r][c];
    if (cell.open || cell.flag) return;
    if (state === 'ready'){ state = 'play'; startTimer(); }
    if (cell.mine){ lose(r, c); return; }
    flood(r, c);
    if (opened === N * M - mineCount) win();
  }
  function toggleFlag(r, c){
    if (state === 'over') return;
    var cell = cells[r][c];
    if (cell.open) return;
    cell.flag = !cell.flag;
    cell.el.innerHTML = cell.flag ? img('flag') : '';
    cell.el.setAttribute('aria-label', cell.flag ? 'Flagged square' : 'Covered square, row ' + (r + 1) + ' column ' + (c + 1));
    flags += cell.flag ? 1 : -1;
    leftC.textContent = pad(mineCount - flags);
  }

  function where(e){
    var b = e.target.closest('.mcell'); if (!b) return null;
    return [+b.getAttribute('data-r'), +b.getAttribute('data-c')];
  }
  board.addEventListener('click', function(e){
    var p = where(e); if (!p) return;
    if (e.shiftKey) toggleFlag(p[0], p[1]); else reveal(p[0], p[1]);
  });
  board.addEventListener('contextmenu', function(e){ e.preventDefault(); var p = where(e); if (p) toggleFlag(p[0], p[1]); });
  board.addEventListener('keydown', function(e){
    if (e.key === 'f' || e.key === 'F'){ var p = where(e); if (p){ e.preventDefault(); toggleFlag(p[0], p[1]); } }
  });
  board.addEventListener('mousedown', function(e){ if (e.button === 0 && state !== 'over' && e.target.closest('.mcell:not(.open)')) setFace('ooh'); });
  document.addEventListener('mouseup', function(){ if (state !== 'over' && face.getAttribute('data-face') === 'ooh') setFace('smile'); });
  face.addEventListener('click', function(){ build(); });

  /* confetti: pastel pieces fall from the top of the screen for a few seconds */
  function confetti(){
    if (REDUCED) return;
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    var W = cv.width = Math.round(innerWidth * dpr), H = cv.height = Math.round(innerHeight * dpr);
    var colors = ['#ef798a', '#74bbc0', '#f4eea9', '#c9a8ff', '#8ab4ff', '#ffb3c7'];
    var parts = [];
    for (var i = 0; i < 170; i++) parts.push({
      x: Math.random() * W, y: -Math.random() * H * 0.9 - 20,
      w: (6 + Math.random() * 8) * dpr, h: (4 + Math.random() * 6) * dpr,
      vx: (Math.random() - 0.5) * 1.6 * dpr, vy: (2 + Math.random() * 3.2) * dpr,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length]
    });
    var t0 = performance.now();
    (function frame(t){
      ctx.clearRect(0, 0, W, H);
      var alive = 0;
      parts.forEach(function(p){
        p.x += p.vx + Math.sin((t + p.y) / 400) * 0.6 * dpr; p.y += p.vy; p.r += p.vr;
        if (p.y < H + 30) alive++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (alive && t - t0 < 7000) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  build();
})();
