/* TH/EN switch shared by every page.
   Static text: pair <span class="th">…</span><span class="en">…</span> (CSS hides the other language).
   Attributes: data-en-aria-label / data-en-title / data-en-placeholder hold the English value.
   Scripts: I18N.lang, I18N.t(th, en), and window event "langchange". Load in <head>. */
(function(){
  var KEY = 'agrisim.lang', root = document.documentElement, lang = 'th';
  try { lang = localStorage.getItem(KEY) || 'th' } catch (e) {}
  try { var q = new URLSearchParams(location.search).get('lang'); if (q === 'en' || q === 'th') lang = q } catch (e) {}
  root.setAttribute('data-lang', lang); root.lang = lang;
  var ATTRS = ['aria-label', 'title', 'placeholder'], thTitle = null;

  function swapAttrs(l){
    ATTRS.forEach(function(a){
      document.querySelectorAll('[data-en-' + a + ']').forEach(function(el){
        if (!el.hasAttribute('data-th-' + a)) el.setAttribute('data-th-' + a, el.getAttribute(a) || '');
        el.setAttribute(a, el.getAttribute(l === 'en' ? 'data-en-' + a : 'data-th-' + a));
      });
    });
    var m = document.querySelector('meta[name="title-en"]');
    if (m){ if (thTitle === null) thTitle = document.title; document.title = l === 'en' ? m.content : thTitle }
  }
  function set(l, silent){
    lang = l === 'en' ? 'en' : 'th';
    root.setAttribute('data-lang', lang); root.lang = lang;
    try { localStorage.setItem(KEY, lang) } catch (e) {}
    document.querySelectorAll('[data-lang-btn]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-btn') === lang)) });
    swapAttrs(lang);
    if (!silent) window.dispatchEvent(new CustomEvent('langchange', {detail: lang}));
  }
  window.I18N = {
    get lang(){ return lang },
    t: function(th, en){ return lang === 'en' ? en : th },
    set: set
  };
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('[data-lang-btn]').forEach(function(b){
      b.addEventListener('click', function(){ if (b.getAttribute('data-lang-btn') !== lang) set(b.getAttribute('data-lang-btn')) });
    });
    set(lang, true);
    var cur = document.querySelector('.mainnav .nv[aria-current="page"]');
    if (cur && cur.parentElement.scrollWidth > cur.parentElement.clientWidth) cur.parentElement.scrollLeft = cur.offsetLeft - 16;
  });
})();
