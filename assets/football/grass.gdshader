shader_type spatial;
render_mode unshaded, cull_disabled;
varying vec3 world_position;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
 vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void vertex(){world_position=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;}
void fragment(){
 vec2 p=world_position.xz;
 float broad=noise(p*.15);
 float dry=smoothstep(.57,.8,noise(p*.38+17.0));
 float blades=noise(p*23.0);
 vec3 grass=mix(vec3(.19,.32,.12),vec3(.30,.43,.18),broad);
 grass=mix(grass,vec3(.36,.36,.19),dry*.48);
 ALBEDO=grass+(blades-.5)*.045;
}
