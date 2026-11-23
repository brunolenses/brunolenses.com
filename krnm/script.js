"use strict";

(() => {
  const WHATSAPP = "5511914962846";
  const wa = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  // The KRNM Skins collection. Each entry = one camera on the belt and one
  // detail card below. `img` is a real product photo (Sony bodies recoloured
  // per finish), so the imagery is photographic, not illustrated.
  const skins = [
    { name: "Obsidian Black", code: "03", desc: "Preto absoluto fosco. Discrição total, acabamento stealth.", img: "assets/cam/01-obsidian.jpg" },
    { name: "Carbon Fiber",   code: "06", desc: "Trama real de fibra de carbono. Técnico, leve e marcante.", img: "assets/cam/02-carbon.jpg" },
    { name: "Military Green",  code: "04", desc: "Verde militar fosco. Presença tática e sóbria.", img: "assets/cam/03-military.jpg" },
    { name: "Satin Nebula Purple", code: "★", desc: "Roxo acetinado com brilho nebular. Edição especial.", img: "assets/cam/04-nebula.jpg" },
    { name: "Stealth Grey",    code: "05", desc: "Grafite metálico. Sóbrio, moderno e elegante.", img: "assets/cam/05-stealth.jpg" },
    { name: "Brushed Black",   code: "02", desc: "Metal escovado escuro. Textura viva e premium.", img: "assets/cam/06-brushed.jpg" },
    { name: "Gold",            code: "07", desc: "Dourado escovado. Luxo sob medida para o seu setup.", img: "assets/cam/07-gold.jpg" },
    { name: "Deep Blue",       code: "08", desc: "Azul aço escovado. Profundo, limpo e único.", img: "assets/cam/08-blue.jpg" },
    { name: "Retro",           code: "01", desc: "Textura granulada atemporal. Clássico e autêntico.", img: "assets/cam/09-retro.jpg" },
    { name: "Kusher",          code: "09", desc: "Microtextura emborrachada. Grip total e discreto.", img: "assets/cam/10-kusher.jpg" },
  ];

  const projects = skins.map((skin, index) => ({
    order: index,
    id: skin.code,
    title: skin.name,
    url: wa(`Olá! Tenho interesse na skin ${skin.name} da KRNM. Pode me passar mais informações?`),
    skin,
  }));

  const heroEl = document.getElementById("hero");
  const heroSticky = document.querySelector(".hero-sticky");
  const belt = document.getElementById("belt");
  const status = document.querySelector(".status");
  const grid = document.getElementById("catalog-grid");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const canvas = document.createElement("canvas");
  canvas.className = "conveyor";
  canvas.setAttribute("aria-hidden", "true");
  belt.appendChild(canvas);

  const noise = createNoise(document.querySelector(".noise"));

  const motion = {
    offset: 0, targetOffset: 0, present: 0, targetPresent: 0,
    pointerX: 0, pointerY: 0, parallaxX: 0, parallaxY: 0,
  };
  let conveyor = null;
  let cards = [];
  let previousTime = 0;
  let animationFrame = 0;

  function message(text) {
    status.textContent = text;
    status.hidden = !text;
  }

  function fallback(reason) {
    conveyor = null;
    belt.classList.add("is-hidden");
    message("A visualização 3D não está disponível — role para ver a coleção abaixo.");
    console.warn("KRNM belt:", reason);
  }

  // Detail sections below the hero: each camera, two per row.
  function buildCatalog() {
    const fragment = document.createDocumentFragment();
    for (const project of projects) {
      const s = project.skin;
      const article = document.createElement("article");
      article.className = "cam";
      const collection = s.code === "★" ? "Edição especial · Coleção KRNM" : `Textura ${s.code} · Coleção Standard`;
      article.innerHTML = `
        <div class="cam-media"><img src="${s.img}" alt="Câmera Sony com skin KRNM ${s.name}" loading="lazy"></div>
        <div class="cam-info">
          <p class="eyebrow">${collection}</p>
          <h3>${s.name}</h3>
          <p class="desc">${s.desc}</p>
          <a class="btn ghost" href="${project.url}" target="_blank" rel="noopener noreferrer">Quero esta skin&nbsp;→</a>
        </div>`;
      fragment.appendChild(article);
    }
    grid.appendChild(fragment);
  }

  function loadImage(src) {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  async function buildCards() {
    try { await document.fonts.ready; } catch (e) { /* fonts optional */ }
    if (!heroSticky.querySelector(".brandmark")) {
      const brandmark = document.createElement("img");
      brandmark.className = "brandmark";
      brandmark.setAttribute("aria-hidden", "true");
      brandmark.src = getSkull().toDataURL("image/png");
      heroSticky.insertBefore(brandmark, belt);
    }
    const photos = await Promise.all(projects.map(project => loadImage(project.skin.img)));
    cards = projects.map((project, index) => makeCard(project.skin, photos[index]));
  }

  // The belt is driven by scroll position within the tall hero: scrolling
  // down advances through all 10 cameras; past the hero, the page flows on.
  function onScroll() {
    const total = Math.max(1, heroEl.offsetHeight - innerHeight);
    const scrolled = Math.min(Math.max(-heroEl.getBoundingClientRect().top, 0), total);
    const p = scrolled / total;
    motion.targetOffset = p * projects.length;
    // Keep the belt in its "conveyor" look (several cameras visible, tilted)
    // while it advances, rather than zooming fully onto one.
    motion.targetPresent = Math.min(0.58, p / 0.05 * 0.58);
    if (reducedMotion.matches) { motion.offset = motion.targetOffset; motion.present = motion.targetPresent; }
    document.body.classList.toggle("scrolled", p > 0.01);
  }

  function render(time) {
    const frames = previousTime ? Math.min((time - previousTime) / (1000 / 60), 3) : 1;
    previousTime = time;
    const k = reducedMotion.matches ? 1 : 1 - Math.pow(0.80, frames);
    motion.offset += (motion.targetOffset - motion.offset) * k;
    motion.present += (motion.targetPresent - motion.present) * k;
    const kp = reducedMotion.matches ? 0 : 1 - Math.pow(0.90, frames);
    motion.parallaxX += (motion.pointerX - motion.parallaxX) * kp;
    motion.parallaxY += (motion.pointerY - motion.parallaxY) * kp;
    noise.draw(reducedMotion.matches ? 0 : time);
    conveyor?.draw(motion);
    animationFrame = requestAnimationFrame(render);
  }

  function resize() {
    noise.resize();
    conveyor?.resize(innerWidth, innerHeight);
    onScroll();
  }

  belt.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse") return;
    motion.pointerX = event.clientX / innerWidth * 2 - 1;
    motion.pointerY = event.clientY / innerHeight * 2 - 1;
    if (conveyor) {
      const slot = conveyor.pick(event.clientX, event.clientY, motion);
      canvas.style.cursor = slot >= 0 ? "pointer" : "";
    }
  });
  belt.addEventListener("pointerleave", () => {
    motion.pointerX = motion.pointerY = 0;
    canvas.style.cursor = "";
  });
  belt.addEventListener("click", event => {
    if (!conveyor || event.target.closest("a")) return;
    const slot = conveyor.pick(event.clientX, event.clientY, motion);
    if (slot >= 0) window.open(projects[slot].url, "_blank", "noopener,noreferrer");
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(animationFrame);
    previousTime = 0;
    if (!document.hidden) animationFrame = requestAnimationFrame(render);
  });
  canvas.addEventListener("webglcontextlost", event => { event.preventDefault(); fallback("Contexto WebGL perdido."); });
  canvas.addEventListener("webglcontextrestored", initialize);

  async function initialize() {
    if (!cards.length) await buildCards();
    try {
      conveyor = createConveyor(canvas, cards, projects);
      belt.classList.remove("is-hidden");
      message("");
      resize();
    } catch (error) { fallback(error.message); }
  }

  buildCatalog();
  resize();
  animationFrame = requestAnimationFrame(render);
  initialize();
})();

