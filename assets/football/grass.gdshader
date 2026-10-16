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
 // Fixed world pixels, discrete palette: no smooth mottling or subpixel grain.
 vec2 pixel=floor(world_position.xz*6.0);
 vec2 p=pixel/6.0;
 float region=floor(noise(p*.09)*6.0);
 float detail=hash(pixel);
 float patch=noise(p*.32);
 vec3 dark=vec3(.18,.32,.23);
 vec3 mid=vec3(.28,.45,.28);
 vec3 light=vec3(.43,.56,.31);
 vec3 soil=vec3(.37,.27,.29);
 vec3 color=mid;
 // Six related ground families: meadow, bare patches, low turf,
 // sparse tall grass, damp ground and worn tracks.
 if(region<1.0){color=detail>.96?light:mid;}
 else if(region<2.0){color=patch>.65?soil:mid;}
 else if(region<3.0){color=detail>.98?light:mid;}
 else if(region<4.0){color=patch>.62?soil:dark;}
 else if(region<5.0){color=patch>.69?vec3(.23,.39,.42):dark;}
 else{color=abs(sin(p.x*.35+sin(p.y*.2)))<.30?soil:mid;}
 // Sparse short two-pixel blades; consistent crisp marks rather than white noise.
 vec2 blade=floor(pixel/vec2(2.0,3.0));
 float seed=hash(blade);
 if(seed>.96 && mod(pixel.y,3.0)<2.0 && mod(pixel.x,2.0)<1.0){color=light;}
 if(detail<.025){color*=.88;}
 ALBEDO=color;
}
