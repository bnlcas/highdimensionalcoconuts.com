import { Plane } from './WebGLAssets/Plane.js';
import { Program } from './WebGLAssets/Program.js';
import { Mesh } from  './WebGLAssets/Mesh.js';
import { Renderer } from  './WebGLAssets/Renderer.js';
import { Texture } from  './WebGLAssets/Texture.js';

class ImageLoader {
	static loadFromUrl(src) {
		const image = new Image();
		
		return new Promise((resolve, reject) => {
			image.addEventListener('load', () => resolve(image));
			image.addEventListener('error', () => reject(new Error('Unable to load image')));
			image.src = src;
		});
	}
}

class Application {
	constructor() {
		this._renderer = new Renderer();
		this._map = new Texture(this._gl);
		this._mesh = this.createMesh(this._map);
        this.currentContrast = 0.0;
        this.currentExposure = 0.0;
        this.isOscillating = true;
	}
	
	get canvas() {
		return this._renderer.gl.canvas;
	}
	
	createMesh(map) {
		const geometry = new Plane(this._gl, {
			height: 2,
			width: 2,
		});
		
		const program = new Program(this._gl, {
			fragment: `
				precision mediump float;

				uniform sampler2D u_map;
				uniform mat4 u_contrastMatrix;
				uniform mat4 u_exposureMatrix;
				varying vec2 v_uv;

				void main() {
					vec4 texel = texture2D(u_map, v_uv);
					mat4 matrix =  u_contrastMatrix * u_exposureMatrix;

					gl_FragColor = matrix * texel;
				}
			`,
			vertex: `
				attribute vec4 position;
				attribute vec2 uv;

				varying vec2 v_uv;

				void main() {
					v_uv = uv;

					gl_Position = position;
				}
			`,
			
			uniforms: {
				u_contrastMatrix: { value: [1, 0, 0, 0, 0, 1, 0, 0,0, 0, 1, 0, 0, 0, 0, 1] },
				u_exposureMatrix: { value: [1, 0, 0, 0, 0, 1, 0, 0,0, 0, 1, 0, 0, 0, 0, 1] },
				u_map: { value: map },
			},
		});
		
		return new Mesh(this._gl, {
			geometry,
			program,
		});
	}
	
    oscillateLighting()
    {
        var exposureVal = this.currentExposure + 0.6 * Math.pow(Math.sin(Date.now()/800), 2);
        var contrastVal = this.currentContrast //+ 0.4 * Math.pow(Math.sin(Date.now()/600), 2);
        this.setContrast(contrastVal)
        this.setExposure(exposureVal)
    }

	setContrast(contrast) {
		const c = 1 + contrast;
		const o = 0.5 * (1 - c);
		this._mesh.program.uniforms.u_contrastMatrix.value = [
			c, 0, 0, 0,
			0, c, 0, 0,
			0, 0, c, 0,
			0, 0, 0, 1,
        ];				
		this.render();
	}
	
	setExposure(exposure) {
		const e = 1 + exposure;
		
        this._mesh.program.uniforms.u_exposureMatrix.value = [
			e, 0, 0, 0,
			0, e, 0, 0,
			0, 0, e, 0,
			0, 0, 0, 1,
		];
		this.render();
	}
	
	setImage(image) {
		this._map.image = image;
		this._map.needsUpdate = true;
		
		this.render();
	}

	setSize(width, height) {
		this._renderer.setSize(width, height);
	}
	
	render() {
		this._renderer.render({
			scene: this._mesh,
		});
	}
	
	get _gl() {
		return this._renderer.gl;
	}
}

(async () => {	
	const image = await ImageLoader.loadFromUrl('./Assets/X-rayHand.jpg');
	const app = new Application();
	
	app.setImage(image);
	app.render();

	document.getElementById('canvas-container').appendChild(app.canvas);
    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    app.canvas.style.position = "fixed";
    app.canvas.style.color = "black";
    var frameSize = Math.min(window.innerWidth, window.innerHeight);
    app.setSize(frameSize,frameSize);

    window.addEventListener('mousemove', (event) => {
    app.isOscillating = false;
    var x = event.clientX;
    var y = event.clientY;

    var exposureVal = x/1000;
    var contrastVal = y/1000;
    app.setExposure(exposureVal);
    app.setContrast(contrastVal);
    });

    window.addEventListener('touchmove', (event)=> {
        app.isOscillating = false;
        var x = event.touches[0].clientX;
        var y = event.touches[0].clientY;
    
        var exposureVal = x/1000;
        var contrastVal = y/1000;
        app.setExposure(exposureVal);
        app.setContrast(contrastVal);
    });


    window.addEventListener('load', (event)=> {    
        var exposureVal = 0.1;
        var contrastVal = 0.1;
        app.currentExposure = exposureVal;
        app.currentContrast = contrastVal;
        app.setExposure(exposureVal);
        app.setContrast(contrastVal);
    });

    function PulseLighting()
    {
        if(app.isOscillating)
        {
            app.oscillateLighting();
            window.requestAnimationFrame(PulseLighting);
        }
    }

    window.requestAnimationFrame(PulseLighting);
})();