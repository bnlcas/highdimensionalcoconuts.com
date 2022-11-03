const crop_vert_code = `
attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
  }`;
 
const crop_frag_code = `
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

    gl_FragColor = (vec4(0.5) + texColor) * color;
}`;



var videoPreview;

var startTime = 0.0;
var endTime = -1;
var videoFilename = "";
var isCropped = false;


var gl;
var videoPreviewCanvas;
var videoTexture;
var buffer;
var cropVertexShader;
var cropFragShader;
var cropShaderProgram;
var copyVideo = true;

var resolution_loc;
var boxTop_loc;
var boxSpan_loc;

var isClicked = false;

var startPoint;
var endPoint;
var top;
var span;

const GetMousePostion = (e) => {
    let rect = videoPreviewCanvas.getBoundingClientRect();
    let mouseX = e.clientX || e.pageX;
    let mouseY = e.clientY || e.pageY;
    let mouse_x = (mouseX - rect.left );// * canvas.realToCSSPixels;
        let mouse_y = (videoPreviewCanvas.height - (mouseY - rect.top));// * canvas.realToCSSPixels);
        return [mouse_x, mouse_y]
}

const StartCrop = (event) => {
    isClicked = true;
    videoPreviewCanvas.style.backgroundColor = "rgba(0, 0, 0, 1)"
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
    //videoPreviewCanvas.width  = window.innerWidth;
    //videoPreviewCanvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(resolution_loc, videoPreviewCanvas.clientWidth, videoPreviewCanvas.clientWidth);
}

function InitializePreview() {
    SetupVideo("../Assets/test_movie.mp4");

    videoPreview.addEventListener("timeupdate", function(){
        if(this.currentTime >= GetEndTime()) {
            this.pause();
        }
    });

    videoPreview.ondurationchange = function()
    {
        console.log('duration changed')
        document.getElementById("EndTime").value = videoPreview.duration;
    }
    videoPreviewCanvas = document.getElementById('previewCanvas');
    gl = videoPreviewCanvas.getContext('webgl');
    //videoPreviewCanvas.width = window.innerWidth;
    //videoPreviewCanvas.height = window.innerHeight;

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
    gl.shaderSource(vertexShader, crop_vert_code);
    gl.compileShader(vertexShader);

    fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, crop_frag_code);
    gl.compileShader(fragShader);

    cropShaderProgram = gl.createProgram();
    gl.attachShader(cropShaderProgram, vertexShader);
    gl.attachShader(cropShaderProgram, fragShader);
    gl.linkProgram(cropShaderProgram);	
    gl.useProgram(cropShaderProgram);

    resolution_loc = gl.getUniformLocation(cropShaderProgram, 'u_resolution');
    boxTop_loc = gl.getUniformLocation(cropShaderProgram, 'u_boxTop');
    boxSpan_loc = gl.getUniformLocation(cropShaderProgram, 'u_boxSpan');


    videoPreviewCanvas.addEventListener("mousedown", StartCrop);
    videoPreviewCanvas.addEventListener("touchdown", StartCrop);
    
    videoPreviewCanvas.addEventListener("mousemove", UpdateCrop);
    videoPreviewCanvas.addEventListener("touchmove", UpdateCrop);
    
    window.addEventListener('mouseup', EndCrop);
    window.addEventListener('touchup', EndCrop);

    window.addEventListener('resize', UpdateCanvasSize);

    gl.uniform2f(resolution_loc, videoPreviewCanvas.clientWidth, videoPreviewCanvas.clientWidth);
    InitializeTexture(gl, cropShaderProgram);
    Render();
}


function InitializeTexture(gl, shaderProgram) {
    videoTexture = gl.createTexture();
    let image = new Image();
    videoPreview.onload = function() { HandleTextureLoaded(gl, cropShaderProgram, image, videoTexture); }
    //image.src = "../Assets/VideoCameraIcon.png"
  }
  
  function HandleTextureLoaded(gl, shaderProgram, image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_texture"), 0);
  }
  
  function SetupVideo(url) {
    videoPreview = document.createElement("video");// document.getElementById("previewVideo");
    videoPreview.src = url;
    let playing = false;
    let timeupdate = false;
  
  
    videoPreview.addEventListener('playing', () => {
       playing = true;
       checkReady();
    }, true);
  
    videoPreview.addEventListener('timeupdate', () => {
       timeupdate = true;
       checkReady();
    }, true);
  
    
    //videoPreview.play();
  
    function checkReady() {
      if (playing && timeupdate) {
        copyVideo = true;
      }
    }
}

  function UpdateTexture(gl, texture, video) {
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, video);
    gl.uniform1i(gl.getUniformLocation(cropShaderProgram, "u_texture"), 0);
  }

