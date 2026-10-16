extends SceneTree

# Repack existing footballgame pixels; resolve its indexed palette as its shader does.
# godot --headless --path . --script tools/import_football_art.gd -- --source=/path/to/footballgame
const DIRECTIONS = ["right", "front_right", "front", "front_left", "left", "back_left", "back", "back_right"]
const KICKS = ["tackle_right", "shoot_front_right", "tackle_front", "shoot_front_left", "tackle_left", "shoot_back_left", "tackle_back", "shoot_back_right"]
const BALL = ["right", "right_updown", "down", "left_updown", "left", "right_updown", "up", "left_updown"]
const PALETTE = [Color8(0,0,0),Color8(255,255,255),Color8(199,137,137),Color8(230,41,55),Color8(208,208,208),Color8(255,255,255),Color8(0,0,0),Color(0,0,0,0),Color8(243,170,170),Color8(172,31,41),Color8(0,0,0),Color8(9,64,110)]

func _initialize() -> void:
	var source = ""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--source="):
			source = arg.trim_prefix("--source=")
	if source.is_empty():
		push_error("Pass --source=/path/to/footballgame")
		quit(1)
		return
	var data = JSON.parse_string(FileAccess.get_file_as_string(source+"/res/spritesheets/sprites.json"))
	var atlas = Image.load_from_file(source+"/res/spritesheets/sprites.png")
	var frames: Dictionary = {}
	for entry in data.frames:
		frames[entry.filename] = entry.frame
	var player = Image.create(61*8,61*6,false,Image.FORMAT_RGBA8)
	var ball = Image.create(52*8,44*4,false,Image.FORMAT_RGBA8)
	for direction in 8:
		copy_frame(atlas,frames,"player_"+DIRECTIONS[direction]+"_0",player,Vector2i(direction*61,0),true)
		for pose in 4:
			copy_frame(atlas,frames,"player_run_"+DIRECTIONS[direction]+"_"+str(pose),player,Vector2i(direction*61,(pose+1)*61),true)
			copy_frame(atlas,frames,"ball_"+BALL[direction]+"_"+str(pose),ball,Vector2i(direction*52,pose*44),false)
		copy_frame(atlas,frames,"player_"+KICKS[direction]+"_0",player,Vector2i(direction*61,305),true)
	DirAccess.make_dir_recursive_absolute("res://assets/football")
	assert(player.save_png("res://assets/football/player.png") == OK)
	assert(ball.save_png("res://assets/football/ball.png") == OK)
	print("Imported 48 player frames and 32 ball frames without resampling.")
	quit()

func copy_frame(atlas: Image, frames: Dictionary, name: String, output: Image, point: Vector2i, indexed: bool) -> void:
	assert(frames.has(name),"Missing source frame: "+name)
	var r = frames[name]
	var image = atlas.get_region(Rect2i(r.x,r.y,r.w,r.h))
	if indexed:
		image.convert(Image.FORMAT_RGBA8)
		for y in image.get_height():
			for x in image.get_width():
				var texel = image.get_pixel(x,y)
				var index = roundi(texel.r*255.0)
				if texel.a > 0.0 and index < PALETTE.size():
					image.set_pixel(x,y,PALETTE[index])
	output.blit_rect(image,Rect2i(Vector2i.ZERO,image.get_size()),point)
