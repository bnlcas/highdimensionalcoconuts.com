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