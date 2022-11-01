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

const UpdateCanvasSize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
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

uniform sampler2D u_texture;

float InBox(in vec2 x, in vec2 top, in vec2 size)
{
    vec2 base = 1.0 - step(x, top);
    vec2 span = step(x, top + size);
    return base.x * base.y * span.x * span.y;
}

vec4 baseColor = vec4(1.0);
vec4 shadeColor = vec4(0.6);

void main()
{
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 st_yflip = st * vec2(1.0, -1.0) + vec2(0.0, 1.0);
    vec2 boxTop_st = u_boxTop / u_resolution.xy;
    vec2 boxSpan_st = u_boxSpan / u_resolution.xy;
    float inBox = InBox(st, boxTop_st, boxSpan_st);
    vec4 color = mix(baseColor, shadeColor,  clamp(inBox,0.0,1.0));
    vec4 texColor = texture2D( u_texture, st_yflip);

    gl_FragColor = texColor * color;
}`;


var gl;
var canvas;
var buffer;
var vertexShader;
var fragShader;
var program;

var resolution_loc;
var boxTop_loc;
var boxSpan_loc;

window.onload = Init;

function Init() {

    canvas        = document.getElementById('cropPreview');
    gl            = canvas.getContext('webgl');
    canvas.width  = window.innerWidth;
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


    canvas.addEventListener("mousedown", StartCrop);
    canvas.addEventListener("touchdown", StartCrop);
    
    canvas.addEventListener("mousemove", UpdateCrop);
    canvas.addEventListener("touchmove", UpdateCrop);
    
    window.addEventListener('mouseup', EndCrop);
    window.addEventListener('touchup', EndCrop);

    window.addEventListener('resize', UpdateCanvasSize);

    gl.uniform2f(resolution_loc, canvas.clientWidth, canvas.clientWidth);
    InitializeTexture(gl, program);
    Render();
}

function InitializeTexture(gl, shaderProgram) {
    let texture = gl.createTexture();
    let image = new Image();
    image.onload = function() { HandleTextureLoaded(gl, shaderProgram, image, texture); }
    image.src = "./base_image.jpg"
  }
  
  function HandleTextureLoaded(gl, shaderProgram, image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_texture"), 0);

  }

function Render() {

    window.requestAnimationFrame(Render, canvas);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}