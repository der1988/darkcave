extends "res://tests/prototype_test.gd"

# A complete run with the real patrolling enemy enabled throughout.
func run() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await ticks(5)
	Input.action_press("crouch")
	var entered = await navigate_father(Vector3(-1.6, 0, -4.6))
	check(entered and game.phase == PrototypeGame.Phase.PLAYING, "Stealth route reaches water with active enemy")
	if entered:
		command("interact")
		check(game.resource_collected, "Water recovered during live patrol")
		for destination in [Vector3(-6.5, 0, -0.1), Vector3(-6.5, 0, -9.6), Vector3(8.3, 0, -9.6), Vector3(8.3, 0, -8.5)]:
			if not await navigate_father(destination):
				break
		for i in 1000:
			if game.phase != PrototypeGame.Phase.PLAYING:
				break
			await physics_frame
	check(game.phase == PrototypeGame.Phase.COMPLETE, "Both characters escape with the enemy active")
	if failures:
		print("Route stopped: father=",game.father.global_position," child=",game.child.global_position," enemy=",game.enemy.global_position," phase=",game.phase)
	release_movement()
	print("RESULT live patrol: ", checks - failures, "/", checks, " checks passed")
	game.queue_free()
	await process_frame
	quit(0 if failures == 0 else 1)
