"use client";

import { useEffect, useRef } from "react";

const MIN_WIDTH = 820;
const MAX_PIXELS = 2_600_000;

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_pageAspect;

const float PI = 3.141592653589793;

float gyroid(vec3 p) {
  return sin(p.x) * cos(p.y)
       + sin(p.y) * cos(p.z)
       + sin(p.z) * cos(p.x);
}

float densityField(vec3 p, float edgeRatio, float pageY) {
  float verticalWave = 0.5 + 0.5 * sin(pageY * 0.34 + 0.9);
  float denseAtEdge = 1.0 - smoothstep(0.0, 1.0, edgeRatio);
  return 0.24 + denseAtEdge * 0.36 + verticalWave * 0.10;
}

float sceneDistance(vec3 p, float edgeRatio, float pageY) {
  float frequency = mix(1.05, 1.42, 1.0 - edgeRatio);
  vec3 q = p * frequency;
  q.y += sin(pageY * 0.22) * 0.45;
  q.z += cos(pageY * 0.17) * 0.32;
  float shell = abs(gyroid(q)) - densityField(q, edgeRatio, pageY);
  return shell * 0.31;
}

vec3 normalAt(vec3 p, float edgeRatio, float pageY) {
  float e = 0.018;
  float center = sceneDistance(p, edgeRatio, pageY);
  return normalize(vec3(
    sceneDistance(p + vec3(e, 0.0, 0.0), edgeRatio, pageY) - center,
    sceneDistance(p + vec3(0.0, e, 0.0), edgeRatio, pageY) - center,
    sceneDistance(p + vec3(0.0, 0.0, e), edgeRatio, pageY) - center
  ));
}

float raymarch(vec3 origin, vec3 direction, float edgeRatio, float pageY, out vec3 hitPoint) {
  float travel = 0.0;
  for (int i = 0; i < 54; i++) {
    vec3 p = origin + direction * travel;
    float d = sceneDistance(p, edgeRatio, pageY);
    if (d < 0.007) {
      hitPoint = p;
      return travel;
    }
    travel += max(d, 0.018);
    if (travel > 8.2) break;
  }
  return -1.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float edge = min(uv.x, 1.0 - uv.x);
  float band = 0.185;
  if (edge > band) discard;

  float edgeRatio = edge / band;
  float side = uv.x < 0.5 ? -1.0 : 1.0;
  float pageY = uv.y * u_pageAspect * 7.5;

  float inward = edgeRatio * 4.7 - 2.0;
  vec3 origin = vec3(inward * side, pageY, 4.2);
  vec3 direction = normalize(vec3(-0.12 * side, -0.055, -1.0));

  vec3 hitPoint = vec3(0.0);
  float hit = raymarch(origin, direction, edgeRatio, pageY, hitPoint);
  if (hit < 0.0) discard;

  vec3 normal = normalAt(hitPoint, edgeRatio, pageY);
  vec3 lightA = normalize(vec3(-0.55 * side, 0.72, 0.82));
  vec3 lightB = normalize(vec3(0.35 * side, -0.25, 0.65));
  float diffuse = max(dot(normal, lightA), 0.0);
  float fill = max(dot(normal, lightB), 0.0);
  float rim = pow(1.0 - max(dot(normal, -direction), 0.0), 2.3);

  float depthFade = 1.0 - smoothstep(4.6, 8.0, hit);
  float inwardFade = 1.0 - smoothstep(0.62, 1.0, edgeRatio);
  float alpha = (0.16 + diffuse * 0.34 + fill * 0.11 + rim * 0.22) * depthFade * inwardFade;

  vec3 deepCyan = vec3(0.17, 0.48, 0.66);
  vec3 brightCyan = vec3(0.48, 0.90, 1.0);
  vec3 color = mix(deepCyan, brightCyan, diffuse * 0.72 + rim * 0.28);
  color *= 0.76 + fill * 0.24;

  gl_FragColor = vec4(color, alpha);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function EdgeLattice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const main = canvas?.closest("main");
    if (!canvas || !main || window.innerWidth < MIN_WIDTH) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    });
    if (!gl) return;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const pageAspectLocation = gl.getUniformLocation(program, "u_pageAspect");

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let resizeTimer = 0;

    const render = () => {
      const cssWidth = Math.max(1, main.clientWidth);
      const cssHeight = Math.max(1, main.scrollHeight);
      const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
      const pixelBudgetScale = Math.sqrt(MAX_PIXELS / (cssWidth * cssHeight));
      const hardwareScale = Math.min(maxViewport[0] / cssWidth, maxViewport[1] / cssHeight);
      const scale = Math.min(0.72, pixelBudgetScale, hardwareScale);
      const renderWidth = Math.max(1, Math.floor(cssWidth * scale));
      const renderHeight = Math.max(1, Math.floor(cssHeight * scale));

      canvas.width = renderWidth;
      canvas.height = renderHeight;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      gl.viewport(0, 0, renderWidth, renderHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, renderWidth, renderHeight);
      gl.uniform1f(pageAspectLocation, cssHeight / cssWidth);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const scheduleRender = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(render, 120);
    };

    render();
    const observer = new ResizeObserver(scheduleRender);
    observer.observe(main);
    window.addEventListener("resize", scheduleRender);

    return () => {
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener("resize", scheduleRender);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <>
      <style>{`
        .edge-lattice {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: auto !important;
          bottom: auto !important;
          z-index: -1;
          display: block;
          max-width: none !important;
          pointer-events: none;
          opacity: .92;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
        @media (max-width: 819px) {
          .edge-lattice { display: none !important; }
        }
      `}</style>
      <canvas ref={canvasRef} className="edge-lattice" aria-hidden="true" />
    </>
  );
}
