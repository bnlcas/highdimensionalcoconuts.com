var isClicked = false;

var startPoint;
var endPoint;
var top;
var span;

const GetMousePostion = (e) => {
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX || e.pageX;
    let mouseY = e.clientY || e.pageY;
    let mouse_x = (mouseX - rect.left );// * canvas.realToCSSPixels;
        let mouse_y = (canvas.height - (mouseY - rect.top));// * canvas.realToCSSPixels);
        return [mouse_x, mouse_y]
}

const GetScaledMousePostion = (e) => {
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX || e.pageX;
    let mouseY = e.clientY || e.pageY;
    let mouse_x = (mouseX - rect.left ) / canvas.width;// * canvas.realToCSSPixels;
        let mouse_y = (canvas.height - (mouseY - rect.top)) / canvas.height;// * canvas.realToCSSPixels);
        return [mouse_x, mouse_y]
}

const StartCrop = (event) => {
    isClicked = true;
    canvas.style.backgroundColor = "rgba(0, 0, 0, 1)"
    startPoint = GetMousePostion(event);
}

const UpdateCrop = (event) => {
    if(isClicked)
    {
        endPoint =  GetMousePostion(event);// [event.clientX, canvas.height - event.clientY];

        const topX = Math.min(startPoint[0], endPoint[0]);
        const topY = Math.min(startPoint[1], endPoint[1]);
        const spanX = Math.abs(startPoint[0] - endPoint[0]);
        const spanY = Math.abs(startPoint[1] - endPoint[1]);

        //console.log(topX, topY, spanX, spanY);
        gl.uniform2f(boxSpan_loc, spanX, spanY);
        gl.uniform2f(boxTop_loc, topX, topY);
    }
}

const EndCrop = () => {
    isClicked = false;
}

const UpdateColor = (event) => {
    position = GetScaledMousePostion(event);

    let fall_progression = position[0];

    gl.uniform1f(green_progression_loc, Math.pow(fall_progression, 0.25));
    gl.uniform1f(red_progression_loc, 1.0 - Math.pow(fall_progression, 4.0));
    //gl.uniform1f(green_progression_loc, position[0]);
    //gl.uniform1f(red_progression_loc, position[1]);

    /*
    if(position[0] < 2/3){
        let green = position[0]*1.5;
        let yellow = Math.sqrt(position[0]*1.5);
        gl.uniform1f(green_drain_loc, green);
        gl.uniform1f(yellow_bump_loc, yellow);
    } else{
        let green = position[0]*1.5;
        let yellow = Math.sqrt(position[0]*1.5);
        gl.uniform1f(green_drain_loc, green);
        gl.uniform1f(yellow_bump_loc, yellow);
    }

    let r = Math.max(1.25*(1.0-position[1])-0.25, 0.0);
    //console.log(position[0], position[1]);
    console.log(r);
    gl.uniform1f(effect_size_loc, r);*/
}

const UpdateCanvasSize = () => {
    canvas.width  =  window.innerHeight;// window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(resolution_loc, canvas.clientWidth, canvas.clientWidth);
}

//const frag_code = "#ifdef GL_ES\nprecision mediump float;\n#endif\nuniform vec2 u_resolution;\nuniform vec2 u_mouse;\nuniform vec2 u_boxTop;\nuniform vec2 u_boxSpan;\nfloat InBox(in vec2 x, in vec2 top, in vec2 size){\nvec2 base = 1.0 - step(x, top);\nvec2 span = step(x, top + size);\nreturn base.x * base.y * span.x * span.y;}\nvec4 baseColor = vec4(0.0);\nvec4 shadeColor = vec4(0.4);\nvoid main(){\nvec2 st = gl_FragCoord.xy/u_resolution.xy;\nvec2 boxTop_st = u_boxTop / u_resolution.xy;\nvec2 boxSpan_st = u_boxSpan / u_resolution.xy;\nfloat inBox = InBox(st, boxTop_st, boxSpan_st);\nvec4 color = mix(baseColor, shadeColor,  clamp(inBox,0.0,1.0));\ngl_FragColor = color;\n}"
//const vert_code = "void main(){gl_Position = gl_ProjectionMatrix * gl_ModelViewMatrix * gl_Vertex; }"
const vert_code = `
attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
  }`;
 
