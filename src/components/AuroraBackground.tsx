// src/components/AuroraBackground.tsx
//
// Fundo de aurora boreal — shader WebGL real (calculado por pixel, na
// GPU, a cada frame), não formas SVG estáticas. As funções aurora() /
// fbmAurora() / stars() abaixo são um port quase literal de um shader de
// referência (domain warping com ruído triangular tri()/tri2() e
// acumulação de 50 camadas com paleta de cor cíclica, técnica de Inigo
// Quilez) — removi só o raymarch de terreno/montanha do original, que não
// faz sentido aqui (é só o céu, sem paisagem embaixo).
//
// Fica num <canvas> fixo à viewport, atrás do site inteiro, montado uma
// vez em src/app/[lang]/layout.tsx. Toda a paleta (--accent, --bg,
// --aurora-sky) é lida em runtime e passada como uniform pro shader — sem
// hex hardcoded no GLSL — e resincronizada a cada troca de tema
// (MutationObserver em data-theme), incluindo dark<->light: no escuro é a
// aurora "de verdade" (brilho colorido somado sobre céu quase preto); no
// claro o céu vira os tons quase-brancos de --aurora-sky e a mesma
// estrutura de ruído vira nuvem branca (só a intensidade da aurora, cor
// descartada, misturada como opacidade sobre o céu — ver uIsLight no
// shader), sem estourar pra branco puro nem virar mancha colorida sobre
// fundo claro.
//
// prefers-reduced-motion trava o uniform de tempo (o desenho para de
// animar, mas continua visível — sem "sumir" o fundo pra quem pede menos
// movimento). A visibilidade da aba pausa o loop de requestAnimationFrame
// (sem desenhar frames que ninguém vê). O parallax em scroll desloca o
// <canvas> (maior que a viewport, com margem nas bordas) via ref, sem
// re-render do React a cada pixel rolado.
//
// Custo de GPU: um shader por pixel com loop de 50 camadas (cada uma
// chamando outro loop de 5) é MUITO trabalho pra rodar todo frame, na
// tela inteira, indefinidamente — isso aquecia a GPU de verdade (relatos
// reais de ventoinha disparando). Reduzido em 4 frentes ao mesmo tempo
// (multiplicativas, então o ganho combinado é bem maior que a soma):
// loops menores (50→16 na acumulação principal, 5→3 no ruído), resolução
// interna do canvas bem menor que o CSS (RENDER_SCALE — a GPU faz o
// upscale de graça, e é um fundo borrado, então a perda de nitidez quase
// não se nota), sem multiplicar por devicePixelRatio de tela retina, e um
// teto de ~18fps (a aurora se move devagar de propósito — mais um efeito
// desejado do que uma perda, e corta o trabalho por segundo pela metade
// ou mais comparado ao refresh nativo da tela).

"use client";

import { useEffect, useRef } from "react";

const PARALLAX_FACTOR = 0.12;
const PARALLAX_MAX_PX = 35;
const CANVAS_HEIGHT_RATIO = 1.16; // 100% + a margem de cima/baixo pro parallax
const RENDER_SCALE = 0.4; // resolução interna do canvas vs. o tamanho em CSS
const TARGET_FPS = 18;
const TIME_SCALE = 0.4; // desacelera a deriva da aurora sem mexer no shader em si

const VERTEX_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Port do shader de referência — mesma lógica de ruído/acumulação,
// câmera fixa olhando pro céu (sem terreno pra orientar o raymarch
// original).
const FRAGMENT_SRC = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uAccent;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform float uIsLight;

float random(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 df = 20.0 * f * f * (f * (f - 2.0) + 1.0);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = random(i + vec2(0.5));
  float b = random(i + vec2(1.5, 0.5));
  float c = random(i + vec2(.5, 1.5));
  float d = random(i + vec2(1.5, 1.5));
  float k = a - b - c + d;
  float n = mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  return vec3(n, vec2(b - a + k * f.y, c - a + k * f.x) * df);
}

mat2 terrainProps = mat2(0.8, -0.4, 0.5, 0.8);
float fbmL(vec2 p) {
  vec2 df = vec2(0.0);
  float f = 0.0;
  float w = 0.5;
  for (int i = 0; i < 2; i++) {
    vec3 n = vnoise(p);
    df += n.yz;
    f += abs(w * n.x / (1.0 + dot(df, df)));
    w *= 0.5;
    p = 2.0 * terrainProps * p;
  }
  return f;
}

