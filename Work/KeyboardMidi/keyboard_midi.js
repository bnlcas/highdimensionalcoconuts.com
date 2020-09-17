document.addEventListener('keydown', PlaySound);

var sound1 = document.getElementById("1");
var sound2 = document.getElementById("2");
var sound3 = document.getElementById("3");
var sound4 = document.getElementById("4");
var sound5 = document.getElementById("5");
var sound6 = document.getElementById("6");
var sound7 = document.getElementById("7");
var sound8 = document.getElementById("8");
var sound9 = document.getElementById("9");

function PlaySound(e) {
  switch(e.key) {
  case '1':
    sound1.play();
    break;
  case '2':
    sound2.play();
    break;
  case '3':
    sound3.play();
    break;
  case '4':
    sound4.play();
    break;
  case '5':
    sound5.play();
    break;
  case '6':
    sound6.play();
    break;
  case '7':
    sound7.play();
    break;
  case '8':
    sound8.play();
    break;
  default:
  }
}
