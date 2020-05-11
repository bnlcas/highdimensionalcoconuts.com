var entryField;
var inputParagraph;// = document.getElementById("p");
var targetParagraph;// = document.getElementById("target");
var results = "";
var added_text = "";

var frameTime = 100;
var latency = 50;
var update = setInterval(drawWLatency, frameTime);

var stimulusTime = 3000;
var nTrials = 48;
var trialNumber = 0;
var targetText = "";
var inputText = "";
var displayingTarget = false;



$(document).ready(function () {
    $("#textEntry").keydown(function(e)
    {
      if(!displayingTarget)
      {
        var keynum = e.keyCode;

        if(keynum == 13)
        {
          newTrial()
        }
        else
        {
          if(keynum == 8)
          {
            DeleteCharacter();
          }
          else
          {
            added_text += String.fromCharCode(keynum).toLowerCase();
          }
        }

      }
      setTimeout(() => entryField.value = "",1);
    });
});


function start()
{
  entryField = document.getElementById("textEntry");
  inputParagraph = document.getElementById("inputReadout");
  targetParagraph = document.getElementById("target");
}

function drawWLatency()
{
  var current_text = added_text;
  setTimeout(() => draw(current_text), latency);
  added_text = "";
}


function draw(inputText)
{
  inputParagraph.innerHTML += inputText;
}

function editFrameRate()
{
  frameTime = parseInt(document.getElementById("FrameTime").value, 10);
  clearInterval(update);
  update = setInterval(drawWLatency, frameTime);
}

function editLatency()
{
  latency = parseInt(document.getElementById("Latency").value, 10);
}



function newTrial()
{
  LogResult();
  trialNumber += 1;
  if(trialNumber > nTrials)
  {
    downloadTextFile(results, "trialData.txt")
  }
  else
  {
    targetText = GenerateTargetString();
    SetLag();
    DisplayStimulusCountdown(stimulusTime);
    setTimeout(EndPresentation, stimulusTime)
    displayingTarget = true;
    entryField.value = "";
    //inputParagraph.innerHTML = "Output: ";
    targetParagraph.innerHTML = "Target: " + targetText;
  }
}

function DisplayStimulusCountdown(stimulusTimeRemaining)
{

  var timeRemainingText = String(stimulusTimeRemaining/1000);
  inputParagraph.innerHTML = "STIMULUS TIME: " + timeRemainingText;
  if(stimulusTimeRemaining >= 1000)
  {
    setTimeout(() => DisplayStimulusCountdown(stimulusTimeRemaining - 1000), 1000);
  }
  else
  {
    inputParagraph.innerHTML = "Output: ";
  }
}

function EndPresentation()
{
  displayingTarget = false;
  entryField.value = "";
  inputParagraph.innerHTML = "Output: ";
  targetParagraph.innerHTML = "";
}

function SetLag()
{
  var latencies = [0, 25, 50, 75, 120, 160];
  var frameTimes = [0];//[0, 16, 32, 64, 100, 150];
  frameTime = frameTimes[Math.floor(Math.random() * frameTimes.length)];
  latency = latencies[Math.floor(Math.random() * latencies.length)];

  clearInterval(update);
  update = setInterval(drawWLatency, frameTime);
}


function LogResult()
{
  try {
    results += "Latency:" + String(latency) + "#FrameTime:" + String(frameTime) + "#" + String(targetText) + "#" + String(inputParagraph.innerHTML) + "\n";
    }
    catch
    {
      results += "";
    }
}

function DeleteCharacter()
{
  if(added_text.length > 0)
  {
    added_text = added_text.slice(0,-1);
  }
  else
  {

    var current_output = inputParagraph.innerHTML;
    console.log(current_output);
    if(current_output.length > "Output: ".length)
    {
      console.log(current_output.slice(0,-1));
      inputParagraph.innerHTML = current_output.slice(0,-1);
    }
  }
}

function downloadTextFile(text, name)
{
  const a = document.createElement('a');
  const type = name.split(".").pop();
  a.href = URL.createObjectURL( new Blob([text], { type:`text/${type === "txt" ? "plain" : type}` }) );
  a.download = name;
  a.click();
}

function GenerateTargetString()
{
var targets = ["at the far end of town", "where the grickle-grass grows", "the wind smells slow", "sour when it blows", "no birds ever sing", "excepting old crows",
"is the Street of the Lorax", "deep in the Grickle-grass", "some people say", "if you look deep enough", "you can still see today", "where the Lorax once stood", "just as long as it could",
"before somebody lifted the Lorax", "What was the Lorax?", "And why was it there?", "And why was it lifted", "from the far end of town", "where the tall grass grows",
"The Onceler lives here", "You wont see him there",  "Don't knock at his door", "He stays on top of his store", "He lurks under the roof",
"he makes his own clothes",  "on special nights in August", "he peeks out of the shutters",  "and sometimes he speaks", "the Lorax was lifted away",
"He'll tell you perhaps", "if you're willing to pay", "On the end of a rope", "he lets down a tin pail", "and you have to toss in", "fifteen cents and a nail", "the shell of a snail",
"he pulls up the pail" ,"he counts it all", "pay him the proper amount", "he hides what you paid him", "they have to come down",
"he had bees up his nose", "Now I'll tell you", "with his teeth sounding gray", "how the Lorax got taken away", "It all started way back" ,"such a long time back",
"the grass was still green", "the pond was still wet", "the clouds were still clean", "the songs rang out in space", "I came to this glorious place",
"And I first saw the trees", "The bright colored tufts", "the fresh morning breeze"];
var randInd = Math.floor(Math.random() * targets.length);
console.log(targets[randInd]);
return targets[randInd].toLowerCase();
}
