#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec2 flipST(in vec2 x)
{
    return x * vec2(1.0, -1.0) + vec2(0.0,1.0);
}

float InBox(in vec2 x, in vec2 top, in vec2 size)
{
    vec2 base = 1.0 - step(x, top);
    vec2 span = step(x, top + size);
    return base.x * base.y * span.x * span.y;
}

void main()
{
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st = flipST(st);
    vec2 mouse_st = flipST(u_mouse / u_resolution);

    vec3 baseColor = vec3(0.85,0.85,0.8);

    float lineWidth = 0.025;
    vec2 redTop = vec2(0.0, 0.0);
    vec2 redSpan = mouse_st;//vec2(0.2, 0.3);

    vec2 blueTop = redTop + redSpan + vec2(lineWidth);
    vec2 blueWidth = vec2(1.0 - (redSpan.x + lineWidth), min(0.4, 1.0 - 1.0*redSpan.y - 2.0* lineWidth));

    float inBox = 0.0;
    vec3 color;
    vec3 boxColor;

    boxColor = vec3(0.8,0.1,0.1);
    inBox = InBox(st, redTop, redSpan);
    color = mix(baseColor, boxColor,  clamp(inBox,0.0,1.0));

    boxColor = vec3(0.05,0.2,0.7);
    inBox = InBox(st, blueTop, blueWidth);
    color = mix(color, boxColor,  clamp(inBox,0.0,1.0));

    //lines:
    boxColor = vec3(0.1,0.1,0.1);
    inBox = InBox(st, redTop + vec2(redSpan.x, 0.0), vec2(lineWidth, 1.0));

    inBox += InBox(st, redTop + vec2(0.0, redSpan.y), vec2(1.0, lineWidth));
    
    inBox += InBox(st, blueTop + vec2(0.0, blueWidth.y), vec2(blueWidth.x, lineWidth));
    
    inBox += InBox(st, vec2(0.0, 1.0 - lineWidth), vec2(redSpan.x, lineWidth));

    color = mix(color, boxColor,  clamp(inBox,0.0,1.0));

    gl_FragColor = vec4(color,1.0);
}