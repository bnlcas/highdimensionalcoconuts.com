#ifdef GL_ES
precision mediump float;
#endif
#define PI 3.1415926535
#define HALF_PI 1.57079632679

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_tex;
uniform vec2 u_texResolution;
uniform float u_brightness;


void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec4 color = texture2D(u_tex, st);
    gl_FragColor = u_brightness * color;//vec4(color, 1.0);
}