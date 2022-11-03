#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535

uniform sampler2D u_baseTex;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;


float loopRad = 1.0;
float sampleSize = 20.0;

float RGB2Luminosity(in vec3 color)
{
    return 0.3*color.r + 0.59*color.g + 0.11*color.b;
}

vec2 Gradient(in sampler2D u_tex, in vec2 st, in vec2 stepSize)
{
    float Gx = 0.0;
    Gx += RGB2Luminosity(texture2D(u_tex, st - vec2(stepSize.x, -stepSize.y)).rbg);
    Gx += 2.0 * RGB2Luminosity(texture2D(u_tex, st - vec2(stepSize.x, 0.0)).rbg);
    Gx += RGB2Luminosity(texture2D(u_tex, st - vec2(stepSize.x, stepSize.y)).rbg);

    Gx -= RGB2Luminosity(texture2D(u_tex, st + vec2(stepSize.x, -stepSize.y)).rbg);
    Gx -= 2.0 * RGB2Luminosity(texture2D(u_tex, st + vec2(stepSize.x, 0.0)).rbg);
    Gx -= RGB2Luminosity(texture2D(u_tex, st + vec2(stepSize.x, stepSize.y)).rbg);

    float Gy = 0.0;
    Gy -= RGB2Luminosity(texture2D(u_tex, st - vec2(-stepSize.x, stepSize.y)).rbg);
    Gy -= 2.0 * RGB2Luminosity(texture2D(u_tex, st - vec2(stepSize.x, stepSize.y)).rbg);
    Gy -= RGB2Luminosity(texture2D(u_tex, st - vec2(stepSize.x, stepSize.y)).rbg);

    Gy += RGB2Luminosity(texture2D(u_tex, st + vec2(-stepSize.x, stepSize.y)).rbg);
    Gy += 2.0 * RGB2Luminosity(texture2D(u_tex, st + vec2(stepSize.x, stepSize.y)).rbg);
    Gy += RGB2Luminosity(texture2D(u_tex, st + vec2(stepSize.x, stepSize.y)).rbg);
    return vec2(Gx, Gy);
}


void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 kernelStepSize = 1.0 / u_resolution.xy;


    vec2 grad = Gradient(u_baseTex, st, kernelStepSize);
    //grad = grad/length(grad);
    loopRad = 10.0 + u_mouse.y/100.0;
    //sampleSize =  12.0 + u_mouse.x/200.0;
    float theta_offset = atan(grad.y, grad.x);

    vec2 loopedSample = st + 1.0 * kernelStepSize * (grad + vec2(cos(2.0 * u_time + theta_offset), sin(2.0 * u_time + theta_offset)));
    
    vec4 color = texture2D( u_baseTex, loopedSample);
    gl_FragColor = color;
}