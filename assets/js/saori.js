/* Saori the helper: a small, polite shiba who pops up now and then.
   - idle nudge (no mouse/scroll/key for a while), once per session
   - "welcome back" for returning visitors, once per session
   - click her for a woof
   Dismissible, skipped entirely for prefers-reduced-motion. No dependencies. */
(function(){
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; /* still shows, just without movement */
  var script = document.currentScript;
  if (/[?&]saori-test/.test(location.search) && window.console) console.log('[saori] loaded. reduced motion:', REDUCED);
  var base = script ? script.src.replace(/assets\/js\/saori\.js.*$/, '') : '';
  var IDLE_MS = 45000;      /* second appearance: only if the screen is idle this long */
  var FIRST_MIN = 8000, FIRST_MAX = 12000; /* first appearance on inner pages */
  var HOME_DELAY = 350;    /* on the desktop she is there almost instantly, so even a quick visit sees her */
  var TESTING = /[?&]saori-test/.test(location.search); /* add ?saori-test to the URL: short timers (3s / 8s) and ignores the session limits */
  if (TESTING){ IDLE_MS = 8000; FIRST_MIN = FIRST_MAX = 3000; HOME_DELAY = 350; }

  var path = location.pathname;
  var shared = [
    "Everything\u2019s interactive. Go on, click some buttons!",
    "I didn\u2019t make all these buttons for decoration.",
    "Poke around! Nothing will explode. Probably.",
    "Psst\u2026 have you clicked everything yet?",
    "Yes, you can click that."
  ];
  var contactLine = "Still here? You might as well say hi! Contact info is in the end of the page!";
  var work = ["Still reading? The next project is just a click away.", "Psst. Hire-me window at the bottom. Just saying."];
  var welcomeFirst = "Welcome! Poke around, click things, see what happens!";
  var welcomeBack = [
    "Welcome back! Having fun so far? There\u2019s more to explore.",
    "Here you are again! I knew you\u2019d stick around.",
    "Oh, you\u2019re back! You\u2019re having fun, right? Right?!",
    "Click around and make yourself at home!"
  ];
  var lines = {
    home:  ["Psst. Every window on this desktop opens. Go on, poke around.", "Still there? The Selected work window has the good stuff.", "Good to see you again! Drag stuff around, everything moves!"],
    about: ["Still there? Write me a message in the experience chatbox.", "Try the paint window, it really works!", contactLine].concat(shared),
    selected: work.concat(shared, [contactLine,
      "Psst, have you tried the projects side menu?",
      "That button looks clickable, doesn\u2019t it?",
      "The case studies are VERY detailed. Check them out!",
      "Psst! Have you tried the search bar yet?"]),
    earlier:  work.concat(shared, [contactLine,
      "Still curious? This is not old, it\u2019s vintage!",
      "This isn\u2019t a museum. Touch things."]),
    work:  work.concat(shared, [contactLine]),
    other: shared.concat([contactLine])
  };
  var key = /about/.test(path) ? 'about' : /selected-work/.test(path) ? 'selected' : /earlier-work/.test(path) ? 'earlier' : /\/work\//.test(path) ? 'work' : /(^|\/)(index\.html)?$/.test(path) ? 'home' : 'other';

  function store(kind, k, v){
    if (TESTING && kind === 'sessionStorage') return null;
    try { var s = window[kind]; if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch(e){}
    return null;
  }

  var css = '.saori{position:fixed;right:45px;bottom:55px;z-index:99999;display:flex;align-items:flex-end;gap:8px;pointer-events:none;opacity:0;translate:0 24px;transition:opacity .35s,translate .45s cubic-bezier(.2,1.4,.4,1)}'+
  '.saori.on{opacity:1;translate:0 0;pointer-events:auto}'+
  '.saori__bubble{position:relative;max-width:230px;padding:10px 28px 10px 12px;background:#fff;border:2px solid #25283d;box-shadow:4px 4px 0 rgba(37,40,61,.2);font:600 13px/1.4 "Quicksand",sans-serif;color:#25283d;border-radius:0 !important}'+
  '.saori__bubble::after{content:"";position:absolute;right:-8px;bottom:12px;width:12px;height:12px;background:#fff;border-right:2px solid #25283d;border-top:2px solid #25283d;transform:rotate(45deg)}'+
  '.saori__x{position:absolute;top:2px;right:4px;border:0;background:none;font:700 16px/1 "IBM Plex Mono",monospace;color:#25283d;cursor:pointer;padding:2px 4px}'+
  '.saori__dog{width:64px;height:64px;border:2px solid #25283d;background:#F9F7A1 center/cover no-repeat;cursor:pointer;padding:0;border-radius:50% !important;box-shadow:4px 4px 0 rgba(37,40,61,.2)}'+
  '.saori.on .saori__dog{animation:saoriHop .6s .25s 2}'+
  '.saori__dog.woof{animation:saoriHop .45s 1}'+
  '@keyframes saoriHop{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px) rotate(-6deg)}}'+
  '.saori--home{bottom:165px}@media (max-width:640px){.saori{right:16px;bottom:24px}.saori--home{bottom:24px}.saori__bubble{max-width:170px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  if (REDUCED) st.textContent += '.saori,.saori.on{transition:none;translate:none}.saori.on .saori__dog,.saori__dog.woof{animation:none}';

  var el = document.createElement('div');
  el.className = 'saori'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<div class="saori__bubble"><button class="saori__x" aria-label="Dismiss">x</button><span class="saori__msg"></span></div>'+
                 '<button class="saori__dog" aria-label="Saori, the helper. Click for a woof" type="button"></button>';
  document.body.appendChild(el);
  var dog = el.querySelector('.saori__dog'), msg = el.querySelector('.saori__msg'), bub = el.querySelector('.saori__bubble');
  dog.style.backgroundImage = 'url("' + base + 'assets/img/y2k/shiba.png")';

  var hideT;
  function say(text, ms){
    msg.textContent = text; bub.style.display = '';
    el.classList.add('on');
    clearTimeout(hideT); hideT = setTimeout(hide, ms || 16000);
  }
  function hide(){ el.classList.remove('on'); }
  window.saori = { say: function(text, ms){ say(text, ms); } };
  if (key === 'home') el.classList.add('saori--home'); /* the desktop has the trash icon bottom right: sit above it */
  var dismissed = false; /* only silences Saori for this page view, never for the rest of the visit */
  el.querySelector('.saori__x').addEventListener('click', function(){ hide(); dismissed = true; });
  var woofs = ["Bork", "AwAwooo!", "much click!", "Mlem", "fomfom"], wi = 0;
  dog.addEventListener('click', function(){
    dog.classList.remove('woof'); void dog.offsetWidth; dog.classList.add('woof');
    say(woofs[wi++ % woofs.length], 5000);
  });

  function pick(pool){ return pool[Math.floor(Math.random() * pool.length)]; }
  function off(){ return dismissed; }

  /* 1) first appearance, 20-25s after arriving. On the desktop it is a welcome
        (first visit) or a welcome back (every return to the desktop). Elsewhere
        it comes from that page's own pool, never a welcome back. */
  var firstShown = false, idleTimer, firstTimer, idleDone = false;
  function start(){
    /* runs on every page view, including when the browser restores the page from its
       back/forward cache (Back button), where scripts do not run again by themselves */
    clearTimeout(firstTimer); clearTimeout(idleTimer); clearTimeout(hideT);
    el.classList.remove('on');
    firstShown = false; idleDone = false; dismissed = false;
    firstTimer = setTimeout(function(){
      if (off()) return;
      var text;
      if (key === 'home'){
        if (store('localStorage','saori-seen')) text = pick(welcomeBack);
        else { text = welcomeFirst; store('localStorage','saori-seen','1'); }
      } else text = pick(lines[key] || lines.other);
      say(text, 16000);
      firstShown = true;
      armIdle();
    }, key === 'home' ? HOME_DELAY : FIRST_MIN + Math.random() * (FIRST_MAX - FIRST_MIN));
  }

  /* 2) second appearance: only if the screen then goes idle for 45s, once per page visit */
  function armIdle(){
    clearTimeout(idleTimer);
    if (!firstShown || idleDone || off()) return;
    idleTimer = setTimeout(function(){
      idleDone = true;
      say(pick(lines[key] || lines.other), 16000);
    }, IDLE_MS);
  }
  ['mousemove','scroll','keydown','pointerdown','touchstart'].forEach(function(ev){
    window.addEventListener(ev, armIdle, { passive: true });
  });
  start();
  window.addEventListener('pageshow', function(e){ if (e.persisted) start(); });
})();
