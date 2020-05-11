	var paragraph;// = document.getElementById("p");
	var entryField;
	var added_text = "";
	var initial_output_message;

	var frameTime = 100;
	var latency = 50;
	var update = setInterval(drawWLatency, frameTime);

  function myKeyPress(e)
  {
    var keynum;
    if(window.event) { // IE
      keynum = e.keyCode;
    } else if(e.which){ // Netscape/Firefox/Opera
      keynum = e.which;
    }

		added_text += String.fromCharCode(keynum);
		setTimeout(() => entryField.value = "",1);
  }

	$(document).ready(function () {
	    $("#textEntry").keydown(function(e) {
				var keynum = e.keyCode;

				if(keynum == 13){
					paragraph.innerHTML = initial_output_message;
				}
			else {
				//Delete on Backspace
				if(keynum == 8)
				{
					if(added_text.length > 0)
					{
						added_text = added_text.slice(0,-1);
					}
					else
					{
						var current_text = paragraph.innerHTML;
						if(current_text.length > initial_output_message.length)
						{
							paragraph.innerHTML = current_text.slice(0,-1);
						}
					}
				}
				else
				{
						added_text += String.fromCharCode(keynum).toLowerCase();
				}
				setTimeout(() => entryField.value = "",1);

			}
	    });
	});





  function start()
  {
  	paragraph = document.getElementById("p");
		entryField = document.getElementById("textEntry");
		initial_output_message = paragraph.innerHTML;
  }

  function drawWLatency()
  {
		var current_text = added_text;
		setTimeout(() => draw(current_text), latency);
		added_text = "";
  }


  function draw(inputText)
  {
		paragraph.innerHTML += inputText;
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
