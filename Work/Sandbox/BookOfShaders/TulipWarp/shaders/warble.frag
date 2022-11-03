#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535

uniform sampler2D u_baseTex;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float warble = 1.0;
float sampleSize = 20.0;
float edgeThresh;

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 kernelStepSize = 1.0 / u_resolution.xy;
    warble = 10.0 + u_mouse.y/100.0;
    sampleSize =  12.0 + u_mouse.x/200.0;

    vec2 tileRotDir = (step(0.5, mod((sampleSize * st),1.0)));
    vec2 centerTiledSt = mod((sampleSize * st),1.0) - 2.0 * (tileRotDir - 1.0);
    float rotDir = (step(0.3, length(centerTiledSt)));// - 2.0*( 1.0 - (step(0.4, length(centerTiledSt))));
    tileRotDir *= rotDir;
    
    vec2 samplePoint = st + kernelStepSize * warble * tileRotDir * vec2(1.1 * cos(2.0* u_time), sin(2.0*u_time));
    vec4 color = texture2D( u_baseTex, samplePoint);
    gl_FragColor = color;
}