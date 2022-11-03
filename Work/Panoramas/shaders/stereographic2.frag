#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define TAU 6.283185307

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_tex;
uniform float u_intensity;


void main(){
    vec2 mouse_st = u_mouse / u_resolution;
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 st_centered = st - vec2(0.5);

    float r = length(st_centered);
    float theta_long = atan(st_centered.y, st_centered.x);
//u_time * 0.1 
    float sample_x = mod(0.23 + (theta_long + PI) / TAU, 1.0);

//-u_time * 0.25 + 
    float theta_lat = acos((4.0 - pow(r,2.0))/(4.0 + pow(r,2.0)));
    float sample_y = 1.4 * theta_lat;//, 1.0);
    vec4 color = texture2D( u_tex,vec2(sample_x, sample_y));//sampleCoord);


    //vec2 sampleCoord = mod(vec2(x,y), 1.0);
    //vec4 color = texture2D( u_tex,sampleCoord);//sampleCoord);
    gl_FragColor =  color;
}