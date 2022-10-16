#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_baseTex;
uniform float u_threshold;

float luminosityThresh = 0.5;
float edgeThresh = 0.5;
float highLumaValue = 0.5;

float RGB2Luminosity(in vec3 color)
{
    return 0.3*color.r + 0.59*color.g + 0.11*color.b;
}
float sobel(in sampler2D u_tex, in vec2 st, in vec2 stepSize)
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
    return sqrt(Gx*Gx + Gy*Gy);
}

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 kernelStepSize = 1.0 / u_resolution.xy;
    luminosityThresh = u_mouse.y/1000.0;
    edgeThresh =  u_mouse.x/1000.0;

    float sobelEdge = sobel(u_baseTex, st, kernelStepSize);

    vec4 color = texture2D( u_baseTex, st);
    float luminosity = RGB2Luminosity(color.rgb);
    vec3 segmentedImage = vec3(step(edgeThresh, sobelEdge) + highLumaValue * step(luminosityThresh, luminosity));
    gl_FragColor =  vec4(segmentedImage, 1.0);
}