shader_type spatial;
render_mode unshaded,cull_disabled;
uniform sampler2D sprite_texture : source_color,filter_nearest;
uniform vec4 kit_color : source_color = vec4(1.0,0.1,0.1,1.0);
void vertex(){
 MODELVIEW_MATRIX=VIEW_MATRIX*mat4(INV_VIEW_MATRIX[0],INV_VIEW_MATRIX[1],INV_VIEW_MATRIX[2],MODEL_MATRIX[3]);
}
void fragment(){
 vec4 tex=texture(sprite_texture,UV);
 vec3 color=tex.rgb;
 // Original red kit indices only; skin, gloves, hair and white shorts stay intact.
 if(tex.r>.25&&tex.g<tex.r*.5&&tex.b<tex.r*.5){color=kit_color.rgb*(tex.r/.79);}
 ALBEDO=color;
 ALPHA=tex.a;
 ALPHA_SCISSOR_THRESHOLD=.1;
}
