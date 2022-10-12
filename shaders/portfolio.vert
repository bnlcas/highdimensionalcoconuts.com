#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;
uniform float u_intensity;

vec2 rotate2d(vec2 inVec, float theta) {
	float c = cos(theta);
    float s = sin(theta);
    mat2 rot = mat2(
        c, s,
        -s, c
    );
    return rot*inVec;
}

void main() {
    //float rotation = u_intensity;// * a_position.x * a_position.y;
    //vec2 rotatedPosition = rotate2d(a_position, rotation);
    vec2 offset = a_position;
    gl_Position = vec4(offset, 0.0, 1.0);
    //v_texcoord = offset;
    //gl_Position = a_position;
}
