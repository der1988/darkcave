extends SceneTree

func _initialize() -> void:
	call_deferred("capture")

func capture() -> void:
	var game = load("res://scenes/main.tscn").instantiate() as PrototypeGame
	root.add_child(game)
	current_scene = game
	game.enemy.active = false
	for i in 8:
		await physics_frame
	await RenderingServer.frame_post_draw
	var folder = OS.get_environment("FATHER_SON_SCREENSHOT_DIR")
	if folder.is_empty():
		folder = "user://"
	var image = root.get_texture().get_image()
	var result = image.save_png(folder.path_join("father-son-start.png"))
	if result != OK:
		push_error("Screenshot failed: " + str(result))
		quit(1)
		return
	game.father.global_position = Vector3(-0.8, 0, -0.1)
	game.child.global_position = Vector3(-1.5, 0, 0.3)
	game.rig.global_position = game.father.global_position
	for i in 8:
		await physics_frame
	await RenderingServer.frame_post_draw
	result = root.get_texture().get_image().save_png(folder.path_join("father-son-station.png"))
	for phase in [PrototypeGame.Phase.COMPLETE, PrototypeGame.Phase.FAILED]:
		game.end_run(phase)
		await process_frame
		await RenderingServer.frame_post_draw
		var name = "father-son-complete.png" if phase == PrototypeGame.Phase.COMPLETE else "father-son-failed.png"
		result = root.get_texture().get_image().save_png(folder.path_join(name))
		if result != OK:
			push_error("End screen capture failed")
			quit(1)
			return
	print("Render screenshots saved to: ", folder)
	game.queue_free()
	await process_frame
	quit(0 if result == OK else 1)