const frag_code = `
#ifdef GL_ES
precision mediump float;
#endif


uniform vec2 u_resolution;
uniform vec2 u_boxTop;
uniform vec2 u_boxSpan;

uniform float u_green_progression;
uniform float u_red_progression;

uniform sampler2D u_texture;
uniform sampler2D u_mask_texture;

uniform float u_time;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}


vec4 baseColor = vec4(1.0);
vec4 shadeColor = vec4(0.6);

void main()
{
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 st_yflip = st * vec2(1.0, -1.0) + vec2(0.0, 1.0);

    vec4 texColor = texture2D( u_texture, st_yflip);
    vec4 maskColor = texture2D(u_mask_texture, st_yflip);
    vec4 background = texColor * (1.0 - maskColor);


    vec2 scaled_displacement = vec2(3.6, 1.6) * (st_yflip - vec2(0.5, 0.75)) * (0.4 + 1.8 * noise(1.0 + 8.5*st));
    
    
    float central_dist = dot(scaled_displacement, scaled_displacement);
    float green_centrality = smoothstep(0.0, 1.0, clamp(2.0 * pow(u_green_progression,4.0) * (central_dist + 0.3), 0.0, 1.0));

    float green_color_progression = sqrt(u_green_progression);
    vec4 green_drain = vec4(1.0 - 0.2 * green_color_progression, 1.0 - 0.3 * green_color_progression,  1.0 - 0.05*green_color_progression, 1.0);
    vec4 yellow_bump = (0.5 * green_color_progression) * vec4(0.4, 0.5, 0.0, 1.0);

    vec4 green_fall_color = texColor * vec4(1.2, 0.8, 0.0, 1.0) + vec4(0.05, -0.05,0.0, 1.0);// green_drain + yellow_bump;
    //+ vec4(0.1, 0.1, 0.05, 1.0);// green_drain + yellow_bump;

    //green_fall_color = vec4(0.4, 0.4, 0.1, 1.0);
    
    vec4 fall_leaf_color = mix(texColor, green_fall_color, green_centrality);

    //RED

    vec2 red_scaled_displacement = vec2(4, 0.8) * (st_yflip - vec2(0.5, 0.75)) * (0.3 + 1.8 * noise(12.0*st));
    float red_central_dist = dot(red_scaled_displacement, red_scaled_displacement);
    float red_centrality = smoothstep(0.0, 1.0, clamp(2.0 * u_red_progression * (red_central_dist + 0.4), 0.0, 1.0));

    float red_color_progression = pow(u_red_progression,2.0);
    vec4 red_amp = vec4(1.0 + 0.4 * red_color_progression, 1.0,  1.0 + 0.1 * red_color_progression, 1.0);
    vec4 red_bump = vec4(0.2 * red_color_progression, 0.0,  0.01 * red_color_progression, 1.0);

    vec4 red_fall_color = green_fall_color * vec4(1.15, 0.8, 0.84, 1.0) + vec4(0.05, -0.05, -0.03, 1.0);// green_drain + yellow_bump;

    //vec4 red_fall_color = green_fall_color * red_amp + red_bump;
    //red_fall_color = vec4(1.0, 0.0, 0.0, 1.0);


    vec4 fall_leaf_color_r = mix(fall_leaf_color, red_fall_color, 1.0 - red_centrality);


    gl_FragColor = background + maskColor * fall_leaf_color_r;
    
}`;
//float steps = floor()

var gl;
var canvas;
var buffer;
var vertexShader;
var fragShader;
var program;

var resolution_loc;
var boxTop_loc;
var boxSpan_loc;
var time_loc;
var green_progression_loc;
var red_progression_loc;

var startTime;

window.onload = Init;

function Init() {
    startTime = Date.now();
    canvas        = document.getElementById('cropPreview');
    gl            = canvas.getContext('webgl');
    canvas.width  =  window.innerHeight;//window.innerWidth;
    canvas.height = window.innerHeight;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
    gl.ARRAY_BUFFER,
        new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0]),
    gl.STATIC_DRAW
    );


    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vert_code);
    gl.compileShader(vertexShader);

    fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, frag_code);
    gl.compileShader(fragShader);

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);	
    gl.useProgram(program);

    resolution_loc = gl.getUniformLocation(program, 'u_resolution');
    boxTop_loc = gl.getUniformLocation(program, 'u_boxTop');
    boxSpan_loc = gl.getUniformLocation(program, 'u_boxSpan');
    time_loc = gl.getUniformLocation(program, 'u_time');

    green_progression_loc = gl.getUniformLocation(program, 'u_green_progression');
    red_progression_loc = gl.getUniformLocation(program, 'u_red_progression');


    canvas.addEventListener("mousedown", StartCrop);
    canvas.addEventListener("touchdown", StartCrop);
    
    //canvas.addEventListener("mousemove", UpdateCrop);
    //canvas.addEventListener("touchmove", UpdateCrop);

    canvas.addEventListener("mousemove", UpdateColor);
    canvas.addEventListener("touchmove", UpdateColor);
    
    window.addEventListener('mouseup', EndCrop);
    window.addEventListener('touchup', EndCrop);

    window.addEventListener('resize', UpdateCanvasSize);

    gl.uniform2f(resolution_loc, canvas.clientWidth, canvas.clientWidth);
    InitializeTexture(gl, program);
    Render();
}

function InitializeTexture(gl, shaderProgram) {
    let texture1 = gl.createTexture();
    let image = new Image();
    image.onload = function() { HandleTextureLoaded(gl, shaderProgram, image, texture1, false); }
    image.src = "./leaf.jpg";

    let mask = new Image();
    let texture2 = gl.createTexture();
    mask.onload = function() { HandleTextureLoaded(gl, shaderProgram, mask, texture2, true); }
    mask.src = "./leaf_mask.jpg";
  }
  
  function HandleTextureLoaded(gl, shaderProgram, image, texture, is_mask) {
    if(is_mask){
        gl.activeTexture(gl.TEXTURE1);
    } else {
        gl.activeTexture(gl.TEXTURE0);
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    if(is_mask)
    {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_mask_texture"), 1);

    } else{
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_texture"), 0);

    }
    console.log(is_mask);
  }

function Render() {
    //console.log(Date.now())
    gl.uniform1f(time_loc, (Date.now() - startTime)/2000.0);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    window.requestAnimationFrame(Render, canvas);
}