mat2 mm2(in float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float tri(in float x) { return clamp(abs(fract(x) - .5), 0.01, 0.49); }
vec2 tri2(in vec2 p) { return vec2(tri(p.x) + tri(p.y), tri(p.y + tri(p.x))); }

float fbmAurora(vec2 p, float spd) {
  float z = 1.8;
  float z2 = 2.5;
  float rz = 0.0;
  p *= mm2(p.x * 0.06);
  vec2 bp = p;
  for (float i = 0.0; i < 3.0; i++) {
    vec2 dg = tri2(bp * 1.85) * .75;
    dg *= mm2(uTime * spd);
    p -= dg / z2;
    bp *= 1.3;
    z2 *= .45;
    z *= .42;
    p *= 1.21 + (rz - 1.0) * .02;
    rz += tri(p.x + tri(p.y)) * z;
    p *= sin(uTime * 0.05) * cos(uTime * 0.01);
  }
  return clamp(1.0 / pow(rz * 20.0, 1.3), 0.0, 1.0);
}

vec4 aurora(vec3 rd) {
  vec4 col = vec4(0.0);
  vec4 avgCol = vec4(0.0);

  for (float i = 0.0; i < 20.0; i++) {
    float of = 0.006 * random(gl_FragCoord.xy) * smoothstep(0.0, 15.0, i);
    float pt = ((.8 + pow(i, 1.4) * .002)) / (rd.y * 2.0 + 0.4);
    pt -= of;
    vec3 bpos = 5.5 + pt * rd;
    vec2 p = bpos.zx;
    float rzt = fbmAurora(p, 0.06);
    vec4 col2 = vec4(0.0, 0.0, 0.0, rzt);
    col2.rgb = (sin(1.0 - vec3(2.15, -.5, 1.2) + i * 0.043) * 0.5 + 0.5) * rzt;
    avgCol = mix(avgCol, col2, .5);
    col += avgCol * exp2(-i * 0.065 - 2.5) * smoothstep(0.0, 5.0, i);
  }
  col *= clamp(rd.y * 15.0 + .4, 0.0, 1.0);

  return smoothstep(0.0, 1.1, pow(col, vec4(1.0)) * 1.4);
}

vec3 stars(vec2 p) {
  float r = fbmL(p * 20.0);
  // smoothstep em vez de step: borda suave em vez de um pixel 100% aceso
  // vs. apagado — na resolução interna reduzida, uma borda dura vira um
  // bloco visível em vez de um pontinho.
  float isStar = smoothstep(0.68, 0.78, r);
  return vec3(r) * isStar;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;

  // Câmera fixa olhando pro céu — sem viés artificial de rd.y: é
  // justamente a variação natural dele (negativo embaixo, positivo em
  // cima) que faz o próprio termo clamp(rd.y*15+.4, 0, 1) dentro de
  // aurora() apagar a aurora perto do "horizonte" (embaixo da tela) e
  // mostrar só céu escuro ali — sem isso a aurora cobre o quadro inteiro
  // sem variação nenhuma.
  vec2 p = (-uResolution.xy + 2.0 * gl_FragCoord.xy) / uResolution.y;
  vec3 rd = normalize(vec3(p.x, p.y + 0.15, 1.3));

  // uv.y=0 é embaixo na tela (convenção do gl_FragCoord) — sem o
  // mix(0.45, 1.0, ...) abaixo, embaixo iria 100% pro uSkyTop (--bg,
  // branco) e ficava clarinho/lavado demais rápido demais. Com o piso em
  // 0.45, embaixo já começa numa mistura considerável com o azul do céu —
  // ainda um gradiente (não uniforme), só que mais contido.
  vec3 color = mix(uSkyTop, uSkyBottom, mix(0.45, 1.0, uv.y));
  // Estrelas em coordenada de tela direta (p), não projetadas via
  // rd.xz/rd.y — perto do "horizonte" essa divisão amplifica demais
  // qualquer variação vertical e estica o que devia ser um pontinho numa
  // estria comprida. Somem no claro: pontinho branco sobre céu claro não
  // lê como estrela, só como ruído.
  color += stars(p * 2.2) * (1.0 - uIsLight);
  vec3 auroraColor = aurora(rd).rgb;
  // Viés sutil na direção do verde do próprio tema (--accent), sem
  // sobrescrever a mistura de cor que o shader já produz.
  auroraColor = mix(auroraColor, auroraColor * uAccent * 1.4, 0.1);

  // Composição escura: soma aditiva direta (brilho colorido sobre céu
  // quase preto).
  vec3 darkResult = color + auroraColor;
  // Composição clara: em vez do brilho arco-íris, vira nuvem branca sobre
  // céu claro — usa só a intensidade (luminância) da aurora, não a cor,
  // misturada como opacidade (não somada) pro branco. Cor arco-íris sobre
  // fundo claro não lê como aurora, lê como mancha; branco sobre azul bem
  // claro lê como nuvem. smoothstep numa faixa estreita em vez de
  // clamp(x*k) linear — precisa de uma borda com contraste de verdade
  // entre "é céu" e "é nuvem", senão vira uma mistura uniforme sem forma
  // nenhuma (só um degradê a mais, não uma nuvem).
  // Piso bem baixo (0.02): no escuro qualquer resquício de auroraColor já
  // clareia visivelmente o quase-preto, então a aurora "se espalha" bem
  // além dos núcleos das faixas; com um piso alto aqui, a versão clara só
  // desenhava nuvem nesses núcleos e cobria bem menos tela que o escuro.
  float cloudLuma = dot(auroraColor, vec3(0.299, 0.587, 0.114));
  float cloudIntensity = smoothstep(0.02, 0.34, cloudLuma);
  vec3 lightResult = mix(color, vec3(1.0), cloudIntensity);
  color = mix(darkResult, lightResult, uIsLight);

  color = pow(color, vec3(1.0 / 2.2));
  color = smoothstep(0.0, 1.0, color);

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

  return program;
}

// Lê um token de cor do tema atual (--accent, --bg, --aurora-sky...) e
// converte de hex pra vec3 0-1 — o shader não tem nenhuma cor hardcoded,
// recebe a paleta em runtime, e portanto reage à troca de tema.
function readTokenRgb(varName: string, fallback: [number, number, number]): [number, number, number] {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  // Chrome serializa a custom property normalizando hex de 6 dígitos pro
  // formato curto quando possível (#ffffff -> #fff) — sem aceitar as duas
  // formas aqui, --bg branco caía sempre no fallback escuro.
  const long = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (long) {
    return [parseInt(long[1], 16) / 255, parseInt(long[2], 16) / 255, parseInt(long[3], 16) / 255];
  }
  const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  if (short) {
    return [
      parseInt(short[1] + short[1], 16) / 255,
      parseInt(short[2] + short[2], 16) / 255,
      parseInt(short[3] + short[3], 16) / 255,
    ];
  }
  return fallback;
}

function clamp(value: number, max: number) {
  return Math.max(-max, Math.min(max, value));
}

// O shader é pintado só pra pintar um céu bem escuro (cores de "sky"
// o céu (uSkyTop/uSkyBottom via --bg/--aurora-sky) e a composição da
// aurora (uIsLight, "screen" contra claro em vez de soma aditiva) reagem
// ao tema — ver syncThemeUniforms() dentro do efeito principal. O véu
// escuro (dark overlay pro contraste do texto) segue escondido no claro
// via CSS puro (`:root[data-theme="light"] .aurora-veil` em globals.css) —
// desnecessário contra um céu já claro.
function readIsLight(): boolean {
  return document.documentElement.getAttribute("data-theme") === "light";
}

export function AuroraBackground() {
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const layer = layerRef.current;
    if (!canvas || !layer) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return; // sem WebGL: --bg sólido do container fixo continua de fundo

    const program = createProgram(gl);
    if (!program) return;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Triângulo único cobrindo a tela toda — mais barato que dois
    // triângulos formando um quad.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, "uTime");
    const resLoc = gl.getUniformLocation(program, "uResolution");
    const accentLoc = gl.getUniformLocation(program, "uAccent");
    const skyTopLoc = gl.getUniformLocation(program, "uSkyTop");
    const skyBottomLoc = gl.getUniformLocation(program, "uSkyBottom");
    const isLightLoc = gl.getUniformLocation(program, "uIsLight");

    // Paleta inteira lida dos tokens CSS do tema atual, sem nada
    // hardcoded no JS/GLSL — reage à troca de tema (ver themeObserver
    // abaixo).
    function syncThemeUniforms() {
      const isLight = readIsLight();
      gl!.uniform3fv(accentLoc, readTokenRgb("--accent", [0.4, 0.7, 0.4]));
      gl!.uniform3fv(skyTopLoc, readTokenRgb("--bg", [0.02, 0.02, 0.03]));
      gl!.uniform3fv(skyBottomLoc, readTokenRgb("--aurora-sky", [0.07, 0.1, 0.21]));
      gl!.uniform1f(isLightLoc, isLight ? 1 : 0);
    }
    syncThemeUniforms();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      // Resolução interna do canvas propositalmente menor que o CSS — a
      // GPU faz o upscale de graça no compositing, sem custo extra de
      // shader, e a perda de nitidez não se nota num fundo borrado. Sem
      // multiplicar por devicePixelRatio: numa tela retina isso sozinho
      // já quadruplicaria o trabalho por frame.
      const width = Math.round(window.innerWidth * RENDER_SCALE);
      const height = Math.round(window.innerHeight * CANVAS_HEIGHT_RATIO * RENDER_SCALE);
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
        gl!.viewport(0, 0, width, height);
      }
    }
    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / TARGET_FPS;
    const start = performance.now();

    function frame(now: number) {
      if (now - lastFrameTime >= frameInterval) {
        lastFrameTime = now;
        const t = reduceMotion ? 0 : ((now - start) / 1000) * TIME_SCALE;
        gl!.uniform1f(timeLoc, t);
        gl!.uniform2f(resLoc, canvas!.width, canvas!.height);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      }
      if (!document.hidden) rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    // Reage à troca de tema em tempo real (o toggle não recarrega a
    // página): reler e reenviar a paleta pro shader.
    const themeObserver = new MutationObserver(syncThemeUniforms);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    function onVisibility() {
      if (!document.hidden && !rafId) rafId = requestAnimationFrame(frame);
    }
    document.addEventListener("visibilitychange", onVisibility);

    let ticking = false;
    function applyParallax() {
      const offset = clamp(window.scrollY * PARALLAX_FACTOR, PARALLAX_MAX_PX);
      layer!.style.transform = `translateY(${offset}px)`;
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
    applyParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg" aria-hidden="true">
        <div ref={layerRef} className="aurora-layer absolute inset-x-0" style={{ top: "-8%", bottom: "-8%" }}>
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      </div>
      {/* Véu escuro sobre a aurora — só existe pra dar contraste de texto
          contra o shader, então some junto com ele no tema claro (classe
          `aurora-veil`, escondida via CSS em globals.css — senão é só um
          filtro cinza sobre o branco). No mobile o conteúdo usa a largura
          quase inteira da tela (título quebra em duas linhas encostando
          nas bordas), então o véu ali é sólido, cobrindo 100% da largura —
          sem o esmaecimento lateral, que deixaria as bordas mais claras
          bem onde o texto pode chegar. Esmaecimento lateral (60vw centrais
          cravados + 20vw de cada lado esvanecendo) só a partir do `md`,
          onde o conteúdo já fica centralizado com folga das bordas. */}
      <div className="aurora-veil pointer-events-none fixed inset-0 -z-[9] bg-black/78 md:hidden" aria-hidden="true" />
      <div
        className="aurora-veil pointer-events-none fixed inset-0 -z-[9] hidden md:block"
        style={{
          background:
            "linear-gradient(to right, " +
            "transparent 0%, " +
            "rgba(0, 0, 0, 0.2) 5%, " +
            "rgba(0, 0, 0, 0.5) 12.5%, " +
            "rgba(0, 0, 0, 0.78) 25%, " + // estabiliza
            "rgba(0, 0, 0, 0.78) 75%, " + // começa a esvanecer
            "rgba(0, 0, 0, 0.5) 87.5%, " +
            "rgba(0, 0, 0, 0.2) 95%, " +
            "transparent 100%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
