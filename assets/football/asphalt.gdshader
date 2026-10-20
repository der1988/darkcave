shader_type spatial;
render_mode unshaded;
varying vec3 world;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;}
void fragment(){
 vec2 p=floor(world.xz*10.0)/10.0;
 vec2 court=vec2((p.x-p.y)*0.70710678,(p.x+p.y+8.0)*0.70710678);
 float grain=hash(floor(p*10.0));
 vec3 color=vec3(.23,.25,.26)+(floor(grain*4.0)-1.5)*.008;
 if(abs(court.x)>7.5||court.y< -2.0||court.y>13.0){color=vec3(.16,.17,.18);}
 float crack=abs(sin(p.x*1.8+sin(p.y*2.0)*.6));
 if(crack<.035&&hash(floor(p*.6))>.65){color*=.65;}
 bool boundary=(abs(abs(court.x)-7.5)<.045&&court.y>=0.0&&court.y<=13.0)||(abs(court.y-13.0)<.045&&abs(court.x)<7.5)||(abs(court.y)<.045&&abs(court.x)<7.5);
 float ring=abs(length(vec2(court.x,court.y-4.0))-1.7);
 if((boundary||ring<.045)&&grain>.18){color=vec3(.63,.64,.59);}
 ALBEDO=color;
}
