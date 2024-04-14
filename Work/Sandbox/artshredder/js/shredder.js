const drawImage = (url) => {
  console.log('a');
  const image = new Image();
  image.src = url;
  image.onload = () => {
    console.log('b');
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 250, 0);
  }
}

window.onload = function() {
  window.brush = null;
  var canvas = new fabric.Canvas("fabric-brush-demo", {
    isDrawingMode: true,
    hoverCursor: "pointer",
    selection: false
  })
  .setWidth(window.screen.width)
  .setHeight(window.screen.height);

  window.canvas = canvas;

  drawImage('./assets/monalisa.jpg');

  function setPainting(paintingName){
    switch (paintingName) {
      case 'Mona Lisa':
        drawImage('./assets/monalisa.jpg');
        break;
      case 'Starry Night':
        drawImage('./assets/starrynight.jpg')
        break;
      case 'Rembrandt':
        drawImage('./assets/rembrandt.jpg')
        break;
      default:
        console.log('SNAFU');
    }
  }

  function setupBrush(brushName, opt) {
    canvas.freeDrawingBrush = new fabric[brushName](canvas, opt || {});
  }

  var gui = new dat.GUI();
  gui.painting = "Mona Lisa";
  gui.brushType = "InkBrush";
  gui.brushWidth = 30;
  gui.brushOpacity = 1;
  gui.inkAmount = 7;
  gui.brushColor = "#ff0000";

  setupBrush(gui.brushType, {
    width: gui.brushWidth,
    opacity: gui.brushOpacity,
    inkAmount: gui.inkAmount,
    color: gui.brushColor
  });

  gui.clear = function(){
    canvas.clearContext(canvas.contextTop);
  }
  gui.save = function() {
    var dataURL = canvas.contextTop.canvas.toDataURL("image/png");
    window.open(dataURL);
  }

  gui.add(gui, "painting", ["Mona Lisa", "Starry Night", "Rembrandt"])
  .onFinishChange(setPainting);
  gui.add(gui, "brushType", ["CrayonBrush", "InkBrush", "MarkerBrush", "SprayBrush"])
  .onFinishChange(setupBrush);
  gui.add(gui, "brushWidth", 10, 100).step(5)
    .onChange(function(value) {
      canvas.freeDrawingBrush.width = value;
    });
  gui.addColor(gui, "brushColor")
    .onChange(function(value) {
      canvas.freeDrawingBrush.changeColor(value);
    });
  gui.add(gui, "brushOpacity", 0.1, 1).step(0.1)
    .onChange(function(value) {
      canvas.freeDrawingBrush.changeOpacity(value);
    });
  gui.add(gui, "inkAmount", 1, 10).step(0.1)
    .onChange(function(value) {
      canvas.freeDrawingBrush.inkAmount = value;
    });
  gui.add(gui, "save");
  gui.add(gui, "clear");
};






