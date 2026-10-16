shader_type spatial;
render_mode unshaded, cull_disabled;
varying vec3 world_position;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void vertex(){world_position=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;}
void fragment(){
 // Quiet green ground with only occasional fixed pixel-art grass marks.
 vec2 pixel=floor(world_position.xz*6.0);
 vec2 tuft=floor(pixel/vec2(3.0,4.0));
 vec3 color=vec3(.28,.44,.27);
 if(hash(tuft)>.985 && mod(pixel.x,3.0)<1.0 && mod(pixel.y,4.0)<2.0){
  color=vec3(.34,.49,.29);
 }
 ALBEDO=color;
}
