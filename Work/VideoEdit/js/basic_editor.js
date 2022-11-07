var videoPreview = document.getElementById("preview")

var startTime = 0.0;
var endTime = -1;
var videoFilename = "";
var isCropped = false;
var isCropClicked = false;

var cropStartPoint;
var cropEndPoint;

const GetCropMousePostion = (e) => {
    let rect = videoPreview.getBoundingClientRect();
    let mouseX = e.clientX;
    let mouseY = e.clientY;
    //console.log(mouseX, mouseY);
    //let mouse_x = (mouseX - rect.left );// * canvas.realToCSSPixels;
    //let mouse_y = (rect.height - (mouseY - rect.top));// * canvas.realToCSSPixels);
    return [mouseX, mouseY]
}

const StartCrop = (event) => {
    if(isCropped)
    {
        cropStartPoint = GetCropMousePostion(event);
        videoPreview.pause();
        videoPreview.controls = false;
    }
    isCropClicked = true;
}

const UpdateCrop = (event) => {
    if(isCropped && isCropClicked)
    {
        cropEndPoint =  GetCropMousePostion(event);// [event.clientX, canvas.height - event.clientY];
        const topX = Math.min(cropStartPoint[0], cropEndPoint[0]);
        const topY = Math.min(cropStartPoint[1], cropEndPoint[1]);
        let spanX = Math.abs(cropStartPoint[0] - cropEndPoint[0]);
        let spanY = Math.abs(cropStartPoint[1] - cropEndPoint[1]);

        let box = document.getElementById("cropRect");
        let aspect = document.getElementById("aspect_ratio").value;
        if(aspect != "-1")
        {
            const aspect_wh = aspect.split('x');
            const w = parseFloat(aspect_wh[0]);
            const h = parseFloat(aspect_wh[1]);
            if(w > h)
            {
                spanY = spanX * h / w;
            }
            else
            {
                spanX = spanY * w / h;
            }
        }

        box.x.baseVal.value = topX;
        box.y.baseVal.value = topY;
        box.width.baseVal.value = spanX;
        box.height.baseVal.value = spanY;

        //SetCropBounds(true);

    }
    if(isCropClicked){
        cropEndPoint =  GetCropMousePostion(event);// [event.clientX, canvas.height - event.clientY];
    }
}

const EndCrop = () => {
    isCropClicked = false;
    if(isCropped)
    {
        videoPreview.controls = true;
        videoPreview.pause();
    }
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

videoPreview.addEventListener("timeupdate", function(){
    if(this.currentTime >= GetEndTime()) {
        this.pause();
    }
});

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
    if(isCropped)
    {
        let box = document.getElementById("cropRect");
        filterComplex += ',crop=' + box.width.baseVal.value.toString() + ':'
        + box.height.baseVal.value.toString() + ':'
        + box.x.baseVal.value.toString() + ':'
        + box.y.baseVal.value.toString();
    }
    if(out_wh[0] > 0)
    {
        filterComplex += ",scale=" + out_wh[0].toString() + ":" + out_wh[1].toString();
    }
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
  
videoPreview.ondurationchange = function()
{
    console.log('duration changed')
    document.getElementById("EndTime").value = videoPreview.duration;
}

ActivateLoadingFeedback(false);
document.addEventListener('load', UpdateEndTime);
document.addEventListener('load', UpdateStartTime);
document.getElementById('StartTime').addEventListener('change', UpdateStartTime);
document.getElementById('EndTime').addEventListener('change', UpdateEndTime);
document.getElementById('uploader').addEventListener('change', SetFileAddress);// transcode);
document.getElementById('ProcessClickButton').addEventListener('click', CutVideo);
document.getElementById('PlayPreview').addEventListener('click', PlayPreview);
document.getElementById('cropBtn').addEventListener('click', ToggleCropTool);

videoPreview.addEventListener("mousedown", StartCrop);
videoPreview.addEventListener("touchdown", StartCrop);
videoPreview.addEventListener("mousemove", UpdateCrop);
videoPreview.addEventListener("touchmove", UpdateCrop);
window.addEventListener('mouseup', EndCrop);
window.addEventListener('touchup', EndCrop);