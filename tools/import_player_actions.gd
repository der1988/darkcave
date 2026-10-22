extends SceneTree
## Preserve the first 96 frames; append footballgame's original action poses.
const IMPORTER = preload("res://tools/import_football_art.gd")
func _initialize():
	var source = ""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--source="): source = arg.trim_prefix("--source=")
	assert(not source.is_empty(),"Pass --source=/path/to/footballgame")
	var data = JSON.parse_string(FileAccess.get_file_as_string(source+"/res/spritesheets/sprites.json"))
	var atlas = Image.load_from_file(source+"/res/spritesheets/sprites.png")
	var frames = {}
	for entry in data.frames: frames[entry.filename] = entry.frame
	var output = Image.create(61*8,61*19,false,Image.FORMAT_RGBA8)
	var base = Image.load_from_file("res://assets/football/player.png")
	output.blit_rect(base,Rect2i(0,0,61*8,61*12),Vector2i.ZERO)
	var rows = ["tackle_slide_%s_0","fall_%s_0","fall_%s_1","run_tackled_%s_0","run_tackled_%s_1","run_tackled_%s_2","run_tackled_%s_3"]
	var helper = IMPORTER.new()
	for row in rows.size():
		for direction in 8:
			var name = "player_"+(rows[row] % IMPORTER.DIRECTIONS[direction])
			helper.copy_frame(atlas,frames,name,output,Vector2i(direction*61,(12+row)*61),true)
	helper.free()
	assert(output.save_png("res://assets/football/player_actions.png")==OK)
	if OS.get_cmdline_user_args().has("--preview"):
		var preview = Image.create(61*6,61,false,Image.FORMAT_RGBA8)
		preview.fill(Color("292d2e"))
		var poses = [0,12,13,14,15,18]
		for i in poses.size():
			preview.blend_rect(output,Rect2i(0,poses[i]*61,61,61),Vector2i(i*61,0))
		preview.resize(61*6*4,61*4,Image.INTERPOLATE_NEAREST)
		DirAccess.make_dir_recursive_absolute("res://screenshots/football-21")
		assert(preview.save_png("res://screenshots/football-21/20-pose-originali.png")==OK)
	print("Imported 56 original action frames; retained all 96 existing poses.")
	quit()
