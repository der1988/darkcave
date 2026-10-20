extends SceneTree
func _initialize() -> void:
	var source = ""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--source="):
			source = arg.trim_prefix("--source=")
	assert(not source.is_empty())
	var atlas = Image.load_from_file(source+"/res/spritesheets/sprites.png")
	var data = JSON.parse_string(FileAccess.get_file_as_string(source+"/res/spritesheets/sprites.json"))
	for entry in data.frames:
		if entry.filename in ["posts_0","net_up_0"]:
			var rect = entry.frame
			var frame = atlas.get_region(Rect2i(rect.x,rect.y,rect.w,rect.h))
			assert(frame.save_png("res://assets/football/"+entry.filename+".png")==OK)
			print(entry.filename," bounds ",frame.get_used_rect())
	quit()
