import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

const LARGURA = 3.6;
const ALTURA = 3.15;
const INTERVALO = 2.72;
const INICIO = 3.65;
const LARGURA_QUADRO = 1.52;
const ALTURA_QUADRO = LARGURA_QUADRO * 10 / 16;
const Y_QUADRO = 1.65;
const TINTA = 0x302e2b;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const suave = THREE.MathUtils.smoothstep;
const cena = arquivo => new URL(arquivo, import.meta.url).href;

function malha(pai, geometria, material, x, y, z) {
  const objeto = new THREE.Mesh(geometria, material);
  objeto.position.set(x, y, z);
  pai.add(objeto);
  return objeto;
}

function plano(pai, largura, altura, material, x, y, z) {
  return malha(pai, new THREE.PlaneGeometry(largura, altura), material, x, y, z);
}

function caixa(pai, largura, altura, fundo, material, x, y, z) {
  return malha(pai, new THREE.BoxGeometry(largura, altura, fundo), material, x, y, z);
}

function texturaRepetida(origem, x, y, cor) {
  const mapa = origem.clone();
  mapa.wrapS = mapa.wrapT = THREE.RepeatWrapping;
  mapa.repeat.set(x, y);
  mapa.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  mapa.needsUpdate = true;
  return mapa;
}

function materialMineral({ mapas, repeticao, cor, relevo, oclusao = 0, paineis = false }) {
  const superficie = texturaRepetida(mapas.superficie, ...repeticao, false);
  return new THREE.MeshStandardMaterial({
    color: cor,
    map: texturaRepetida(mapas.cor, ...repeticao, true),
    normalMap: texturaRepetida(mapas.normal, ...repeticao, false),
    normalScale: new THREE.Vector2(relevo, relevo),
    roughnessMap: superficie,
    aoMap: oclusao ? superficie : null,
    aoMapIntensity: oclusao,
    roughness: 1,
    vertexColors: paineis,
  });
}

function geometriaPaineis(comprimento, altura) {
  const quantidade = Math.ceil(comprimento / 2.45);
  const passo = comprimento / quantidade;
  const posicoes = [], uvs = [], cores = [], indices = [];
  const junta = .009;
  const tons = [1, .91, .97, .93, 1, .96];
  // Escurecimento do concreto onde a parede encontra piso e teto.
  const linhas = [[0, .51], [.065, .69], [.20, .89], [.47, 1], [altura - .34, 1], [altura - .08, .84], [altura, .67]];
  for (let i = 0; i < quantidade; i++) {
    const esquerda = i * passo + junta / 2;
    const direita = (i + 1) * passo - junta / 2;
    const base = posicoes.length / 3;
    linhas.forEach(([y, luz], linha) => {
      const tom = luz * tons[i % tons.length];
      posicoes.push(esquerda, y, 0, direita, y, 0);
      uvs.push(esquerda, y, direita, y);
      cores.push(tom, tom, tom, tom, tom, tom);
      if (linha > 0) {
        const baixo = base + (linha - 1) * 2;
        indices.push(baixo, baixo + 1, baixo + 3, baixo, baixo + 3, baixo + 2);
      }
    });
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));
  geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometria.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  return geometria;
}

