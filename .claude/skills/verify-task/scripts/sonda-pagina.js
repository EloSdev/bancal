() => {
  // Sonda de verificación: pega TODO este fichero como `function` de
  // browser_evaluate (Playwright) o evaluate_script (chrome-devtools).
  // Devuelve medidas, no opiniones: desbordamiento, contraste WCAG real,
  // encabezados, imágenes, objetivos táctiles y animaciones activas.

  // Cualquier color CSS (también oklch, que es lo que da Tailwind v4) → RGBA
  // dibujándolo en un canvas de 1 px.
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 1;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  const aRGBA = (color) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  };
  const mezcla = (arriba, abajo) => ({
    r: arriba.r * arriba.a + abajo.r * (1 - arriba.a),
    g: arriba.g * arriba.a + abajo.g * (1 - arriba.a),
    b: arriba.b * arriba.a + abajo.b * (1 - arriba.a),
    a: 1,
  });
  const lum = ({ r, g, b }) => {
    const c = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const hex = ({ r, g, b }) =>
    "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const nombre = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    const cls = [...el.classList].slice(0, 3);
    if (cls.length) s += "." + cls.join(".");
    return s;
  };
  const texto = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    return el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
  };

  // Fondo efectivo: sube por los ancestros componiendo los colores con alfa.
  // Si encuentra una imagen o degradado, no se puede medir: va a "revisar".
  const fondo = (el) => {
    const capas = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none") return { conImagen: true, de: nombre(n) };
      const c = aRGBA(cs.backgroundColor);
      if (c.a > 0) capas.push(c);
      if (c.a >= 1) break;
    }
    let f = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = capas.length - 1; i >= 0; i--) f = mezcla(capas[i], f);
    return { color: f };
  };

  // ---- Desbordamiento horizontal ----
  const ancho = window.innerWidth;
  const csHtml = getComputedStyle(document.documentElement);
  const csBody = getComputedStyle(document.body);
  const tapado = [csHtml.overflowX, csBody.overflowX].some((v) => v === "hidden" || v === "clip");
  const sale = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.right > ancho + 1 || r.left < -1);
  };
  const culpables = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (!sale(el) || (el.parentElement && sale(el.parentElement))) continue;
    // Dentro de un carrusel con scroll propio es intencionado.
    let enScroll = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== "visible") { enScroll = true; break; }
    }
    if (enScroll) continue;
    const r = el.getBoundingClientRect();
    culpables.push({ el: nombre(el), izquierda: Math.round(r.left), derecha: Math.round(r.right) });
    if (culpables.length >= 8) break;
  }

  // ---- Contraste de cada texto visible ----
  const conTexto = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.textContent.trim() && n.parentElement && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(n.parentElement.tagName))
      conTexto.add(n.parentElement);
  }
  const fallosContraste = [], revisarContraste = [];
  let revisados = 0;
  for (const el of conTexto) {
    if (!visible(el)) continue;
    revisados++;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const grande = fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700);
    const minimo = grande ? 3 : 4.5;
    const fo = fondo(el);
    if (fo.conImagen) {
      if (revisarContraste.length < 10) revisarContraste.push({ el: nombre(el), texto: texto(el), fondoCon: fo.de });
      continue;
    }
    const tc = mezcla(aRGBA(cs.color), fo.color);
    const r = ratio(tc, fo.color);
    if (r < minimo && fallosContraste.length < 25)
      fallosContraste.push({ el: nombre(el), texto: texto(el), ratio: +r.toFixed(2), minimo, color: hex(tc), fondo: hex(fo.color) });
  }

  // ---- Encabezados ----
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({ n: +h.tagName[1], texto: texto(h) }));
  const saltos = hs.filter((h, i) => h.n > (i ? hs[i - 1].n : 0) + 1).map((h) => `h${h.n}: ${h.texto}`);

  // ---- Imágenes ----
  const imgs = [...document.images];
  const sinAlt = imgs.filter((i) => !i.hasAttribute("alt")).map((i) => i.currentSrc || i.src);
  const rotas = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
  const deformadas = imgs
    .filter((i) => i.naturalWidth && visible(i) && getComputedStyle(i).objectFit === "fill")
    .filter((i) => {
      const r = i.getBoundingClientRect();
      return Math.abs(r.width / r.height - i.naturalWidth / i.naturalHeight) > 0.03;
    })
    .map((i) => i.currentSrc || i.src);

  // ---- Interactivos: nombre accesible y tamaño para el dedo ----
  const interactivos = [...document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[tabindex]:not([tabindex='-1'])")].filter(visible);
  const sinNombre = interactivos
    .filter((el) => {
      if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title) return false;
      if (texto(el)) return false;
      if (el.querySelector("img[alt]:not([alt=''])")) return false;
      if (el.labels && el.labels.length) return false;
      return true;
    })
    .map(nombre)
    .slice(0, 10);
  const pequenos = interactivos
    .filter((el) => !(el.tagName === "A" && el.closest("p")))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width < 24 || r.height < 24;
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { el: nombre(el), texto: texto(el), tam: `${Math.round(r.width)}×${Math.round(r.height)}` };
    })
    .slice(0, 10);

  // ---- Animaciones en marcha (con reduced-motion emulado debería ser []) ----
  const animaciones = document.getAnimations()
    .filter((a) => a.playState === "running")
    .map((a) => `${a.animationName || a.transitionProperty || "anim"} en ${a.effect?.target ? nombre(a.effect.target) : "?"}`)
    .slice(0, 10);

  return {
    url: location.href,
    titulo: document.title,
    viewport: `${ancho}×${window.innerHeight}`,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    desbordamiento: {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: ancho,
      hayScrollHorizontal: document.documentElement.scrollWidth > ancho,
      tapadoConOverflowHidden: tapado,
      culpables,
    },
    contraste: { textosRevisados: revisados, fallos: fallosContraste, revisarAMano: revisarContraste },
    encabezados: { h1: hs.filter((h) => h.n === 1).length, saltos, lista: hs.slice(0, 30) },
    imagenes: { total: imgs.length, sinAlt, rotas, deformadas },
    interactivos: { total: interactivos.length, sinNombre, pequenos },
    animacionesEnMarcha: animaciones,
  };
}