/* ------------------------------------------------------------------ *
 * Card artwork: a real product photo (4:3 on black) with a light      *
 * KRNM branding overlay. One per colorway, drawn onto the belt.        *
 * ------------------------------------------------------------------ */

function makeCard(skin, photo) {
  const W = 1200, H = 900;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#050606";
  ctx.fillRect(0, 0, W, H);
  if (photo) ctx.drawImage(photo, 0, 0, W, H);

  // Legibility gradients (top for the eyebrow, bottom for the name block).
  const top = ctx.createLinearGradient(0, 0, 0, 230);
  top.addColorStop(0, "rgba(5,6,8,.7)");
  top.addColorStop(1, "rgba(5,6,8,0)");
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, 230);
  const bottom = ctx.createLinearGradient(0, H - 320, 0, H);
  bottom.addColorStop(0, "rgba(5,6,8,0)");
  bottom.addColorStop(1, "rgba(5,6,8,.92)");
  ctx.fillStyle = bottom; ctx.fillRect(0, H - 320, W, 320);

  const gold = "#b7a47a";
  const x = 78;

  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.font = "500 24px Inter, Arial, sans-serif";
  spacedText(ctx, "KRNM SKINS", x, 76, 6);

  ctx.fillStyle = "#ffffff";
  ctx.font = "200 72px Inter, Arial, sans-serif";
  const lines = wrapText(ctx, skin.name.toUpperCase(), 620);
  const nameBottom = H - 150;
  let y = nameBottom - (lines.length - 1) * 74;
  for (const line of lines) { ctx.fillText(line, x, y); y += 74; }

  ctx.fillStyle = gold;
  ctx.font = "500 24px Inter, Arial, sans-serif";
  const label = skin.code === "★" ? "EDIÇÃO ESPECIAL · COLEÇÃO KRNM" : `TEXTURA ${skin.code} · COLEÇÃO STANDARD`;
  spacedText(ctx, label, x, nameBottom + 40, 3);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.font = "400 23px Inter, Arial, sans-serif";
  ctx.fillText("@krnmskins", W - 78, H - 94);
  ctx.fillStyle = gold;
  ctx.fillText("sob medida 🇧🇷", W - 78, H - 62);
  ctx.textAlign = "left";

  return c;
}