function geometriaPiso(comprimento) {
  const geo = new THREE.PlaneGeometry(LARGURA, comprimento, 24, 1);
  const posicoes = geo.getAttribute("position");
  const cores = [];
  for (let i = 0; i < posicoes.count; i++) {
    const borda = LARGURA / 2 - Math.abs(posicoes.getX(i));
    const tom = mix(.60, 1, suave(borda, 0, .42));
    cores.push(tom, tom, tom);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  return geo;
}

function montarGaleria(scene, texturas, comprimento) {
  const concreto = materialMineral({
    mapas: texturas.concreto, repeticao: [.49, .49],
    cor: 0x868584, relevo: .80, oclusao: .65, paineis: true,
  });
  const rejunte = new THREE.MeshStandardMaterial({ color: 0x41403e, roughness: 1 });
  const metal = new THREE.MeshStandardMaterial({ color: TINTA, roughness: .74 });
  const teto = new THREE.MeshStandardMaterial({
    color: 0x5e5b56,
    map: texturaRepetida(texturas.concreto.cor, LARGURA / 2.1, comprimento / 2.1, true),
    roughness: .95,
  });
  const piso = materialMineral({
    mapas: texturas.piso, repeticao: [LARGURA / 3.5, comprimento / 3.5],
    cor: 0xcac8c5, relevo: .44, oclusao: .52, paineis: true,
  });
  const chao = malha(scene, geometriaPiso(comprimento), piso, 0, 0, -comprimento / 2);
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  plano(scene, LARGURA, comprimento, teto, 0, ALTURA, -comprimento / 2).rotation.x = Math.PI / 2;

  for (let z = -2.25; z > -comprimento; z -= 2.46) {
    caixa(scene, LARGURA, .014, .016, metal, 0, ALTURA - .004, z);
  }
  const paineis = geometriaPaineis(comprimento, ALTURA - .043);
  for (const lado of [-1, 1]) {
    const x = lado * LARGURA / 2;
    const angulo = -lado * Math.PI / 2;
    const fundoDoRejunte = plano(scene, comprimento, ALTURA, rejunte, x + lado * .016, ALTURA / 2, -comprimento / 2);
    fundoDoRejunte.rotation.y = angulo;
    const parede = malha(scene, paineis, concreto, x, .024, lado < 0 ? 0 : -comprimento);
    parede.rotation.y = angulo;
    parede.receiveShadow = true;
    caixa(scene, .026, .025, comprimento, metal, x - lado * .006, .013, -comprimento / 2);
    caixa(scene, .045, .030, comprimento - .54, metal, lado * .78, ALTURA - .023, -comprimento / 2);
  }
  return piso;
}

function montarPorta(scene, texturas, comprimento) {
  const altura = 2.48;
  const largura = altura * 671 / 1338;
  const tamanhoFolha = largura * .7645;
  const alturaFolha = altura * .9185;
  const xFolha = largura * (.1088 - .5);
  const z = -comprimento;
  const concreto = materialMineral({
    mapas: texturas.concreto, repeticao: [.47, .47], cor: 0xb3b1ae, relevo: .67, oclusao: .58,
  });
  const sobra = (LARGURA - tamanhoFolha) / 2;
  const desvio = xFolha + tamanhoFolha / 2;
  function trecho(larguraTrecho, alturaTrecho, x, y) {
    const painel = plano(scene, larguraTrecho, alturaTrecho, concreto, x, y, z);
    const { position, uv } = painel.geometry.attributes;
    for (let i = 0; i < position.count; i++) {
      uv.setXY(i, position.getX(i) + x + LARGURA / 2, position.getY(i) + y);
    }
  }
  trecho(sobra + desvio, ALTURA, -LARGURA / 2 + (sobra + desvio) / 2, ALTURA / 2);
  trecho(sobra - desvio, ALTURA, LARGURA / 2 - (sobra - desvio) / 2, ALTURA / 2);
  trecho(tamanhoFolha, ALTURA - alturaFolha, desvio, (ALTURA + alturaFolha) / 2);

  const batente = new THREE.MeshStandardMaterial({ color: 0x32283e, roughness: .85 });
  caixa(scene, .075, alturaFolha, .44, batente, xFolha - .035, alturaFolha / 2, z - .245);
  caixa(scene, .075, alturaFolha, .44, batente, xFolha + tamanhoFolha + .035, alturaFolha / 2, z - .245);
  caixa(scene, tamanhoFolha, .08, .44, batente, desvio, alturaFolha + .038, z - .245);
  caixa(scene, tamanhoFolha, .04, .44, batente, desvio, -.02, z - .245);
  const acabamento = mapa => new THREE.MeshBasicMaterial({
    map: mapa, alphaTest: .45, color: 0xe4dcf1, toneMapped: false, side: THREE.DoubleSide,
  });
  plano(scene, largura, altura, acabamento(texturas.moldura), 0, altura / 2, z + .026);
  const eixo = new THREE.Group();
  eixo.position.set(xFolha, 0, z + .028);
  scene.add(eixo);
  const madeira = new THREE.MeshStandardMaterial({ color: 0x391d77, roughness: .62 });
  caixa(eixo, tamanhoFolha - .021, alturaFolha - .026, .041, madeira, tamanhoFolha / 2, alturaFolha / 2, -.024);
  plano(eixo, tamanhoFolha, alturaFolha, acabamento(texturas.folha), tamanhoFolha / 2, alturaFolha / 2, 0);
  const luz = new THREE.PointLight(0x9160ff, 0, 3.8, 2);
  luz.position.set(desvio, .70, z + .15);
  scene.add(luz);
  return abre => {
    eixo.rotation.y = abre * 1.79 + Math.sin(abre * Math.PI) * .09;
    luz.intensity = abre * 4.5;
  };
}

function montarSpots(scene, posicoes, comprimento, compacto) {
  const aluminio = new THREE.MeshStandardMaterial({ color: 0x363430, roughness: .63 });
  const lente = new THREE.MeshBasicMaterial({ color: 0xffefd7, toneMapped: false });
  const acabamento = new THREE.MeshStandardMaterial({ color: 0x2c2c2a, roughness: .42, metalness: .38 });
  const corpo = new THREE.CylinderGeometry(.054, .063, .159, 20);
  const aro = new THREE.RingGeometry(.040, .061, 20);
  const disco = new THREE.CircleGeometry(.0405, 20);
  const baixo = new THREE.Vector3(0, -1, 0);
  function spot(x, z, tx, ty, tz, intensidade, angulo) {
    const luz = new THREE.SpotLight(0xffe8d2, intensidade, 7.0, angulo, .98, 2);
    luz.position.set(x, ALTURA - .09, z);
    luz.target.position.set(tx, ty, tz);
    scene.add(luz, luz.target);
    const luminaria = new THREE.Group();
    luminaria.position.copy(luz.position);
    luminaria.quaternion.setFromUnitVectors(baixo, luz.target.position.clone().sub(luz.position).normalize());
    scene.add(luminaria);
    malha(luminaria, corpo, aluminio, 0, 0, 0);
    malha(luminaria, aro, acabamento, 0, -.080, 0).rotation.x = Math.PI / 2;
    malha(luminaria, disco, lente, 0, -.079, 0).rotation.x = Math.PI / 2;
    caixa(scene, .036, .12, .037, aluminio, x, ALTURA - .06, z);
  }
  scene.add(new THREE.HemisphereLight(0xf4eee8, 0x9b9c9f, 1.58));
  spot(-.78, -.95, -LARGURA / 2, 1.73, -1.58, 18, .73);
  spot(.78, -1.43, LARGURA / 2, 1.80, -1.84, 19, .73);
  posicoes.forEach(({ lado, z }, indice) => {
    const desvio = indice % 3 === 1 ? -.26 : .21;
    spot(lado * .78, z + desvio, lado * LARGURA / 2, 1.69, z + desvio * 1.7, 26 + indice % 3 * 2, .73);
  });
  spot(-.78, -comprimento + 1.77, -.33, 1.84, -comprimento, 34, .65);
  spot(.78, -comprimento + 2.08, .70, 1.91, -comprimento, 22, .71);

  const luzQuadro = new THREE.SpotLight(0xffebd4, 0, 5.5, .65, .74, 2);
  luzQuadro.castShadow = true;
  const tamanho = compacto ? 512 : 768;
  luzQuadro.shadow.mapSize.set(tamanho, tamanho);
  luzQuadro.shadow.camera.near = .38;
  luzQuadro.shadow.camera.far = 5;
  luzQuadro.shadow.bias = -.00024;
  luzQuadro.shadow.normalBias = .018;
  luzQuadro.shadow.radius = 3.4;
  scene.add(luzQuadro, luzQuadro.target);
  return luzQuadro;
}

function reflexoDoPiso(scene, comprimento, piso) {
  const shader = {
    ...Reflector.ReflectorShader,
    uniforms: {
      ...Reflector.ReflectorShader.uniforms,
      normalPiso: { value: piso.normalMap },
      superficie: { value: piso.roughnessMap },
      repeticao: { value: piso.map.repeat },
    },
    vertexShader: Reflector.ReflectorShader.vertexShader
      .replace("varying vec4 vUv;", "varying vec4 vUv; varying vec2 uvPiso; varying vec3 posPiso;")
      .replace("vUv = textureMatrix * vec4( position, 1.0 );", `
        vUv = textureMatrix * vec4( position, 1.0 );
        uvPiso = uv;
        posPiso = (modelMatrix * vec4(position, 1.0)).xyz;
      `),
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform sampler2D normalPiso;
      uniform sampler2D superficie;
      uniform vec2 repeticao;
      varying vec4 vUv;
      varying vec2 uvPiso;
      varying vec3 posPiso;
      #include <common>
      #include <logdepthbuf_pars_fragment>
      void main() {
        #include <logdepthbuf_fragment>
        vec2 uvTextura = uvPiso * repeticao;
        vec2 superficiePiso = texture2D(superficie, uvTextura).rg;
        vec2 microRelevo = texture2D(normalPiso, uvTextura).rg - 0.5;
        vec2 uv = vUv.xy / vUv.w + microRelevo * vec2(0.012, 0.020);
        vec2 raio = vec2(0.009, 0.016) * mix(0.55, 1.35, superficiePiso.g);
        vec3 luz = texture2D(tDiffuse, uv).rgb * 0.24;
        luz += texture2D(tDiffuse, uv + vec2(raio.x, 0.0)).rgb * 0.12;
        luz += texture2D(tDiffuse, uv - vec2(raio.x, 0.0)).rgb * 0.12;
        luz += texture2D(tDiffuse, uv + vec2(0.0, raio.y)).rgb * 0.12;
        luz += texture2D(tDiffuse, uv - vec2(0.0, raio.y)).rgb * 0.12;
        luz += texture2D(tDiffuse, uv + raio * 0.70).rgb * 0.07;
        luz += texture2D(tDiffuse, uv - raio * 0.70).rgb * 0.07;
        luz += texture2D(tDiffuse, uv + vec2(raio.x, -raio.y) * 0.70).rgb * 0.07;
        luz += texture2D(tDiffuse, uv + vec2(-raio.x, raio.y) * 0.70).rgb * 0.07;
        float incidencia = normalize(cameraPosition - posPiso).y;
        float fresnel = mix(0.022, 0.19, pow(1.0 - incidencia, 2.4));
        float intensidade = fresnel * (1.0 - 0.36 * superficiePiso.g) * superficiePiso.r;
        gl_FragColor = vec4(luz, intensidade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  };
  const reflexo = new Reflector(new THREE.PlaneGeometry(LARGURA, comprimento), {
    textureWidth: 480, textureHeight: 288, multisample: 0, clipBias: .002, shader,
  });
  reflexo.position.set(0, .002, -comprimento / 2);
  reflexo.rotation.x = -Math.PI / 2;
  reflexo.material.transparent = true;
  reflexo.material.depthWrite = false;
  scene.add(reflexo);
  return reflexo;
}

function materialVidro() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { intensidade: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      varying float angulo;
      void main() {
        vUv = uv;
        vec4 ponto = modelViewMatrix * vec4(position, 1.0);
        vec3 normalVidro = normalize(normalMatrix * normal);
        angulo = 1.0 - abs(dot(normalVidro, normalize(-ponto.xyz)));
        gl_Position = projectionMatrix * ponto;
      }
    `,
    fragmentShader: `
      uniform float intensidade;
      varying vec2 vUv;
      varying float angulo;
      void main() {
        vec2 margem = min(vUv, 1.0 - vUv);
        float borda = 1.0 - smoothstep(0.0, 0.012, min(margem.x, margem.y));
        float faixa = 1.0 - smoothstep(0.0, 0.18, abs(vUv.x + vUv.y * 0.65 - 0.55));
        float alpha = intensidade * (0.035 + borda * 0.36 + faixa * 0.12 + angulo * 0.13);
        gl_FragColor = vec4(vec3(0.69, 0.77, 0.83), alpha);
        #include <colorspace_fragment>
      }
    `,
  });
}

const PROFUNDIDADE_PANORAMA = 1.86;
const LARGURA_OBRA = 1.18;
const ALTURA_OBRA = LARGURA_OBRA * 10 / 16;

function montarSala(scene, texturas, comprimento, sites) {
  const grupo = new THREE.Group();
  grupo.position.z = -comprimento;
  scene.add(grupo);

  const raio = 6.66;
  const centro = 2.36;
  const altura = 3.46;
  const setores = Math.max(3, sites.length);
  const passo = 1.465 / setores;
  const borda = setores * passo / 2;
  const xExterno = raio * Math.sin(borda);
  const ponto = (angulo, distancia = raio) => [
    Math.sin(angulo) * distancia, -centro - Math.cos(angulo) * distancia,
  ];
  const perimetro = [[-xExterno, .012]];
  for (let i = 0; i <= setores; i++) perimetro.push(ponto(-borda + passo * i));
  perimetro.push([xExterno, .012]);

  const parede = materialMineral({
    mapas: texturas.concreto, repeticao: [.53, .53], cor: 0xd3c7b6, relevo: .53, oclusao: .52,
  });
  const piso = materialMineral({
    mapas: texturas.piso, repeticao: [1 / 3.5, 1 / 3.5], cor: 0xe5dacc, relevo: .39, oclusao: .44,
  });
  const teto = new THREE.MeshStandardMaterial({ color: 0x4c4540, roughness: .92, side: THREE.DoubleSide });
  const rodape = new THREE.MeshStandardMaterial({ color: 0x34302d, roughness: .84 });
  const moldura = new THREE.MeshStandardMaterial({ color: 0x39312d, roughness: .46, metalness: .24 });
  const difusor = new THREE.MeshBasicMaterial({ color: 0xffefdb, toneMapped: false });
  const planta = new THREE.Shape();
  perimetro.forEach(([x, z], i) => (i ? planta.lineTo(x, -z) : planta.moveTo(x, -z)));
  planta.closePath();
  const laje = new THREE.ShapeGeometry(planta);
  malha(grupo, laje, piso, 0, -.005, 0).rotation.x = -Math.PI / 2;
  malha(grupo, laje, teto, 0, altura, 0).rotation.x = -Math.PI / 2;

  function acabamento(a, b, base, topo) {
    const [x1, z1] = a, [x2, z2] = b;
    const largura = Math.hypot(x2 - x1, z2 - z1);
    const angulo = Math.atan2(z1 - z2, x2 - x1);
    const x = (x1 + x2) / 2, z = (z1 + z2) / 2;
    const pano = plano(grupo, largura, topo - base, parede, x, (base + topo) / 2, z);
    pano.rotation.y = angulo;
    const { position, uv } = pano.geometry.attributes;
    for (let i = 0; i < position.count; i++) {
      uv.setXY(i, position.getX(i) + largura / 2, position.getY(i) + (base + topo) / 2);
    }
    if (base === 0) {
      const saia = caixa(grupo, largura, .049, .022, rodape, x, .0245, z);
      saia.rotation.y = angulo;
    }
  }

  for (let i = 1; i < perimetro.length; i++) acabamento(perimetro[i - 1], perimetro[i], 0, altura);
  // A face interna da entrada deixa livre o vão da porta e o caminho da câmera.
  const batente = 2.48 * 671 / 1338;
  const esquerda = batente * (.1088 - .5);
  const direita = esquerda + batente * .7645;
  acabamento([xExterno, -.022], [direita, -.022], 0, altura);
  acabamento([esquerda, -.022], [-xExterno, -.022], 0, altura);
  acabamento([direita, -.022], [esquerda, -.022], 2.48 * .9185, altura);

  for (const [profundidade, largura] of [[2.57, 5.8], [4.66, 5.8], [6.39, 5]]) {
    caixa(grupo, largura, .062, .105, rodape, 0, altura - .084, -profundidade);
    caixa(grupo, largura - .16, .012, .047, difusor, 0, altura - .120, -profundidade);
    for (const x of [-largura * .34, largura * .34]) {
      caixa(grupo, .027, .096, .027, rodape, x, altura - .043, -profundidade);
    }
  }

  const preenchimento = new THREE.PointLight(0xffead3, 21, 7.9, 2);
  preenchimento.position.set(0, altura - .29, -3.7);
  grupo.add(preenchimento);
  for (const angulo of [-.47, 0, .47]) {
    const [x, z] = ponto(angulo, 3.8);
    const [tx, tz] = ponto(angulo);
    const luz = new THREE.SpotLight(0xffedd7, 51, 7.7, .94, .89, 2);
    luz.position.set(x, altura - .15, z);
    luz.target.position.set(tx, 1.62, tz);
    grupo.add(luz, luz.target);
  }

  const obras = sites.map((site, indice) => {
    const angulo = (indice - (sites.length - 1) / 2) * passo;
    const [x, z] = ponto(angulo, raio * Math.cos(passo / 2) - .075);
    const suporte = new THREE.Group();
    suporte.position.set(x, 1.62, z);
    suporte.rotation.y = -angulo;
    grupo.add(suporte);
    caixa(suporte, LARGURA_OBRA + .071, ALTURA_OBRA + .071, .070, moldura, 0, 0, 0);
    const imagem = new THREE.MeshBasicMaterial({ color: 0x171412, toneMapped: false });
    plano(suporte, LARGURA_OBRA, ALTURA_OBRA, imagem, 0, 0, .036);
    const vidro = plano(suporte, LARGURA_OBRA + .019, ALTURA_OBRA + .019, materialVidro(), 0, 0, .045);
    vidro.renderOrder = 1;
    const link = document.createElement("a");
    link.className = "sala-obra";
    link.href = site.url;
    link.setAttribute("aria-label", `Abrir o site ${site.nome}`);
    const nome = document.createElement("span");
    nome.textContent = site.nome;
    link.append(nome);
    return { suporte, imagem, vidro, link };
  });
  grupo.updateMatrixWorld(true);
  return { grupo, obras };
}

function controlesDaSala(sites, obras, selecionar, signal) {
  const area = document.createElement("section");
  area.className = "sala-interface";
  area.hidden = true;
  area.setAttribute("aria-label", "Sala de projetos");
  const links = document.createElement("div");
  links.className = "sala-obras";
  obras.forEach(({ link }) => links.append(link));

  const barra = document.createElement("div");
  barra.className = "sala-barra";
  const navega = document.createElement("div");
  navega.className = "sala-navega";
  const escolha = document.createElement("select");
  escolha.setAttribute("aria-label", "Escolher projeto na sala");
  escolha.add(new Option("Visão geral da sala", "-1"));
  sites.forEach((site, indice) => escolha.add(new Option(site.nome, String(indice))));
  const seta = (texto, rotulo) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.setAttribute("aria-label", rotulo);
    botao.textContent = texto;
    return botao;
  };
  const anterior = seta("‹", "Projeto anterior");
  const proximo = seta("›", "Próximo projeto");
  const lista = document.createElement("a");
  lista.className = "sala-lista";
  lista.href = "#todos";
  lista.textContent = "Todos os sites";
  escolha.addEventListener("change", () => selecionar(Number(escolha.value)), { signal });
  anterior.addEventListener("click", () => {
    const i = Number(escolha.value);
    selecionar(i === -1 ? sites.length - 1 : i - 1);
  }, { signal });
  proximo.addEventListener("click", () => {
    const i = Number(escolha.value);
    selecionar(i + 1 === sites.length ? -1 : i + 1);
  }, { signal });
  const abrir = document.createElement("a");
  abrir.className = "sala-abrir";
  abrir.textContent = "Abrir site ↗";
  abrir.hidden = true;
  navega.append(anterior, escolha, proximo);
  barra.append(navega, lista, abrir);
  area.append(links, barra);
  return { area, escolha, lista, abrir };
}

function legenda(site, indice, total) {
  const el = document.createElement("article");
  el.className = "quadro";
  el.hidden = true;
  const tela = document.createElement("a");
  tela.className = "tela";
  tela.href = site.url;
  tela.setAttribute("aria-label", `Abrir o site ${site.nome}`);
  const leg = document.createElement("div");
  leg.className = "leg";
  const numero = document.createElement("span");
  numero.className = "num";
  numero.textContent = `${String(indice + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const titulo = document.createElement("h3");
  titulo.textContent = site.nome;
  const descricao = document.createElement("p");
  descricao.textContent = site.curto;
  const link = document.createElement("a");
  link.className = "botao ir";
  link.href = site.url;
  link.textContent = "Abrir site ↗";
  leg.append(numero, titulo, descricao, link);
  el.append(tela, leg);
  return el;
}

function montarSuporteDoQuadro(scene, site, { lado, z }) {
  const angulo = -lado * Math.PI / 2;
  const parede = lado * LARGURA / 2;
  const sombra = plano(scene, LARGURA_QUADRO + .18, ALTURA_QUADRO + .15, new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { intensidade: { value: 1 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float intensidade;
      varying vec2 vUv;
      void main() {
        vec2 canto = abs(vUv - 0.5) - vec2(0.417, 0.398);
        float distancia = length(max(canto, 0.0));
        float sombra = (1.0 - smoothstep(0.0, 0.081, distancia)) * 0.35 * intensidade;
        gl_FragColor = vec4(0.0, 0.0, 0.0, sombra);
      }
    `,
  }), parede - lado * .004, Y_QUADRO - .036, z);
  sombra.rotation.y = angulo;

  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 104;
  const contexto = canvas.getContext("2d");
  contexto.fillStyle = "#b0aaa0";
  contexto.fillRect(0, 0, canvas.width, canvas.height);
  contexto.fillStyle = "#2c2b28";
  contexto.font = "600 23px Arial, sans-serif";
  contexto.fillText(site.nome, 23, 59, canvas.width - 46);
  const mapa = new THREE.CanvasTexture(canvas);
  mapa.colorSpace = THREE.SRGBColorSpace;
  const placa = plano(scene, .273, .089, new THREE.MeshStandardMaterial({ map: mapa, roughness: .74 }),
    parede - lado * .013, 1.29, z + .965);
  placa.rotation.y = angulo;
  return sombra;
}

function montarQuadro(scene, loader, site, posicao, indice, total, pedirQuadro) {
  const grupo = new THREE.Group();
  const sombra = montarSuporteDoQuadro(scene, site, posicao);
  scene.add(grupo);
  const aluminio = new THREE.MeshStandardMaterial({ color: 0x3b3938, roughness: .47, metalness: .19 });
  const moldura = caixa(grupo, LARGURA_QUADRO + .043, ALTURA_QUADRO + .041, .050, aluminio, 0, 0, 0);
  moldura.castShadow = true;
  const imagem = new THREE.MeshBasicMaterial({ color: 0x151515, toneMapped: false });
  const tela = plano(grupo, LARGURA_QUADRO, ALTURA_QUADRO, imagem, 0, 0, .026);
  const vidro = plano(grupo, LARGURA_QUADRO + .03, ALTURA_QUADRO + .03, materialVidro(), 0, 0, .028);
  vidro.renderOrder = 1;
  let video, mapaVideo, quadroVideo = null, querTocar = false, apresentouVideo = false;
  const base = loader.load(site.poster, mapa => {
    if (!apresentouVideo) imagem.map = mapa;
    imagem.color.set(0xffffff);
    imagem.needsUpdate = true;
    pedirQuadro();
  }, undefined, () => {});
  base.colorSpace = THREE.SRGBColorSpace;

  function novoQuadroVideo() {
    quadroVideo = null;
    if (!querTocar) return;
    pedirQuadro();
    quadroVideo = video.requestVideoFrameCallback(novoQuadroVideo);
  }

  function reproduzir(ativo) {
    if (!site.video || ativo === querTocar) return;
    querTocar = ativo;
    if (!ativo) {
      video?.pause();
      if (quadroVideo !== null) {
        video.cancelVideoFrameCallback(quadroVideo);
        quadroVideo = null;
      }
      return;
    }
    if (!video) {
      video = document.createElement("video");
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "none";
      video.src = site.video;
      mapaVideo = new THREE.VideoTexture(video);
      mapaVideo.colorSpace = THREE.SRGBColorSpace;
      video.addEventListener("playing", () => {
        if (!querTocar) return;
        apresentouVideo = true;
        if (video.requestVideoFrameCallback && quadroVideo === null) novoQuadroVideo();
        imagem.map = mapaVideo;
        imagem.color.set(0xffffff);
        imagem.needsUpdate = true;
        pedirQuadro();
      });
      video.addEventListener("error", () => {
        imagem.map = base;
        imagem.needsUpdate = true;
        pedirQuadro();
      });
    }
    video.play().catch(() => {});
  }

  return {
    ...posicao, grupo, moldura, aluminio, imagem, tela, vidro, sombra,
    legenda: legenda(site, indice, total),
    reproduzir,
    get mapa() { return imagem.map; },
    get animarVideo() { return querTocar && apresentouVideo && !video.paused && !video.requestVideoFrameCallback; },
  };
}

function posicionarQuadro(quadro, relativo, escala) {
  const sai = suave(relativo, -.73, -.12);
  const volta = suave(relativo, .12, .76);
  const avanco = sai * (1 - volta);
  const glass = suave(relativo, .045, .30) * (1 - suave(relativo, .54, .78));
  const { lado, z, grupo, moldura, aluminio, tela, imagem, vidro, sombra } = quadro;
  grupo.position.set(mix(lado * (LARGURA / 2 - .065), 0, avanco), Y_QUADRO, z + Math.sin(avanco * Math.PI) * .12);
  grupo.rotation.y = mix(-lado * Math.PI / 2, 0, avanco);
  grupo.scale.setScalar(mix(1, escala, avanco));
  tela.visible = glass < .995;
  imagem.opacity = 1 - glass * .97;
  aluminio.opacity = 1 - glass * .98;
  const transparente = glass > .005;
  if (imagem.transparent !== transparente) {
    imagem.transparent = aluminio.transparent = transparente;
    imagem.depthWrite = aluminio.depthWrite = !transparente;
    imagem.needsUpdate = aluminio.needsUpdate = true;
  }
  moldura.castShadow = glass < .47;
  moldura.visible = glass < .995;
  sombra.material.uniforms.intensidade.value = 1 - avanco;
  vidro.material.uniforms.intensidade.value = .09 + glass * .91;
  return { avanco, glass };
}

export async function iniciarGaleria({ sites, palco, corredor, abertura, progresso, chegada, reduz, alternativa }) {
  const compacto = matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !compacto, powerPreference: "low-power" });
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.19;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const loader = new THREE.TextureLoader();
  async function carregar(nome, cor) {
    const mapa = await loader.loadAsync(cena(`${nome}.webp`));
    mapa.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    mapa.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), compacto ? 2 : 8);
    return mapa;
  }
  async function carregarMaterial(nome) {
    const [cor, normal, superficie] = await Promise.all([
      carregar(`${nome}-cor`, true),
      carregar(`${nome}-normal`, false),
      carregar(`${nome}-superficie`, false),
    ]);
    return { cor, normal, superficie };
  }
  // Concrete Wall 009 e Granito fotografado — Poly Haven, CC0. Veja MATERIAIS.md.
  let texturas;
  try {
    const [concreto, piso, moldura, folha] = await Promise.all([
      carregarMaterial("concreto"), carregarMaterial("granito"),
      carregar("moldura", true), carregar("folha", true),
    ]);
    texturas = { concreto, piso, moldura, folha };
  } catch (erro) {
    renderer.dispose();
    throw erro;
  }

  const posicoes = sites.map((_, indice) => ({ lado: indice % 2 ? 1 : -1, z: -(INICIO + INTERVALO * indice) }));
  const comprimento = INICIO + INTERVALO * Math.max(0, sites.length - 1) + 3.86;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161616);
  const camera = new THREE.PerspectiveCamera(53, 1, .055, comprimento + 16);
  const piso = montarGaleria(scene, texturas, comprimento);
  const porta = montarPorta(scene, texturas, comprimento);
  const sala = montarSala(scene, texturas, comprimento, sites);
  const luzQuadro = montarSpots(scene, posicoes, comprimento, compacto);
  const reflexo = !compacto && renderer.extensions.has("EXT_color_buffer_float") ? reflexoDoPiso(scene, comprimento, piso) : null;

  const camada = document.createElement("div");
  camada.className = "galeria-3d";
  renderer.domElement.setAttribute("aria-hidden", "true");
  const interfaceQuadros = document.createElement("div");
  interfaceQuadros.className = "galeria-interface";
  camada.append(renderer.domElement, interfaceQuadros);

  const eventos = new AbortController();
  const { signal } = eventos;
  let frame = 0, visivel = true, encerrado = false, primeiroQuadro = true;
  let largura, altura, pontoDeVista, escalaApresentacao, fovCorredor;
  let alvo = 0, curso = 0, ultimoTempo = 0, ultimoZ = 0, passo = 0, indiceAtivo = -1;
  let cursoDaSombra = -1;
  let xPonteiro = 0, yPonteiro = 0, xOlhar = 0, yOlhar = 0;
  const total = sites.length + 3;
  let selecaoSala = -1;
  const olhoSala = new THREE.Vector3(), alvoSala = new THREE.Vector3();
  const olhoDesejado = new THREE.Vector3(), alvoDesejado = new THREE.Vector3();
  const pontoObra = new THREE.Vector3(), cantoObra = new THREE.Vector3();
  const { area, escolha, lista, abrir } = controlesDaSala(sites, sala.obras, selecionarSala, signal);
  camada.append(area);
  function selecionarSala(indice) {
    selecaoSala = indice;
    escolha.value = String(indice);
    lista.hidden = indice >= 0;
    abrir.hidden = indice < 0;
    if (indice >= 0) abrir.href = sites[indice].url;
    pedirQuadro();
  }
  const canto1 = new THREE.Vector3(), canto2 = new THREE.Vector3();
  const quadros = sites.map((site, indice) => {
    const quadro = montarQuadro(scene, loader, site, posicoes[indice], indice, sites.length, pedirQuadro);
    interfaceQuadros.append(quadro.legenda);
    const nav = document.createElement("a");
    nav.href = site.url;
    nav.setAttribute("aria-label", site.nome);
    const nome = document.createElement("span");
    nome.textContent = site.nome;
    nav.append(nome, document.createElement("b"));
    nav.addEventListener("click", evento => {
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      evento.preventDefault();
      scrollTo({ top: scrollY + corredor.getBoundingClientRect().top + percurso() * (indice + 1) / total, behavior: "smooth" });
    }, { signal });
    progresso.append(nav);
    quadro.nav = nav;
    return quadro;
  });

  function percurso() {
    return Math.max(1, corredor.offsetHeight - palco.clientHeight);
  }

  function rolagem() {
    alvo = clamp(-corredor.getBoundingClientRect().top / percurso(), 0, 1);
    pedirQuadro();
  }

  function redimensionar() {
    largura = palco.clientWidth;
    altura = palco.clientHeight;
    const aspect = largura / Math.max(1, altura);
    camera.aspect = aspect;
    fovCorredor = aspect < .85 ? 64 : 52;
    camera.fov = fovCorredor;
    camera.updateProjectionMatrix();
    const tangente = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const horizontal = LARGURA_QUADRO / (2 * tangente * aspect * (aspect < .85 ? .86 : .61));
    const vertical = ALTURA_QUADRO / (2 * tangente * (altura < 580 ? .48 : .63));
    const enquadramento = Math.max(horizontal, vertical);
    pontoDeVista = clamp(enquadramento, 1.31, 2.32);
    escalaApresentacao = Math.min(1, pontoDeVista / enquadramento);
    const pixelRatio = Math.min(devicePixelRatio || 1, compacto ? 1.24 : 1.5, Math.sqrt(1900000 / Math.max(1, largura * altura)));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(largura, altura, false);
    if (reflexo) reflexo.visible = aspect >= .85;
    rolagem();
  }

  function profundidade(indice) {
    if (indice < 0) return .29;
    if (indice < quadros.length) return -quadros[indice].z - pontoDeVista;
    if (indice === quadros.length) return comprimento - 1.71;
    if (indice === quadros.length + 1) return comprimento + PROFUNDIDADE_PANORAMA;
    return comprimento + PROFUNDIDADE_PANORAMA + .37;
  }

  function atualizarLegenda(quadro) {
    const centro = quadro.grupo.position;
    const escala = quadro.grupo.scale.x;
    canto1.set(centro.x - LARGURA_QUADRO * escala / 2, centro.y + ALTURA_QUADRO * escala / 2, centro.z + .028).project(camera);
    canto2.set(centro.x + LARGURA_QUADRO * escala / 2, centro.y - ALTURA_QUADRO * escala / 2, centro.z + .028).project(camera);
    const estilo = quadro.legenda.style;
    estilo.setProperty("--quadro-x", `${(1 + (canto1.x + canto2.x) / 2) * largura / 2}px`);
    estilo.setProperty("--quadro-y", `${(1 - canto1.y) * altura / 2}px`);
    estilo.setProperty("--quadro-w", `${clamp((canto2.x - canto1.x) * largura / 2, 0, largura * .94)}px`);
    estilo.setProperty("--quadro-h", `${(canto1.y - canto2.y) * altura / 2}px`);
  }

  function posicionarObras(aberta, movimento) {
    area.hidden = !aberta;
    sala.obras.forEach((obra, indice) => {
      const mapa = quadros[indice].mapa;
      if (obra.imagem.map !== mapa) {
        obra.imagem.map = mapa;
        obra.imagem.color.set(mapa ? 0xffffff : 0x171412);
        obra.imagem.needsUpdate = true;
      }
      obra.vidro.material.uniforms.intensidade.value = .18 + (indice === selecaoSala ? movimento * .58 : 0);
      if (!aberta || (selecaoSala >= 0 && indice !== selecaoSala)) {
        obra.link.hidden = true;
        return;
      }
      const min = { x: 1, y: 1 }, max = { x: -1, y: -1 };
      let naFrente = true;
      for (const x of [-LARGURA_OBRA / 2, LARGURA_OBRA / 2]) {
        for (const y of [-ALTURA_OBRA / 2, ALTURA_OBRA / 2]) {
          cantoObra.set(x, y, .04).applyMatrix4(obra.suporte.matrixWorld).project(camera);
          naFrente = naFrente && cantoObra.z >= -1 && cantoObra.z <= 1;
          min.x = Math.min(min.x, cantoObra.x);
          min.y = Math.min(min.y, cantoObra.y);
          max.x = Math.max(max.x, cantoObra.x);
          max.y = Math.max(max.y, cantoObra.y);
        }
      }
      min.x = Math.max(-1, min.x);
      min.y = Math.max(-1, min.y);
      max.x = Math.min(1, max.x);
      max.y = Math.min(1, max.y);
      obra.link.hidden = !naFrente || (max.x - min.x) * largura < 58 || (max.y - min.y) * altura < 50;
      if (!obra.link.hidden) {
        const estilo = obra.link.style;
        estilo.left = `${(min.x + 1) * largura / 2}px`;
        estilo.top = `${(1 - max.y) * altura / 2}px`;
        estilo.width = `${(max.x - min.x) * largura / 2}px`;
        estilo.height = `${(max.y - min.y) * altura / 2}px`;
      }
    });
  }

  function pedirQuadro() {
    if (!frame && !encerrado && visivel && !document.hidden && !reduz.matches) frame = requestAnimationFrame(desenhar);
  }

  function desenhar(agora) {
    frame = 0;
    const dt = ultimoTempo ? clamp((agora - ultimoTempo) / 1000, 0, .05) : 1 / 60;
    ultimoTempo = agora;
    const pendente = Math.abs(curso - alvo) > .000028;
    curso = pendente ? mix(curso, alvo, 1 - Math.exp(-dt * 7.6)) : alvo;
    xOlhar = mix(xOlhar, xPonteiro, 1 - Math.exp(-dt * 6));
    yOlhar = mix(yOlhar, yPonteiro, 1 - Math.exp(-dt * 6));
    const u = curso * total;
    const fim = u - quadros.length;
    const salaAberta = fim > 1.83 && fim < 2.71;
    palco.classList.toggle("na-sala", fim > 1.65);
    const segmento = Math.min(total - 1, Math.floor(u));
    const t = u - segmento;
    const z = mix(profundidade(segmento - 1), profundidade(segmento), mix(t, suave(t, 0, 1), .80));
    const velocidade = Math.min(1, Math.abs(z - ultimoZ) / Math.max(.001, dt * 1.9));
    ultimoZ = z;
    passo = mix(passo, velocidade, 1 - Math.exp(-dt * 7));
    const candidato = Math.round(u) - 1;
    const fase = u - candidato - 1;
    const quadroAtivo = quadros[candidato];
    let olhar = 0, luz = 0, vidro = 0, temVideo = false;
    quadros.forEach((quadro, indice) => {
      const relativo = u - indice - 1;
      const { avanco, glass } = posicionarQuadro(quadro, relativo, escalaApresentacao);
      const perto = Math.abs(relativo) < .79 || (salaAberta && indice === selecaoSala);
      quadro.reproduzir(perto && !document.hidden && visivel && !reduz.matches);
      temVideo ||= quadro.animarVideo;
      if (indice === candidato) {
        olhar = quadro.lado * avanco * .09;
        luz = avanco;
        vidro = glass;
      }
    });
    const ativo = quadroAtivo && fase > -.105 && fase < .09 ? candidato : -1;
    if (ativo !== indiceAtivo) {
      quadros.forEach((quadro, indice) => {
        quadro.legenda.hidden = indice !== ativo;
        quadro.nav.classList.toggle("ativo", indice === ativo);
      });
      indiceAtivo = ativo;
    }
    const caminhando = z * Math.PI * 2 / .78;
    const x = olhar + Math.sin(caminhando / 2) * .022 * passo;
    const y = 1.63 + Math.cos(caminhando) * .018 * passo;
    const olharX = x * .28 + xOlhar * .16;
    const olharY = y - .10 + yOlhar * .11;
    olhoDesejado.set(0, 0, 0);
    alvoDesejado.set(0, 0, 0);
    if (selecaoSala >= 0) {
      const foco = suave(fim, 1.83, 2.02) * (1 - suave(fim, 2.53, 2.76));
      sala.obras[selecaoSala].suporte.getWorldPosition(pontoObra);
      const centroZ = -comprimento - PROFUNDIDADE_PANORAMA;
      const dist = Math.hypot(pontoObra.x, pontoObra.z - centroZ);
      const distanciaDeLeitura = camera.aspect < .85 ? 2.9 : 2.08;
      const aproximacao = clamp(1 - distanciaDeLeitura / dist, .12, .78);
      olhoDesejado.set(pontoObra.x * aproximacao * foco, 0, (pontoObra.z - centroZ) * aproximacao * foco);
      alvoDesejado.set((pontoObra.x - olharX) * foco, (pontoObra.y - olharY) * foco, (pontoObra.z + z + 2.8) * foco);
    }
    const transicao = Math.min(1, (olhoSala.distanceTo(olhoDesejado) + alvoSala.distanceTo(alvoDesejado)) / 2.7);
    olhoSala.lerp(olhoDesejado, 1 - Math.exp(-dt * 4.6));
    alvoSala.lerp(alvoDesejado, 1 - Math.exp(-dt * 5.2));
    const grandeAngular = suave(fim, 1.32, 1.97) * (1 - suave(olhoSala.length(), .18, 1.60));
    const fov = fovCorredor + (camera.aspect >= 1.22 ? 7.4 : 2.4) * grandeAngular;
    if (Math.abs(camera.fov - fov) > .05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.position.set(x + olhoSala.x, y, -z + olhoSala.z);
    camera.lookAt(olharX + alvoSala.x, olharY + alvoSala.y, -z - 2.8 + alvoSala.z);
    camera.updateMatrixWorld();
    if (reflexo) reflexo.visible = camera.aspect >= .85 && fim < 1.64;
    sala.grupo.visible = fim > .39;
    if (sala.grupo.visible) posicionarObras(salaAberta, transicao);
    else area.hidden = true;
    if (ativo >= 0) atualizarLegenda(quadroAtivo);

    luzQuadro.intensity = 29 * luz * (1 - vidro);
    if (quadroAtivo) {
      luzQuadro.position.set(quadroAtivo.lado * .78, ALTURA - .19, quadroAtivo.z - .51);
      luzQuadro.target.position.set(-quadroAtivo.lado * .22, .12, quadroAtivo.z + .52);
    }
    porta(suave(fim, .56, 1.42));
    const cta = suave(fim, 2.73, 2.96);
    chegada.style.opacity = cta;
    chegada.style.setProperty("--convite", cta);
    chegada.classList.toggle("on", cta > .02);
    abertura.style.opacity = Math.max(0, 1 - u * 1.8);
    abertura.style.transform = `translateY(${-curso * 460}px)`;

    if (primeiroQuadro || (luzQuadro.intensity > .02 && Math.abs(cursoDaSombra - curso) > .00003)) {
      renderer.shadowMap.needsUpdate = true;
      cursoDaSombra = curso;
    }
    renderer.render(scene, camera);
    if (primeiroQuadro) {
      primeiroQuadro = false;
      palco.classList.add("com-galeria");
    }
    if (pendente || passo > .002 || temVideo || transicao > .0012 || Math.abs(xOlhar - xPonteiro) + Math.abs(yOlhar - yPonteiro) > .002) pedirQuadro();
  }

  function pausar() {
    cancelAnimationFrame(frame);
    frame = 0;
    ultimoTempo = 0;
    quadros.forEach(quadro => quadro.reproduzir(false));
  }

  function visibilidade() {
    if (document.hidden || reduz.matches || !visivel) pausar();
    else pedirQuadro();
  }

  const observador = new IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting;
    visibilidade();
  });

  function desligar(evento) {
    evento.preventDefault();
    encerrado = true;
    observador.disconnect();
    eventos.abort();
    pausar();
    renderer.dispose();
    camada.remove();
    palco.classList.remove("com-galeria", "na-sala");
    progresso.replaceChildren();
    alternativa();
  }

  renderer.domElement.addEventListener("webglcontextlost", desligar, { signal });
  addEventListener("scroll", rolagem, { passive: true, signal });
  addEventListener("resize", redimensionar, { signal });
  document.addEventListener("visibilitychange", visibilidade, { signal });
  reduz.addEventListener("change", visibilidade, { signal });
  if (!compacto) {
    palco.addEventListener("pointermove", evento => {
      if (evento.pointerType !== "mouse") return;
      xPonteiro = evento.clientX / largura - .5;
      yPonteiro = .5 - evento.clientY / altura;
      pedirQuadro();
    }, { passive: true, signal });
    palco.addEventListener("pointerleave", () => {
      xPonteiro = yPonteiro = 0;
      pedirQuadro();
    }, { signal });
  }
  palco.prepend(camada);
  redimensionar();
  curso = alvo;
  ultimoZ = profundidade(-1);
  observador.observe(palco);
}