function Render() {

    if (copyVideo) {
        UpdateTexture(gl, videoTexture, videoPreview);
    }
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    positionLocation = gl.getAttribLocation(cropShaderProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    window.requestAnimationFrame(Render, videoPreviewCanvas);
}

const ClampTimeBounds = (x) =>
{
    return Math.max(0, Math.min(videoPreview.duration, x));
}

const GetEndTime = () => {
    return ClampTimeBounds(parseFloat(document.getElementById("EndTime").value));
}

const GetStartTime = () => {
    return ClampTimeBounds(parseFloat(document.getElementById("StartTime").value));
}

function UpdateStartTime()
{
    startTime = GetStartTime();
    videoPreview.currentTime = startTime;
}

function UpdateEndTime()
{
    endTime = GetEndTime();
    videoPreview.currentTime = endTime;
}

const PlayPreview = () =>
{
    console.log("a")
    videoPreview.currentTime = GetStartTime();
    videoPreview.play();
}

const ToggleCropTool = () => 
{
    isCropped = !isCropped;
    let cropIcon = document.getElementById("cropBtn");
        cropIcon.style.backgroundColor = isCropped ? "#878787" : "#353535";
}


const GetOutputSize = () => {
    let aspect = document.getElementById("aspect_ratio").value;
    if(aspect == "-1")
    {
        return [videoPreview.videoWidth, videoPreview.videoHeight];
    }
    else
    {
        let wh = aspect.split('x');
        let w = parseInt(wh[0]);
        let h = parseInt(wh[1]);
        let width = parseInt(document.getElementById("out_width").value);
        if(width=-1)
        {
            return [videoPreview.videoWidth, videoPreview.videoHeight];
        }
        let height = Math.round( width * h / w );
        return [width, height];
    }
}

var SetFileAddress = async ({target: { files } }) => {
    console.log("K");
    videoFilename = files[0];
    var src_url = URL.createObjectURL(videoFilename);

    UpdateVideoSrc(src_url);
}

const UpdateVideoSrc = (new_video_src) => {
    videoPreview.src = new_video_src;
    document.getElementById("download_link").href = new_video_src;
    startTime = 0.0;
    endTime = videoPreview.duration;
    document.getElementById("StartTime").value = 0;
    document.getElementById("EndTime").value = videoPreview.duration;
}

const CutVideo = async ({target: { files } }) => {
    ActivateLoadingFeedback(true);
    const { name } = videoFilename;//files[0];
    if(!ffmpeg.isLoaded())
    {
        await ffmpeg.load();
    }
    ffmpeg.FS('writeFile', name, await fetchFile(videoFilename));


    const start_time = GetStartTime();
    const duration = (GetEndTime() - startTime);
    console.log(duration)
    const playbackspeed = document.getElementById("playback_speed").value
    const out_wh = GetOutputSize();

    var filterComplex = 'setpts=PTS/' + playbackspeed.toString();
    filterComplex += ',fps=30';
    filterComplex += ",scale=" + out_wh[0].toString() + ":" + out_wh[1].toString();
    console.log(filterComplex);

  //  '-filter:v', filterComplex,
    await ffmpeg.run('-i', name, 
        '-ss', start_time.toString(), 
        '-t', duration.toString(), 
        '-filter_complex', filterComplex,
        'output.mp4');
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const new_video_src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    videoPreview.src = new_video_src;
    document.getElementById("download_link").href = new_video_src;
    
    UpdateVideoSrc(new_video_src);
    ActivateLoadingFeedback(false);
}

const ActivateLoadingFeedback = function(activate)
{
    const loadingSpinner = document.getElementById("ProgressFeedbackDiv");
    if(activate)
    {
        loadingSpinner.style.display = "block";
    }
    else
    {
        loadingSpinner.style.display = "none";
    }
}

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });
ffmpeg.setProgress(({ ratio }) => {
    const progressBar = document.getElementById("ProgressSlider");
    progressBar.value = ratio;
});
  
/*var slider = document.getElementById('IntervalSlider');
noUiSlider.create(slider, {
    start: [0, 100],
    connect: true,
    range: {
        'min': 0,
        'max': 100
    }
});*/
  

ActivateLoadingFeedback(false);
document.addEventListener('load', UpdateEndTime);
document.addEventListener('load', UpdateStartTime);
document.getElementById('StartTime').addEventListener('change', UpdateStartTime);
document.getElementById('EndTime').addEventListener('change', UpdateEndTime);
document.getElementById('uploader').addEventListener('change', SetFileAddress);// transcode);
document.getElementById('ProcessClickButton').addEventListener('click', CutVideo);
document.getElementById('PlayPreview').addEventListener('click', PlayPreview);
document.getElementById('cropBtn').addEventListener('click', ToggleCropTool);

window.onload = InitializePreview;