#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_tex;
uniform float u_intensity;

float rho = 0.55;

void main(){
    vec2 mouse_st = u_mouse / u_resolution;
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
    //vec2 offset = mouse_st;//(0.2,0.2);
    //st = mod(st + offset * vec2(1.0,0.0), 1.0);

    /*
    vec2 centerPoint = vec2(0.5, 1.0);

    vec2 stCentered = st - centerPoint;

    float r = length(stCentered);
    float theta = atan(stCentered.y, stCentered.x);
    float x = 0.5 * r * cos(theta); + 0.5;
    float y = 0.5 * r * sin(theta); + 0.5;
    */


    float r =  tan(0.4 *PI*(1.0-st.y));
    float theta = st.x *1.0 *PI;
    float x = (1.5 - (0.8 * (mouse_st.x))) * 0.5 * r * cos(theta) + 0.5;
    float y = -(1.0 + 2.0*mouse_st.y) *0.5 * r * sin(theta) + 0.5;

    vec2 sampleCoord = mod(vec2(x,y), 1.0);
    vec4 color = texture2D( u_tex,sampleCoord);//sampleCoord);
    gl_FragColor =  color;
}