const vertexShaderSource = `#version 300 es
precision mediump float;
layout(location = 0) in vec4 a_position;
void main() { gl_Position = a_position; }`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform vec4 u_colorBack;
uniform vec4 u_colorFront;
out vec4 fragColor;
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float getSimplexNoise(vec2 uv, float t) {
  float noise = .5 * snoise(uv - vec2(0., .3 * t));
  noise += .5 * snoise(2. * uv + vec2(0., .32 * t));
  return noise;
}
const int bayer2x2[4] = int[4](0, 2, 3, 1);
float getBayerValue(vec2 uv) {
  ivec2 pos = ivec2(mod(uv, 2.0));
  int index = pos.y * 2 + pos.x;
  return float(bayer2x2[index]) / 4.0;
}
void main() {
  float t = .5 * u_time;
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float pxSize = 0.80 * u_pixelRatio;
  vec2 pxSizeUv = gl_FragCoord.xy;
  pxSizeUv -= .5 * u_resolution;
  pxSizeUv /= pxSize;
  uv = floor(pxSizeUv) * pxSize / u_resolution.xy + .5 - .5;
  float r = 25.00 * PI / 180.;
  mat2 rot = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 shape_uv = uv + vec2(0.15, 0.00);
  shape_uv *= u_resolution.xy / u_pixelRatio / 0.20;
  shape_uv = rot * shape_uv + .5;
  vec2 ditheringNoise_uv = uv * u_resolution;
  shape_uv *= .001;
  float shape = 0.5 + 0.5 * getSimplexNoise(shape_uv, t);
  shape = smoothstep(0.3, 0.9, shape);
  float dithering = getBayerValue(pxSizeUv) - 0.5;
  float res = step(.5, shape + dithering);
  vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  vec3 color = fgColor * res + bgColor * (1. - u_colorFront.a * res);
  float opacity = u_colorFront.a * res + u_colorBack.a * (1. - u_colorFront.a * res);
  fragColor = vec4(color, opacity);
}`;

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function initShaderBackground(
  canvas: HTMLCanvasElement,
  colorBack?: string,
  colorFront?: string
) {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    console.error("WebGL 2.0 not supported");
    return;
  }

  const glContext = gl;

  const vertexShader = createShader(
    glContext,
    glContext.VERTEX_SHADER,
    vertexShaderSource
  );
  const fragmentShader = createShader(
    glContext,
    glContext.FRAGMENT_SHADER,
    fragmentShaderSource
  );
  if (!vertexShader || !fragmentShader) return;

  const program = createProgram(glContext, vertexShader, fragmentShader);
  if (!program) return;

  const positionBuffer = glContext.createBuffer();
  glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
  const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
  glContext.bufferData(
    glContext.ARRAY_BUFFER,
    new Float32Array(positions),
    glContext.STATIC_DRAW
  );

  const positionLocation = glContext.getAttribLocation(program, "a_position");
  const timeLocation = glContext.getUniformLocation(program, "u_time");
  const resolutionLocation = glContext.getUniformLocation(
    program,
    "u_resolution"
  );
  const pixelRatioLocation = glContext.getUniformLocation(
    program,
    "u_pixelRatio"
  );
  const colorBackLocation = glContext.getUniformLocation(
    program,
    "u_colorBack"
  );
  const colorFrontLocation = glContext.getUniformLocation(
    program,
    "u_colorFront"
  );

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    glContext.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(time: number) {
    resize();
    glContext.useProgram(program);
    glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
    glContext.enableVertexAttribArray(positionLocation);
    glContext.vertexAttribPointer(
      positionLocation,
      2,
      glContext.FLOAT,
      false,
      0,
      0
    );

    const dpr = window.devicePixelRatio || 1;
    glContext.uniform1f(timeLocation, time * 0.001);
    glContext.uniform2f(resolutionLocation, canvas.width, canvas.height);
    glContext.uniform1f(pixelRatioLocation, dpr);

    const bgColorStr =
      colorBack ||
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-background")
        .trim();
    const fgColorStr =
      colorFront ||
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-writing-100")
        .trim();

    const parseColor = (color: string): [number, number, number] => {
      color = color.trim();

      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        return [
          parseInt(rgbMatch[1]) / 255,
          parseInt(rgbMatch[2]) / 255,
          parseInt(rgbMatch[3]) / 255,
        ];
      }

      const rgbaMatch = color.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
      );
      if (rgbaMatch) {
        return [
          parseInt(rgbaMatch[1]) / 255,
          parseInt(rgbaMatch[2]) / 255,
          parseInt(rgbaMatch[3]) / 255,
        ];
      }

      if (color.startsWith("#")) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          return [r / 255, g / 255, b / 255];
        }
      }

      const tempEl = document.createElement("div");
      tempEl.style.color = color;
      document.body.appendChild(tempEl);
      const computed = getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);

      const computedMatch = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (computedMatch) {
        return [
          parseInt(computedMatch[1]) / 255,
          parseInt(computedMatch[2]) / 255,
          parseInt(computedMatch[3]) / 255,
        ];
      }

      return [0.808, 0.804, 0.765];
    };

    const [br, bg, bb] = parseColor(bgColorStr);
    const [fr, fg, fb] = parseColor(fgColorStr);

    glContext.uniform4f(colorBackLocation, br, bg, bb, 1.0);
    glContext.uniform4f(colorFrontLocation, fr, fg, fb, 1.0);

    glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  resize();
  requestAnimationFrame(render);
}
