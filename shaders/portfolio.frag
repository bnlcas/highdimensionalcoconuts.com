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
uniform float u_offset;

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 stCentered = st - vec2(0.5);
    vec2 sampleCoord = st + 0.05 * vec2(sin(u_offset*stCentered.x), sin(0.7*u_offset * stCentered.y));
    vec4 color = texture2D( u_tex,sampleCoord);
    gl_FragColor =  color;//vec4(color, 1.0);//u_brightness * 
}