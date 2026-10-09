/* Pops the "hire-me.lnk" cards in one after another whenever the cascade scrolls into view
   (see assets/css/cascade.css). Without JavaScript the cards are simply visible.
   Also: a click anywhere on the contact.tmp window nudges the alert (shake + title-bar blink),
   because the headline says "click" and the real button is on the alert. */
(function () {
  var cas = document.querySelector('.contact-cascade');
  if (!cas) return;

  var tmp = document.querySelector('.contact-tmp');
  var front = cas.querySelector('.cascade-front:not(.cascade-clone)');
  if (tmp && front) {
    var timer;
    tmp.addEventListener('click', function () {
      front.classList.remove('nudge');
      void front.offsetWidth; // restart the animation on repeat clicks
      front.classList.add('nudge');
      clearTimeout(timer);
      timer = setTimeout(function () { front.classList.remove('nudge'); }, 800);
    });
  }

  if (!('IntersectionObserver' in window)) return;
  cas.classList.add('js-cascade');
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { cas.classList.toggle('in', e.isIntersecting); });
  }, { threshold: 0.4 }).observe(cas);
})();