function spacedText(ctx, text, x, y, spacing) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// The KRNM mark: a skull built from fingerprint-style concentric ridges,
// used as the faint watermark behind the belt.
let _skull = null;
function getSkull() {
  if (_skull) return _skull;
  const w = 760, h = 900;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.translate(w / 2, h * 0.47);
  ctx.scale(Math.min(w / 360, h / 440), Math.min(w / 360, h / 440));

  const body = new Path2D();
  body.ellipse(0, -30, 150, 158, 0, 0, Math.PI * 2);
  body.ellipse(0, 92, 106, 122, 0, 0, Math.PI * 2);

  ctx.save();
  ctx.clip(body);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.1;
  for (let r = 10; r < 300; r += 7) {
    ctx.beginPath();
    ctx.ellipse(0, -8, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "destination-out";
  const feat = new Path2D();
  feat.ellipse(-62, -26, 52, 46, -0.1, 0, Math.PI * 2);
  feat.ellipse(62, -26, 52, 46, 0.1, 0, Math.PI * 2);
  feat.moveTo(0, 12); feat.lineTo(-24, 64); feat.lineTo(24, 64); feat.closePath();
  for (let i = -2; i <= 2; i++) feat.rect(i * 27 - 7, 116, 14, 54);
  ctx.fillStyle = "#000";
  ctx.fill(feat);
  ctx.restore();

  _skull = c;
  return c;
}

/* ------------------------------------------------------------------ *
 * WebGL conveyor belt + film-grain renderer.                           *
 * ------------------------------------------------------------------ */

function wrap(value, period) {
  return ((value % period) + period) % period;
}

function conveyorPoint(t) {
  const half = 2.9, radius = 1.02, straight = half * 2, arc = Math.PI * radius;
  let distance = wrap(t, 1) * (straight * 2 + arc * 2);
  if (distance < straight) return { y: -half + distance, z: radius, ny: 0, nz: 1 };
  distance -= straight;
  if (distance < arc) {
    const angle = Math.PI / 2 - distance / radius;
    return { y: half + Math.cos(angle) * radius, z: Math.sin(angle) * radius, ny: Math.cos(angle), nz: Math.sin(angle) };
  }
  distance -= arc;
  if (distance < straight) return { y: half - distance, z: -radius, ny: 0, nz: -1 };
  distance -= straight;
  const angle = -Math.PI / 2 - distance / radius;
  return { y: -half + Math.cos(angle) * radius, z: Math.sin(angle) * radius, ny: Math.cos(angle), nz: Math.sin(angle) };
}

function buildConveyorGeometry(count, segments = 256) {
  const width = (11.6 + Math.PI * 2.04) / count * 4 / 3;
  const vertices = new Float32Array((segments + 1) * 2 * 7);
  const indices = new Uint16Array(segments * 6);
  for (let i = 0; i <= segments; i++) {
    const point = conveyorPoint(i / segments);
    for (let side = 0; side < 2; side++) {
      vertices.set([(side - .5) * width, point.y, point.z, side, i / segments, point.ny, point.nz], (i * 2 + side) * 7);
    }
    if (i < segments) {
      const a = i * 2;
      indices.set([a, a + 2, a + 1, a + 1, a + 2, a + 3], i * 6);
    }
  }
  return { vertices, indices };
}

function createConveyor(canvas, images, projects) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) throw new Error("WebGL is unavailable.");
  const vertexSource = `
    attribute vec3 position;
    attribute vec2 uv;
    attribute vec2 normalYZ;
    uniform vec3 rotation, rig, camera, target;
    uniform vec3 translation;
    uniform float aspect;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition, vView, vLight;
    vec3 rotate(vec3 p, vec3 r) {
      vec3 c = cos(r), s = sin(r);
      p.xy = mat2(c.z, s.z, -s.z, c.z) * p.xy;
      p.xz = mat2(c.y, -s.y, s.y, c.y) * p.xz;
      p.yz = mat2(c.x, s.x, -s.x, c.x) * p.yz;
      return p;
    }
    vec3 unrotate(vec3 p, vec3 r) {
      vec3 c = cos(r), s = sin(r);
      p.yz = mat2(c.x, -s.x, s.x, c.x) * p.yz;
      p.xz = mat2(c.y, s.y, -s.y, c.y) * p.xz;
      p.xy = mat2(c.z, -s.z, s.z, c.z) * p.xy;
      return p;
    }
    void main() {
      vUv = uv;
      vNormal = rotate(rotate(vec3(0.0, normalYZ), rotation), rig);
      vPosition = position;
      vLight = unrotate(unrotate(normalize(vec3(-0.45, 1.1, 0.8)), rig), rotation);
      vec3 world = rotate(rotate(position * 0.79, rotation), rig) + translation;
      vView = camera - world;
      vec3 forward = normalize(target - camera);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, forward);
      vec3 delta = world - camera;
      vec3 view = vec3(dot(delta, right), dot(delta, up), -dot(delta, forward));
      view.xy *= 1.122;
      gl_Position = vec4(view.x * 3.2708526 / aspect, view.y * 3.2708526, -1.002002 * view.z - 0.2002002, -view.z);
      gl_Position.y += gl_Position.w * 0.2;
    }`;
  const fragmentSource = `
    precision highp float;
    uniform sampler2D atlas;
    uniform float offset, count, picking;
    uniform vec2 grid, atlasSize;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition, vView, vLight;
    float edgeShadow(vec3 origin, vec3 ray, float distance) {
      if (distance < 0.025) return 0.0;
      float halfWidth = (11.6 + 6.408849) / count * 0.666667;
      float edge = halfWidth - abs(origin.x + ray.x * distance);
      return smoothstep(-0.06, 0.06 + distance * 0.12, edge);
    }
    float rayShadow(vec3 origin, vec3 ray) {
      float shadow = 0.0;
      if (abs(ray.z) > 0.0001) {
        for (int side = 0; side < 2; side++) {
          float z = side == 0 ? -1.02 : 1.02;
          float distance = (z - origin.z) / ray.z;
          if (abs(origin.y + ray.y * distance) <= 2.9)
            shadow = max(shadow, edgeShadow(origin, ray, distance));
        }
      }
      float a = dot(ray.yz, ray.yz);
      for (int end = 0; end < 2; end++) {
        float signY = end == 0 ? -1.0 : 1.0;
        vec2 delta = origin.yz - vec2(signY * 2.9, 0.0);
        float b = dot(delta, ray.yz);
        float discriminant = b * b - a * (dot(delta, delta) - 1.0404);
        if (discriminant >= 0.0 && a > 0.0001) {
          for (int root = 0; root < 2; root++) {
            float distance = (-b + (root == 0 ? -1.0 : 1.0) * sqrt(discriminant)) / a;
            if (signY * (origin.y + ray.y * distance) >= 2.9)
              shadow = max(shadow, edgeShadow(origin, ray, distance));
          }
        }
      }
      return shadow;
    }
    float visibility(vec3 normal) {
      vec3 light = normalize(vLight);
      vec3 tangent = normalize(cross(light, vec3(0.0, 1.0, 0.0)));
      vec3 bitangent = cross(light, tangent);
      vec3 origin = vPosition + normal * 0.018;
      float shadow = rayShadow(origin, light) * 2.0;
      shadow += rayShadow(origin, normalize(light + tangent * 0.12));
      shadow += rayShadow(origin, normalize(light - tangent * 0.12));
      shadow += rayShadow(origin, normalize(light + bitangent * 0.12));
      shadow += rayShadow(origin, normalize(light - bitangent * 0.12));
      return 1.0 - shadow / 6.0;
    }
    void main() {
      float phase = mod(vUv.y * count + offset, count);
      float tile = floor(phase);
      if (picking > 0.5) { gl_FragColor = vec4((tile + 1.0) / 255.0, 0.0, 0.0, 1.0); return; }
      vec2 cell = vec2(mod(tile, grid.x), floor(tile / grid.x));
      vec2 local = vec2(vUv.x, 1.0 - fract(phase));
      vec2 inset = 0.5 * grid / atlasSize;
      vec2 sampleUv = (cell + mix(inset, 1.0 - inset, local)) / grid;
      vec3 color = texture2D(atlas, sampleUv).rgb;
      vec3 normal = normalize(vNormal);
      float side = dot(normal, vView) >= 0.0 ? 1.0 : -1.0;
      normal *= side;
      vec3 localNormal = vec3(0.0, normalize(vec2(vPosition.y - clamp(vPosition.y, -2.9, 2.9), vPosition.z))) * side;
      float visible = visibility(localNormal);
      vec3 light = normalize(vec3(-0.45, 1.1, 0.8));
      float diffuse = max(0.0, dot(normal, light)) * visible;
      float ambient = side > 0.0 ? 0.36 : 0.14;
      float fold = smoothstep(2.35, 3.92, abs(vPosition.y));
      ambient *= 1.0 - (side < 0.0 ? 0.35 : 0.12) * fold;
      float highlight = pow(max(0.0, dot(normal, normalize(light + normalize(vView)))), 28.0) * visible * 0.035;
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      color = max(vec3(0.0), mix(vec3(luma), color, 1.04));
      vec3 lit = pow(color, vec3(2.2)) * (ambient * vec3(0.94, 0.97, 1.0) + diffuse * 0.9 + highlight);
      gl_FragColor = vec4(pow(clamp(lit, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
    }`;
  const program = gl.createProgram();
  const shaders = [];
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  } finally { shaders.forEach(shader => gl.deleteShader(shader)); }
  gl.useProgram(program);
  const geometry = buildConveyorGeometry(projects.length);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
  for (const [name, size, start] of [["position", 3, 0], ["uv", 2, 3], ["normalYZ", 2, 5]]) {
    const attribute = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 28, start * 4);
  }
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

  const columns = Math.ceil(Math.sqrt(projects.length * .75));
  const rows = Math.ceil(projects.length / columns);
  const maxSize = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));
  const tileWidth = Math.floor(Math.min(1200, maxSize / columns, maxSize / rows * 4 / 3) / 4) * 4;
  const tileHeight = tileWidth * .75;
  const atlas = document.createElement("canvas");
  atlas.width = columns * tileWidth;
  atlas.height = rows * tileHeight;
  const ctx = atlas.getContext("2d");
  ctx.fillStyle = "#0f1316";
  ctx.fillRect(0, 0, atlas.width, atlas.height);
  images.forEach((image, index) => {
    const x = index % columns * tileWidth, y = Math.floor(index / columns) * tileHeight;
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    if (image && iw && ih) {
      const scale = Math.max(tileWidth / iw, tileHeight / ih);
      const width = iw * scale, height = ih * scale;
      ctx.drawImage(image, x + (tileWidth - width) / 2, y + (tileHeight - height) / 2, width, height);
    } else {
      ctx.fillStyle = "#8b9198";
      ctx.font = `${tileWidth / 32}px sans-serif`;
      ctx.fillText(projects[index].title, x + 24, y + tileHeight / 2, tileWidth - 48);
    }
  });
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
  if (anisotropy) {
    gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
      Math.min(8, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  }
  const locations = Object.fromEntries(["rotation", "rig", "translation", "camera", "target", "aspect", "offset", "count", "picking", "grid", "atlasSize"].map(name => [name, gl.getUniformLocation(program, name)]));
  gl.uniform1f(locations.count, projects.length);
  gl.uniform2f(locations.grid, columns, rows);
  gl.uniform2f(locations.atlasSize, atlas.width, atlas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  let viewportWidth = 1, viewportHeight = 1;
  const pixel = new Uint8Array(4);

  function draw(state, picking = false) {
    const ease = state.present * state.present * (3 - 2 * state.present);
    const fade = 1 - ease;
    const x = state.parallaxX * fade, y = state.parallaxY * fade;
    const zoom = Math.max(1, .9 * viewportHeight / viewportWidth);
    gl.uniform3f(locations.camera, (-2 * fade + x * .12) * zoom, (-9.35 * fade - y * .08) * zoom, (10.99 - ease * 4.79) * zoom);
    gl.uniform3f(locations.target, 0, -.2 * fade, .1 * fade);
    gl.uniform3f(locations.rotation, .07 * fade, (-.594 + Math.sin(state.offset * Math.PI * 2 / projects.length) * .081) * fade, -.28 * fade);
    gl.uniform3f(locations.rig, -y * .075, x * .1, 0);
    gl.uniform3f(locations.translation, x * .075, y * .03 + Math.sin(state.offset * Math.PI * 4 / projects.length) * .02 - .04 - ease * .06, 0);
    gl.uniform1f(locations.offset, state.offset);
    gl.uniform1f(locations.picking, picking ? 1 : 0);
    if (picking) gl.disable(gl.DITHER);
    else gl.enable(gl.DITHER);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
  }
  return {
    draw,
    resize(width, height) {
      viewportWidth = width; viewportHeight = height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(locations.aspect, width / height);
    },
    pick(x, y, state) {
      draw(state, true);
      gl.readPixels(Math.min(canvas.width - 1, Math.max(0, Math.floor(x / viewportWidth * canvas.width))),
        Math.min(canvas.height - 1, Math.max(0, Math.floor((1 - y / viewportHeight) * canvas.height))), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      draw(state);
      return pixel[3] === 255 && pixel[0] > 0 && pixel[0] <= projects.length ? pixel[0] - 1 : -1;
    },
  };
}

function createNoise(canvas) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, stencil: false });
  const fallback = reason => {
    console.warn("Grain shader unavailable; using CSS fallback.", reason);
    canvas.style.background = "repeating-conic-gradient(rgba(255,255,255,.015) 0 25%, transparent 0 50%)";
    canvas.style.backgroundSize = "6px 6px";
    return { resize() {}, draw() {} };
  };
  if (!gl) return fallback("WebGL context was not available.");

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  let program, vertex, fragment;
  try {
    vertex = compile(gl.VERTEX_SHADER, `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `);
    fragment = compile(gl.FRAGMENT_SHADER, `
      precision highp float;
      uniform float frame;
      float random(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      void main() {
        vec2 pixel = gl_FragCoord.xy + vec2(mod(frame, 997.0) * 17.0, mod(frame, 991.0) * 31.0);
        float grain = (random(pixel) + random(pixel + 19.7)
          + random(pixel + 43.1) + random(pixel + 71.9)) * 0.25;
        gl_FragColor = vec4(vec3(grain), 1.0);
      }
    `);
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    if (program) gl.deleteProgram(program);
    return fallback(error);
  } finally {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
  }
  canvas.style.backgroundImage = "none";
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const frame = gl.getUniformLocation(program, "frame");
  let previousFrame = -1;

  return {
    resize() {
      const ratio = 2;
      canvas.width = Math.round(document.documentElement.clientWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
      previousFrame = -1;
    },
    draw(time) {
      const currentFrame = Math.floor(time / 80);
      if (gl.isContextLost() || currentFrame === previousFrame) return;
      previousFrame = currentFrame;
      gl.uniform1f(frame, currentFrame);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
