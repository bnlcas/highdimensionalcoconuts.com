// Every pixel is an event in spacetime. The fragment shader works out which
// event (lab position + lab time) the pixel is looking at, then asks the
// history texture what was at that place at that time.
//
//   mode 0  "what you see"  - pixel lies on the ship's past light cone
//   mode 1  "ship frame"    - pixel lies on the ship's plane of simultaneity
//   mode 2  "torus frame"   - pixel lies on the lab plane of simultaneity
//
// History texture: one row per physics step (ring buffer), two texels per
// entity slot: A = (x, y, vx, vy), B = (angle, radius, shape|fade, kind).

export const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const FRAG = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uHist, uShapes, uPot, uBB;
uniform vec2 uRes, uWorld, uObsPos, uObsBeta, uLabCenter, uPotRes;
uniform float uC, uObsGamma, uObsPhi, uNow, uStart, uDtH, uPix, uLensStep;
uniform int uMode, uHead, uRows, uNumObj, uFlags;

out vec4 outColor;

const float TMIN = 300.0, TMAX = 300000.0;
const int F_DOPPLER = 1, F_BRIGHT = 2, F_LENS = 4, F_GRID = 8, F_DUST = 16, F_POT = 32;

vec4 bb(float T) {
  float u = log(clamp(T, TMIN, TMAX) / TMIN) / log(TMAX / TMIN);
  return texture(uBB, vec2(u, 0.5));
}

// Color of a blackbody of rest temperature T0 seen with Doppler factor D.
vec3 emit(float T0, float D, float I) {
  if ((uFlags & F_DOPPLER) == 0) return bb(T0).rgb * I;
  vec4 c = bb(T0 * D);
  float lum = 1.0;
  // log-luminance tone map: an HDR camera, 2.5 decades from white to black
  if ((uFlags & F_BRIGHT) != 0) lum = clamp(1.0 + (c.a - bb(T0).a) / 2.5, 0.0, 2.5);
  return c.rgb * lum * I;
}

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// (distance to outline, inside?) in normalized shape units
vec2 polyDist(vec2 q, int sid) {
  int n = int(texelFetch(uShapes, ivec2(0, sid), 0).x);
  float d = 1e9;
  bool inside = false;
  vec2 prev = texelFetch(uShapes, ivec2(n, sid), 0).xy;
  for (int j = 1; j <= 16; j++) {
    if (j > n) break;
    vec2 cur = texelFetch(uShapes, ivec2(j, sid), 0).xy;
    d = min(d, segDist(q, prev, cur));
    if ((cur.y > q.y) != (prev.y > q.y) &&
        q.x < (prev.x - cur.x) * (q.y - cur.y) / (prev.y - cur.y) + cur.x) inside = !inside;
    prev = cur;
  }
  return vec2(d, inside ? 1.0 : 0.0);
}

vec3 hash3(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yxz + 33.33);
  return fract((q.xxy + q.yzz) * q.zyx);
}

