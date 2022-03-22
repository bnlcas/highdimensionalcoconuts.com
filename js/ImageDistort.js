import {
	Plane,
	Program,
	Mesh,
	Renderer,
	Texture,
} from 'https://unpkg.com/ogl@0.0.49/src/index.mjs';

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
		
		//this.setSize(1000,1000);
            //image.naturalWidth, image.naturalHeight);
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
    console.log(frameSize);
    app.setSize(frameSize,frameSize);
            //image.naturalWidth, image.naturalHeight);

    window.addEventListener('mousemove', (event) => {
    var x = event.clientX;
    var y = event.clientY;

    var brightnessVal = x/1000;
    var contrastVal = y/1000;
    app.setExposure(brightnessVal);
    app.setContrast(contrastVal);
});

})();