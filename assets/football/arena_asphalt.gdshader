shader_type spatial;
render_mode unshaded;
varying vec3 world;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;}
void fragment(){
 vec2 p=floor(world.xz*10.0)/10.0;
 vec2 court=vec2((p.x-p.y)*0.70710678,(p.x+p.y)*0.70710678);
 float grain=hash(floor(p*10.0));
 vec3 color=vec3(.23,.25,.26)+(floor(grain*4.0)-1.5)*.008;
 if(abs(court.x)>12.0||abs(court.y)>7.0){color=vec3(.16,.17,.18);}
 float crack=abs(sin(p.x*1.8+sin(p.y*2.0)*.6));
 if(crack<.035&&hash(floor(p*.6))>.65){color*=.65;}
 bool boundary=(abs(abs(court.x)-12.0)<.055&&abs(court.y)<=7.0)||(abs(abs(court.y)-7.0)<.055&&abs(court.x)<=12.0);
 bool middle=abs(court.x)<.05&&abs(court.y)<=7.0;
 bool ring=abs(length(court)-2.0)<.05;
 bool box=(abs(abs(court.x)-8.5)<.05&&abs(court.y)<3.7)||(abs(abs(court.y)-3.7)<.05&&abs(court.x)>8.5&&abs(court.x)<12.0);
 if((boundary||middle||ring||box)&&grain>.18){color=vec3(.63,.64,.59);}
 ALBEDO=color;
}
