extends SceneTree
## Repack goalkeeper's original indexed frames; preserve artwork and animation timing.
const IMPORTER = preload("res://tools/import_football_art.gd")
func _initialize() -> void:
	var source = ""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--source="):
			source = arg.trim_prefix("--source=")
	assert(not source.is_empty(),"Pass --source=/path/to/footballgame")
	var data = JSON.parse_string(FileAccess.get_file_as_string(source+"/res/spritesheets/sprites.json"))
	var atlas = Image.load_from_file(source+"/res/spritesheets/sprites.png")
	var entries: Dictionary = {}
	for entry in data.frames:
		if entry.filename.begins_with("goalkeeper_"):
			entries[entry.filename] = entry.frame
	var names = entries.keys()
	names.sort()
	var rows = ceili(names.size()/16.0)
	var output = Image.create(61*16,61*rows,false,Image.FORMAT_RGBA8)
	var indices: Dictionary = {}
	for i in names.size():
		var rect = entries[names[i]]
		assert(rect.w==61 and rect.h==61)
		var image = atlas.get_region(Rect2i(rect.x,rect.y,rect.w,rect.h))
		image.convert(Image.FORMAT_RGBA8)
		for y in 61:
			for x in 61:
				var pixel = image.get_pixel(x,y)
				var index = roundi(pixel.r*255.0)
				if pixel.a>0 and index<IMPORTER.PALETTE.size():
					image.set_pixel(x,y,IMPORTER.PALETTE[index])
		output.blit_rect(image,Rect2i(0,0,61,61),Vector2i((i%16)*61,(i/16)*61))
		indices[names[i]] = i
	assert(output.save_png("res://assets/football/goalkeeper.png")==OK)
	var animations = JSON.parse_string(FileAccess.get_file_as_string(source+"/res/animations/animations.json"))
	var manifest = {"columns":16,"rows":rows,"frames":indices,"animations":animations.goalkeeper}
	var file = FileAccess.open("res://assets/football/goalkeeper.json",FileAccess.WRITE)
	file.store_string(JSON.stringify(manifest,"\t"))
	print("Imported ",names.size()," original goalkeeper frames.")
	quit()
