var n_frames = 17; // Wow, so many images for such a short clip
var frames = [];
for(var i = 1; i < n_frames + 1; i++) {
  var filename = "slap_" + i.toString() + ".jpg"
  var frame = new Image;
  frame.src = './Assets/Images/' + filename;
  frames.push(frame);
}

var canv;
var context;
var canSlap = false;

function LoadSlap()
{
  var startButton = document.getElementById("start_button");
  startButton.remove();
  var nananan = document.getElementById("nanananana");
  nananan.play()
  nananan.volume = 0.1;

  canv = document.createElement('canvas')
  context = canv.getContext('2d');
  canv.id = 'slap';
  canv.width = 480;
  canv.height = 480;

  document.body.appendChild(canv);
  canSlap = true;
  canv.addEventListener('mousemove',(event) => { setImage(parseInt(n_frames *  (1 - window.event.clientX /window.innerWidth)))});
}

var setImage = function (newLocation) {
  context.drawImage(frames[newLocation], 0, 0, 480, 480);
}

function MousePositionSlap()
{    
    frame = parseInt(n_frames *  (1 - window.event.clientX /window.innerWidth));
    setImage(frame);
}


const videoElement = document.getElementsByClassName('input_video')[0];

var handResults;
function onResults(results) {
  handResults = results;
  if(handResults.multiHandLandmarks.length > 0)
  {
    let hand_x = handResults.multiHandLandmarks[0][9].x;
    if(typeof(hand_x) == 'number' && canSlap)
    {
      let frame = parseInt(n_frames *   Math.min(1, Math.max(0, hand_x)));
      setImage(frame);
    }
}
  //canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();