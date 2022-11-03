const vert_code = `
attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
  }`;
 
const frag_code = `
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define HALF_PI 1.57079632679

uniform vec2 u_resolution;
uniform sampler2D u_texture;
uniform float u_offset;

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 stCentered = st - vec2(0.5);
    vec2 sampleCoord = st + 0.05 * vec2(sin(u_offset*stCentered.x), sin(0.7*u_offset * stCentered.y));
    vec4 color = texture2D( u_texture,sampleCoord);
    gl_FragColor =  color;
}`;


var gl;
var canvas;
var buffer;
var vertexShader;
var fragShader;
var program;

var scrollDist = 0.0;
var offset_loc;
var resolution_loc;
window.onload = Init;


const UpdateCanvasSize = () => {
    console.log('resize');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(resolution_loc, canvas.clientWidth, canvas.clientWidth);
}

function Init() {

    canvas        = document.getElementById('backgroundCanvas');
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
    offset_loc = gl.getUniformLocation(program, 'u_offset');


    window.addEventListener('resize', UpdateCanvasSize);

    gl.uniform2f(resolution_loc, canvas.clientWidth, canvas.clientWidth);
    InitializeTexture(gl, program);
    Render();
}

function InitializeTexture(gl, shaderProgram) {
    let texture = gl.createTexture();
    let image = new Image();
    image.onload = function() { HandleTextureLoaded(gl, shaderProgram, image, texture); }
    image.src = "../Assets/Orange_Edges.jpg"
  }
  
  function HandleTextureLoaded(gl, shaderProgram, image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_texture"), 0);
  }

function Render() {

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    scrollDist = Math.max(0, window.pageYOffset);
    let vertexDistortion = 4 + Math.pow( scrollDist / 100, 1.2);
    gl.uniform1f(offset_loc, vertexDistortion);

    window.requestAnimationFrame(Render, canvas);
}