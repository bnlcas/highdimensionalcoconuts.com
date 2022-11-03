#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float InBox(in vec2 x, vec2 top, vec2 size)
{
    vec2 base = 1.0 - step(x, top);
    vec2 span = step(x, top + size);
    return base.x * base.y * span.x * span.y;
}

void main()
{
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 baseColor = vec3(0.85,0.85,0.8);

    
    float lineWidth = 0.025;
    float inBox = 0.0;
    vec3 color;
    vec3 boxColor;

    boxColor = vec3(0.8,0.1,0.1);
    inBox = InBox(st, vec2(0.,0.7), vec2(0.2,0.33));
    color = mix(baseColor, boxColor,  clamp(inBox,0.0,1.0));

    boxColor = vec3(0.65,0.6,0.2);
    inBox = InBox(st, vec2(0.9,0.7), vec2(0.2,0.33));
    color = mix(color, boxColor,  clamp(inBox,0.0,1.0));

    boxColor = vec3(0.05,0.2,0.7);
    inBox = InBox(st, vec2(0.75,0.), vec2(0.26,0.1));
    color = mix(color, boxColor,  clamp(inBox,0.0,1.0));

    //lines:
    boxColor = vec3(0.1,0.1,0.1);
    inBox = InBox(st, vec2(0.2,0.0), vec2(lineWidth,1.0));
    inBox += InBox(st, vec2(0.73,0.0), vec2(lineWidth,1.0));
    inBox += InBox(st, vec2(0.8883,0.0), vec2(lineWidth,1.0));

    inBox += InBox(st, vec2(0.0,0.84), vec2(1.0, lineWidth));
    inBox += InBox(st, vec2(0.0,0.7), vec2(1.0, lineWidth));

    
    inBox += InBox(st, vec2(0.2,0.1), vec2(0.8, lineWidth));
    color = mix(color, boxColor,  clamp(inBox,0.0,1.0));
    gl_FragColor = vec4(color,1.0);
}