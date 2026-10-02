/* Pops the "hire-me.lnk" cards in one after another whenever the cascade scrolls into view
   (see assets/css/cascade.css). Without JavaScript the cards are simply visible. */
(function () {
  var cas = document.querySelector('.contact-cascade');
  if (!cas || !('IntersectionObserver' in window)) return;
  cas.classList.add('js-cascade');
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { cas.classList.toggle('in', e.isIntersecting); });
  }, { threshold: 0.4 }).observe(cas);
})();
