(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function hop(event) {
    var mascot = event.target.closest && event.target.closest('#sl-mas');
    if (!mascot || reduced.matches || mascot.classList.contains('sm-puppy-hop')) return;
    if (event.type === 'keydown') {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
    }
    mascot.classList.add('sm-puppy-hop');
    setTimeout(function () { mascot.classList.remove('sm-puppy-hop'); }, 750);
  }
  document.addEventListener('click', hop);
  document.addEventListener('keydown', hop);
  function visibility() { document.documentElement.classList.toggle('sm-motion-paused', document.hidden); }
  document.addEventListener('visibilitychange', visibility);
  visibility();
})();
