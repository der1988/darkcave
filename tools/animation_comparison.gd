extends SceneTree

# Renders the actual game atlas at integer 6x scale, not a separate illustration.
func _initialize() -> void:
	call_deferred("render_comparison")

func text_at(parent: Control, value: String, point: Vector2, size: int) -> void:
	var label = Label.new()
	label.text = value
	label.position = point
	label.add_theme_font_size_override("font_size",size)
	parent.add_child(label)

func render_comparison() -> void:
	root.size = Vector2i(1280,720)
	root.content_scale_size = Vector2i(1280,720)
	var background = ColorRect.new()
	background.color = Color("20292d")
	background.size = Vector2(1280,720)
	root.add_child(background)
	text_at(background,"FATHER & SON — ANIMAZIONI FORNITE",Vector2(40,24),28)
	text_at(background,"Celle padre 48×64, figlio 40×48 · ingrandimento 4× nearest-neighbor · stessa linea dei piedi",Vector2(40,65),17)
	var labels = ["FERMO","CAMMINATA","CORSA","ACCUCCIATO","FURTIVO"]
	for row in 2:
		var actor = load("res://scenes/actors/" + ("father" if row == 0 else "child") + ".tscn").instantiate()
		var art = actor.get_node("Sprite3D") as CharacterSprite
		for gait in 5:
			var sheet = art.sheets[gait]
			var cell = sheet.get_size() / Vector2(CharacterSprite.FRAME_COUNTS[gait],4)
			var atlas = AtlasTexture.new()
			atlas.atlas = sheet
			atlas.region = Rect2(Vector2(0,cell.y*3),cell)
			var sprite = TextureRect.new()
			sprite.texture = atlas
			sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
			sprite.position = Vector2(148+gait*240-cell.x*2,375+row*300-(art.feet_y+1)*4)
			sprite.size = cell * 4
			background.add_child(sprite)
			if row == 0:
				text_at(background,labels[gait],Vector2(60+gait*240,388),19)
		var line = ColorRect.new()
		line.color = Color("495554")
		line.position = Vector2(40,95+row*300+282)
		line.size = Vector2(1200,1)
		background.add_child(line)
		actor.free()
	text_at(background,"PADRE",Vector2(40,110),14)
	text_at(background,"FIGLIO",Vector2(40,430),14)
	await process_frame
	await RenderingServer.frame_post_draw
	var output = "res://screenshots/0.6b/confronto-pose.png"
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--output="):
			output = argument.trim_prefix("--output=")
	assert(root.get_texture().get_image().save_png(output) == OK)
	quit()
