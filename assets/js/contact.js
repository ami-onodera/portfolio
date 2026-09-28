/* Email reveal: the address is never written in the HTML, so simple scrapers
   that look for "@" or "mailto:" in the page source don't find it.
   The parts are stored reversed in data attributes and joined on click.

   Two markup shapes are supported:
   - plain: an empty .mail-reveal__out that the pill + Copy button are
     appended into directly (used on the work/earlier-work pages).
   - popup: a .mail-reveal__out that already contains a title bar and a
     .mail-popup__row holding a .mail-reveal__back button (used on the About
     page's little "mail.exe" popup) — the pill is inserted before that row,
     and Copy is inserted into the row, next to Back. */
(function () {
  function rev(s) { return String(s || '').split('').reverse().join(''); }

  document.querySelectorAll('[data-mail-reveal]').forEach(function (box) {
    var btn = box.querySelector('.mail-reveal__btn');
    var out = box.querySelector('.mail-reveal__out');
    var status = box.querySelector('.mail-reveal__status');
    var row = box.querySelector('.mail-popup__row');
    var backBtn = box.querySelector('.mail-reveal__back');
    if (!btn || !out) return;

    function showEmail() {
      if (box.getAttribute('data-revealed') === 'true') return;
      box.setAttribute('data-revealed', 'true');
      var addr = rev(box.getAttribute('data-u')) + '@' + rev(box.getAttribute('data-d'));

      var link = document.createElement('a');
      link.className = 'mail-pill';
      link.href = 'mailto:' + addr;
      link.textContent = addr;

      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn btn--soft mail-reveal__copy';
      copy.textContent = 'Copy';
      copy.addEventListener('click', function () {
        var done = function () {
          copy.textContent = 'Copied';
          if (status) status.textContent = 'Email address copied to clipboard.';
          setTimeout(function () { copy.textContent = 'Copy'; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(done, function () {});
        } else {
          var t = document.createElement('textarea');
          t.value = addr; document.body.appendChild(t); t.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(t);
        }
      });

      if (row) {
        out.insertBefore(link, row);
        row.insertBefore(copy, backBtn || null);
      } else {
        out.appendChild(link);
        out.appendChild(copy);
      }
      out.hidden = false;
      btn.hidden = true;
      btn.style.display = 'none';
      if (status) status.textContent = 'Email address shown.';
      link.focus();
    }

    btn.addEventListener('click', showEmail);

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        var pill = out.querySelector('.mail-pill');
        var copyBtn = out.querySelector('.mail-reveal__copy');
        if (pill) pill.remove();
        if (copyBtn) copyBtn.remove();
        out.hidden = true;
        box.setAttribute('data-revealed', 'false');
        btn.hidden = false;
        btn.style.display = '';
        if (status) status.textContent = '';
        btn.focus();
      });
    }
  });
})();
