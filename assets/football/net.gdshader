shader_type spatial;
render_mode unshaded,cull_disabled,depth_draw_opaque;
uniform float opacity = 0.65;
void fragment(){
 vec2 cell=fract(UV*vec2(28.0,14.0));
 float wire=step(min(cell.x,cell.y),0.065);
 ALBEDO=vec3(.65,.7,.71);
 ALPHA=wire*opacity;
}
