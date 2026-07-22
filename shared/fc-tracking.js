/* ============================================================================
   Rastreo — Flow Consulting
   ----------------------------------------------------------------------------
   FUENTE ÚNICA de medición para todos los lead magnets de apps.flowconsulting.co.
   Incluye Meta Pixel + Google Analytics 4. Si cambia algún ID, se cambia AQUÍ
   y aplica a todas las páginas de golpe.

   - Meta Pixel: dataset oficial "Flow Consulting - Oficial" (2594810390937825).
   - GA4: propiedad "Flow Consulting - Web" (G-G85DE4N3X0), cuenta de
     contacto@flowconsulting.co.

   Ambos son los MISMOS que usa flowconsulting.co, para que el tráfico del sitio
   y el de los lead magnets caiga en una sola propiedad y un solo dataset
   (públicos, retargeting y reportes unificados).

   Cómo usarlo en una página nueva: pegar esta línea dentro del <head>
       <script src="/shared/fc-tracking.js" defer></script>
   Ya viene incluida en _template-lm/index.html, así que los lead magnets
   nuevos creados a partir del template lo heredan solos.
   ========================================================================== */
(function () {
  var META_PIXEL_ID = "2594810390937825";
  var GA_MEASUREMENT_ID = "G-G85DE4N3X0";

  /* ---------------------------- Meta Pixel ---------------------------- */
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

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");

  /* ------------------------- Google Analytics 4 ------------------------ */
  var ga = document.createElement("script");
  ga.async = true;
  ga.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(ga);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);
})();
