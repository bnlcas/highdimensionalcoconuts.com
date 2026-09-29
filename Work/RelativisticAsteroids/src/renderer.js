import { VERT, FRAG } from './shaders.js';
import { blackbodyTable, BB_N, WORLD, PHYS_DT } from './physics.js';
import { buildShapes, N_SHAPES } from './shapes.js';

export const MAX_OBJ = 64;
export const HIST_ROWS = 2048; // ~17 s of lab time: how far back the universe is remembered

// Ring buffer of world snapshots, one row per physics step.
export class History {
  constructor() {
    this.stride = MAX_OBJ * 2 * 4;
    this.data = new Float32Array(HIST_ROWS * this.stride);
    this.clear();
  }
  clear() {
    this.data.fill(0);
    this.head = HIST_ROWS - 1;
    this.pending = HIST_ROWS; // rows needing upload
  }
  // Returns a view onto the next row, to be filled by the caller.
  push() {
    this.head = (this.head + 1) % HIST_ROWS;
    this.pending = Math.min(this.pending + 1, HIST_ROWS);
    const row = this.data.subarray(this.head * this.stride, (this.head + 1) * this.stride);
    row.fill(0);
    return row;
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 is required');
    this.gl = gl;
    this.prog = this.program(VERT, FRAG);
    this.u = {};
    const n = gl.getProgramParameter(this.prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(this.prog, i).name;
      this.u[name] = gl.getUniformLocation(this.prog, name);
    }
    gl.bindVertexArray(gl.createVertexArray());

    this.histTex = this.texture(gl.RGBA32F, MAX_OBJ * 2, HIST_ROWS, gl.NEAREST, gl.CLAMP_TO_EDGE, null);
    const shapes = buildShapes();
    this.shapes = shapes.shapes;
    this.shapeTex = this.texture(gl.RGBA32F, shapes.texWidth, N_SHAPES, gl.NEAREST, gl.CLAMP_TO_EDGE, shapes.tex);
    this.bbTex = this.texture(gl.RGBA16F, BB_N, 1, gl.LINEAR, gl.CLAMP_TO_EDGE, blackbodyTable());
    this.potTex = null;
    this.resolutionScale = 0.75;
  }

  program(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  texture(internal, w, h, filter, wrap, data) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  }

  uploadHistory(hist) {
    const gl = this.gl;
    const n = hist.pending;
    if (!n) return;
    gl.bindTexture(gl.TEXTURE_2D, this.histTex);
    const w = MAX_OBJ * 2;
    const put = (r0, count) => gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, r0, w, count, gl.RGBA, gl.FLOAT,
      hist.data.subarray(r0 * hist.stride, (r0 + count) * hist.stride));
    if (n >= HIST_ROWS) put(0, HIST_ROWS);
    else {
      const start = hist.head - n + 1;
      if (start >= 0) put(start, n);
      else { put(start + HIST_ROWS, -start); put(0, hist.head + 1); }
    }
    hist.pending = 0;
  }

  uploadPotential(field) {
    const gl = this.gl;
    if (!this.potTex) {
      this.potTex = this.texture(gl.RGBA16F, field.nx, field.ny, gl.LINEAR, gl.REPEAT, field.tex);
      this.potRes = [field.nx, field.ny];
    } else {
      gl.bindTexture(gl.TEXTURE_2D, this.potTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, field.nx, field.ny, gl.RGBA, gl.FLOAT, field.tex);
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * this.resolutionScale;
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
    }
  }

  // view: {mode, obsPos, obsBeta, obsGamma, obsPhi, now, start, head, numObj, flags, c, zoom, lensStep}
  draw(view) {
    const gl = this.gl, u = this.u;
    this.resize();
    const W = this.canvas.width, H = this.canvas.height;
    gl.viewport(0, 0, W, H);
    gl.useProgram(this.prog);

    // lab mode fits the whole torus; ship modes show `zoom` torus-widths
    const pix = view.mode === 2
      ? Math.max(WORLD.W / W, WORLD.H / H) * 1.04
      : Math.max(WORLD.W / W, WORLD.H / H) * view.zoom;

    const tex = [this.histTex, this.shapeTex, this.potTex, this.bbTex];
    ['uHist', 'uShapes', 'uPot', 'uBB'].forEach((name, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex[i]);
      gl.uniform1i(u[name], i);
    });
    gl.uniform2f(u.uRes, W, H);
    gl.uniform2f(u.uWorld, WORLD.W, WORLD.H);
    gl.uniform2f(u.uObsPos, view.obsPos.x, view.obsPos.y);
    gl.uniform2f(u.uObsBeta, view.obsBeta.x, view.obsBeta.y);
    gl.uniform2f(u.uLabCenter, WORLD.W / 2, WORLD.H / 2);
    gl.uniform2f(u.uPotRes, this.potRes[0], this.potRes[1]);
    gl.uniform1f(u.uC, view.c);
    gl.uniform1f(u.uObsGamma, view.obsGamma);
    gl.uniform1f(u.uObsPhi, view.obsPhi);
    gl.uniform1f(u.uNow, view.now);
    gl.uniform1f(u.uStart, view.start);
    gl.uniform1f(u.uDtH, PHYS_DT);
    gl.uniform1f(u.uPix, pix);
    gl.uniform1f(u.uLensStep, view.lensStep || 24);
    gl.uniform1i(u.uMode, view.mode);
    gl.uniform1i(u.uHead, view.head);
    gl.uniform1i(u.uRows, HIST_ROWS);
    gl.uniform1i(u.uNumObj, view.numObj);
    gl.uniform1i(u.uFlags, view.flags);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return pix;
  }
}
