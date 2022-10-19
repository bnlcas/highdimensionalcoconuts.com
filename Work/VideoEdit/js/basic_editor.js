var videoPreview = document.getElementById("preview")

var startTime = 0.0;
var endTime = -1;
var videoFilename = "";
var isCropped = false;

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
  
videoPreview.ondurationchange = function()
{
    console.log('tmp')
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