/* ============================================================================
   Meta Pixel — Flow Consulting
   ----------------------------------------------------------------------------
   FUENTE ÚNICA del tracking para todos los lead magnets de apps.flowconsulting.co.
   Si cambia el pixel, se cambia AQUÍ y aplica a todas las páginas de golpe.

   Dataset oficial: "Flow Consulting - Oficial" (ID 2594810390937825).
   Es el mismo que usa flowconsulting.co y el funnel del webinar en GHL, para
   que todo el tráfico caiga en un solo conjunto de datos (públicos, retargeting
   y optimización unificados).

   Cómo usarlo en una página nueva: pegar esta línea dentro del <head>
       <script src="/shared/fc-pixel.js" defer></script>
   Ya viene incluida en _template-lm/index.html, así que los lead magnets
   nuevos creados a partir del template lo heredan solos.
   ========================================================================== */
(function () {
  var PIXEL_ID = "2594810390937825";

  // Snippet oficial de Meta (carga fbevents.js de forma asíncrona)
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
})();
