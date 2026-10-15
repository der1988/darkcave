extends "res://tests/prototype_test.gd"

func press_h() -> void:
	var key = InputEventKey.new()
	key.physical_keycode = KEY_H
	key.pressed = true
	Input.parse_input_event(key)
	await process_frame
	key = InputEventKey.new()
	key.physical_keycode = KEY_H
	key.pressed = false
	Input.parse_input_event(key)
	await process_frame
	await process_frame # Canvas visibility is updated after the frame signal.

func run() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await ticks(5)
	game.enemy.active = false
	check(is_equal_approx(game.rig.desired_zoom,12.5) and game.rig.minimum_zoom == 10 and game.rig.maximum_zoom == 22, "Closer default framing retains manual zoom limits")
	check(game.hud.controls_label.visible and game.hud.controls_label.text.contains("H") and game.hud.controls_label.text.contains("WASD"), "Controls are initially visible and use centralized bindings")
	await ticks(480)
	await process_frame
	check(not game.hud.controls_label.visible and game.hud.get_node("ControlsHint").visible, "Controls automatically clear after the introductory interval")
	await press_h()
	check(game.hud.controls_label.visible, "Physical H recalls controls through the input system")
	var start = game.father.position
	Input.action_press("move_right")
	await ticks(30)
	release_movement()
	check(game.father.position.distance_to(start) > .7 and game.phase == PrototypeGame.Phase.PLAYING, "Control strip does not pause or intercept movement")
	await press_h()
	check(not game.hud.controls_label.visible, "Second H dismisses controls")
	await press_h()
	check(game.hud.controls_label.visible, "H can recall controls repeatedly")

	game.father.active = false
	game.child.active = false
	reset_positions(Vector3(-1.65,0,-1.6),Vector3(-2.4,0,-1.55))
	game.rig.position = game.father.position
	await ticks(40)
	await process_frame
	check(game.father.sprite.no_depth_test and game.child.sprite.no_depth_test and game.child.sprite.modulate.a < .5, "Occluded protagonists have restrained translucent readability")
	check(not game.enemy.sprite.no_depth_test, "Readability never reveals the enemy through walls")
	reset_positions(Vector3(-.8,0,.3),Vector3(-1.6,0,.6))
	game.rig.position = game.father.position
	await ticks(60)
	await process_frame
	check(not game.father.sprite.no_depth_test and game.father.sprite.modulate.a > .99, "Opaque depth-tested rendering returns after leaving cover")
	check(game.father.sprite.texture_filter == BaseMaterial3D.TEXTURE_FILTER_NEAREST and is_equal_approx(game.child.sprite.pixel_size,.045) and game.child.sprite.offset.y == 1, "Logical pixel scale and corrected foot anchor remain stable")
	game.end_run(PrototypeGame.Phase.COMPLETE)
	await process_frame
	await press_h()
	check(game.hud.end_panel.visible and not game.hud.controls_label.visible, "End screen retains its information without the control strip")
	print("RESULT presentation: ",checks-failures,"/",checks)
	game.queue_free()
	await process_frame
	quit(0 if failures == 0 else 1)