vec4 pot(vec2 x) { return texture(uPot, x / uWorld + 0.5 / uPotRes); }

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) * uPix;
  bool light = uMode == 0;
  float b2o = dot(uObsBeta, uObsBeta);
  float go = uObsGamma;

  vec2 xe;           // lab position of the event this pixel shows
  float te;          // lab time of that event
  vec2 dirInit = vec2(1.0, 0.0), dirEnd = dirInit;

  if (uMode == 2) {
    xe = uLabCenter + p;
    te = uNow;
  } else {
    // ship-frame event (tp, p) -> lab frame by the inverse Lorentz boost
    float tp = light ? -length(p) / uC : 0.0;
    vec2 dx = p;
    float dt = tp;
    if (b2o > 1e-10) {
      vec2 n = uObsBeta * inversesqrt(b2o);
      dt = go * (tp + dot(uObsBeta, p) / uC);
      dx = p + (go - 1.0) * dot(p, n) * n + go * uObsBeta * uC * tp;
    }
    te = uNow + dt;
    xe = uObsPos + dx;
    float L = length(dx);
    if (light && L > 1e-6) {
      dirInit = dx / L;
      dirEnd = dirInit;
      if ((uFlags & F_LENS) != 0) {
        // march the photon backwards through the weak field: bend by twice
        // the Newtonian amount, accumulate the Shapiro delay
        int N = int(clamp(ceil(L / uLensStep), 1.0, 96.0));
        float ds = L / float(N);
        vec2 pos = uObsPos, dir = dirInit;
        float shapiro = 0.0;
        for (int i = 0; i < 96; i++) {
          if (i >= N) break;
          vec4 P = pot(pos + 0.5 * dir * ds);
          vec2 gp = P.yz - dir * dot(dir, P.yz);
          dir = normalize(dir - 2.0 * gp * ds);
          pos += dir * ds;
          shapiro -= 2.0 * P.x * ds;
        }
        xe = pos;
        dirEnd = dir;
        te -= shapiro / uC;
      }
    }
  }

  vec2 xw = xe - uWorld * floor(xe / uWorld);
  float phiE = pot(xw).x;
  // Doppler for something at rest in the torus frame: observer motion and
  // gravitational redshift only
  float Dobs = light ? go * (1.0 + dot(dirInit, uObsBeta)) : 1.0;
  float grav = light ? sqrt((1.0 + 2.0 * phiE) / (1.0 + 2.0 * uObsPhi)) : 1.0;
  float Drest = Dobs * grav;
  float w = 1.3 * uPix;

  vec3 col = vec3(0.0);

  if (te < uStart) {
    // before t = 0: the glow of the game's own big bang
    col += emit(3000.0, Drest, 0.06);
  } else {
    if ((uFlags & F_GRID) != 0) {
      vec2 g = abs(fract(xw / 200.0 + 0.5) - 0.5) * 200.0;
      vec2 s = min(xw, uWorld - xw);
      float I = 0.045 * exp(-pow(min(g.x, g.y) / w, 2.0)) + 0.12 * exp(-pow(min(s.x, s.y) / w, 2.0));
      col += emit(6500.0, Drest, I);
    }
    if ((uFlags & F_DUST) != 0) {
      vec2 cell = floor(xw / 50.0);
      vec3 h = hash3(cell + 17.0);
      if (h.x < 0.12) {
        vec2 star = (cell + 0.15 + 0.7 * h.yz) * 50.0;
        float I = (0.25 + 5.0 * h.x) * exp(-pow(length(xw - star) / (1.2 * w), 2.0));
        col += emit(mix(3000.0, 14000.0, hash3(cell).z), Drest, I);
      }
    }
    if ((uFlags & F_POT) != 0 && phiE < -0.002) {
      float f = -phiE * 40.0;
      float e = abs(fract(f + 0.5) - 0.5);
      float I = 0.12 * (1.0 - smoothstep(0.0, 1.5 * fwidth(f), e)) + 0.08 * -phiE;
      col += emit(2200.0, Drest, I);
    }

    int k = int(ceil(max(uNow - te, 0.0) / uDtH - 1e-3));
    if (k < uRows - 1) {
      int row = uHead - k;
      if (row < 0) row += uRows;
      float ex = te - (uNow - float(k) * uDtH);
      float margin = 10.0 * uPix;
      for (int i = 0; i < 64; i++) {
        if (i >= uNumObj) break;
        vec4 B = texelFetch(uHist, ivec2(2 * i + 1, row), 0);
        int kind = int(B.w + 0.5);
        if (kind == 0) continue;
        vec4 A = texelFetch(uHist, ivec2(2 * i, row), 0);
        vec2 d = xe - (A.xy + A.zw * ex);
        d -= uWorld * floor(d / uWorld + 0.5);
        float R = B.y;
        if (dot(d, d) > (R + margin) * (R + margin)) continue;

        // undo the Lorentz contraction: back to the body's rest frame
        vec2 be = A.zw / uC;
        float b2 = dot(be, be);
        float ge = inversesqrt(max(1e-6, 1.0 - b2));
        if (b2 > 1e-10) { vec2 n = be * inversesqrt(b2); d += n * dot(d, n) * (ge - 1.0); }
        float ca = cos(B.x), sa = sin(B.x);
        vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);

        float D = light ? Dobs * grav / (ge * (1.0 + dot(dirEnd, be))) : 1.0;

        if (kind == 2) {          // bullet
          col += emit(9000.0, D, 2.2 * exp(-pow(length(q) / max(R, w), 2.0)));
        } else if (kind == 4) {   // explosion shell
          float e = abs(length(q) - R);
          col += emit(3200.0, D, B.z * (1.2 * exp(-pow(e / (1.5 * w), 2.0)) + 0.1 * exp(-e / (4.0 * w))));
        } else {                  // ship (1, 5 = thrusting) or rock (3)
          vec2 pd = polyDist(q / R, int(B.z + 0.5));
          float e = pd.x * R;
          float I = 1.6 * exp(-pow(e / w, 2.0)) + 0.12 * exp(-e / (2.5 * w)) + 0.035 * pd.y;
          col += emit(kind == 3 ? 6500.0 : 7500.0, D, I);
          if (kind == 5) {
            float fl = 0.8 + 0.5 * fract(sin(float(row) * 12.9898) * 43758.5453);
            vec2 f1 = vec2(-0.39 - 0.55 * fl, 0.0);
            float ef = min(segDist(q / R, vec2(-0.39, 0.22), f1), segDist(q / R, vec2(-0.39, -0.22), f1)) * R;
            col += emit(2600.0, D, 1.8 * exp(-pow(ef / w, 2.0)) + 0.3 * exp(-ef / (3.0 * w)));
          }
        }
      }
    }
  }

  col = 1.0 - exp(-col);
  outColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;
