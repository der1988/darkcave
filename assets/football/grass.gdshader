shader_type spatial;
render_mode unshaded, cull_disabled;
varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec2 p = world_position.xz;
	float patches = sin(p.x * 0.11 + sin(p.y * 0.09)) * sin(p.y * 0.13);
	vec2 cell = floor(p * 7.0);
	float seed = fract(sin(dot(cell, vec2(127.1,311.7))) * 43758.5453);
	float tuft = step(0.986, seed);
	ALBEDO = vec3(0.19,0.39,0.20) + patches * vec3(0.008,0.013,0.006) + tuft * vec3(0.014,0.027,0.009);
}
