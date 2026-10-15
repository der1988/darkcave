extends SceneTree

var checks: int = 0
var failures: int = 0
var game: PrototypeGame

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, label: String) -> void:
	checks += 1
	if condition:
		print("PASS · ", label)
	else:
		failures += 1
		push_error("FAIL · " + label)

func ticks(count: int) -> void:
	for i in count:
		await physics_frame

func command(action: String) -> void:
	var event = InputEventAction.new()
	event.action = action
	event.pressed = true
	game._unhandled_input(event)

func reset_positions(father_position: Vector3, child_position: Vector3) -> void:
	game.father.global_position = father_position
	game.child.global_position = child_position
	game.father.velocity = Vector3.ZERO
	game.child.velocity = Vector3.ZERO
	game.child.agent.target_position = father_position
	game.child.route_timer = 0.0

func navigate_father(destination: Vector3) -> bool:
	var map = game.child.agent.get_navigation_map()
	var route = NavigationServer3D.map_get_path(map, game.father.global_position, destination, true)
	if route.is_empty():
		return false
	for point in route:
		for step in 700:
			var delta = point - game.father.global_position
			delta.y = 0
			if delta.length() < 0.16:
				break
			var direction = delta.normalized()
			var screen = Vector2(direction.x - direction.z, direction.x + direction.z).normalized()
			Input.action_press("move_right", maxf(0, screen.x))
			Input.action_press("move_left", maxf(0, -screen.x))
			Input.action_press("move_down", maxf(0, screen.y))
			Input.action_press("move_up", maxf(0, -screen.y))
			await physics_frame
			if game.phase != PrototypeGame.Phase.PLAYING:
				release_movement()
				return false
	release_movement()
	return Vector2(destination.x - game.father.position.x, destination.z - game.father.position.z).length() < 0.4

func release_movement() -> void:
	for action in ["move_left", "move_right", "move_up", "move_down", "run", "crouch"]:
		Input.action_release(action)

func run() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await ticks(5)
	game.enemy.active = false
	check(ProjectSettings.get_setting("rendering/renderer/rendering_method") == "gl_compatibility", "Compatibility renderer configured")
	check(game.father.sprite.texture != null and game.child.sprite.texture != null, "Original Sprite3D textures imported")
	check(game.rig.camera.projection == Camera3D.PROJECTION_ORTHOGONAL, "Orthographic camera")
	check(game.level.get_node("NavigationRegion3D").navigation_mesh.get_polygon_count() > 0, "Baked native navigation mesh")
	var start = game.father.global_position
	Input.action_press("move_right")
	await ticks(30)
	Input.action_release("move_right")
	check(game.father.global_position.distance_to(start) > 0.8, "WASD movement drives physics")
	check(game.father.position.x > start.x and game.father.position.z < start.z, "Movement is relative to the isometric view")
	await ticks(100)
	check(game.child.global_position.distance_to(game.father.global_position) < 1.3, "Child follows naturally")
	command("child_wait")
	await ticks(20)
	var waiting = game.child.global_position
	Input.action_press("move_up")
	await ticks(25)
	Input.action_release("move_up")
	await ticks(10)
	check(game.child.mode == ChildCompanion.Mode.WAIT and game.child.global_position.distance_to(waiting) < 0.04, "Q: child waits")
	command("child_wait")
	await ticks(150)
	check(game.child.mode == ChildCompanion.Mode.FOLLOW and game.child.global_position.distance_to(game.father.global_position) < 1.3, "Q: child resumes following")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.HAND, "F: hold hand at close range")
	Input.action_press("run")
	Input.action_press("move_left")
	await ticks(30)
	release_movement()
	check(game.child.global_position.distance_to(game.father.global_position) < 1.6, "Hand mode limits father speed and keeps child close")
	Input.action_press("crouch")
	await ticks(3)
	check(game.father.crouched and game.child.crouched, "CTRL: both characters crouch")
	Input.action_release("crouch")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.FOLLOW, "F: release hand")
	for i in 30:
		game.rig.zoom_step(-1)
	check(is_equal_approx(game.rig.desired_zoom, game.rig.minimum_zoom), "Zoom clamps at near limit")
	for i in 30:
		game.rig.zoom_step(1)
	check(is_equal_approx(game.rig.desired_zoom, game.rig.maximum_zoom), "Zoom clamps at far limit")
	var wheel = InputEventMouseButton.new()
	wheel.button_index = MOUSE_BUTTON_WHEEL_UP
	wheel.pressed = true
	game.rig._unhandled_input(wheel)
	await ticks(30)
	check(game.rig.camera.size < game.rig.maximum_zoom, "Mouse wheel changes camera zoom")
	# Resolve collision against a car and a wall using real CharacterBody3D motion.
	game.child.mode = ChildCompanion.Mode.WAIT
	reset_positions(Vector3(-3.7, 0, 5.2), Vector3(-8, 0, 7))
	Input.action_press("move_up")
	Input.action_press("move_right")
	await ticks(100)
	release_movement()
	check(game.father.position.z > 3.9, "Car collision stops father")
	reset_positions(Vector3(-4.2, 0, -4), Vector3(-8, 0, 7))
	Input.action_press("move_down")
	Input.action_press("move_right")
	await ticks(100)
	release_movement()
	check(game.father.position.x < -3.35, "Station wall collision stops father")
	# Child must go around the car without teleporting or entering its footprint.
	reset_positions(Vector3(-3.7, 0, -0.6), Vector3(-3.7, 0, 5.1))
	game.father.active = false
	game.child.mode = ChildCompanion.Mode.FOLLOW
	var teleported = false
	var inside_car = false
	for i in 420:
		var before = game.child.global_position
		await physics_frame
		var pos = game.child.global_position
		teleported = teleported or before.distance_to(pos) > 0.16
		inside_car = inside_car or (pos.x > -4.55 and pos.x < -2.85 and pos.z > 0.3 and pos.z < 3.7)
	check(game.child.global_position.distance_to(game.father.global_position) < 1.3, "Native navigation routes child around car")
	check(not teleported and not inside_car, "No companion teleport or obstacle penetration")
	# Controlled sight tests: cone, distance, solid wall and real low cover.
	game.child.mode = ChildCompanion.Mode.WAIT
	game.enemy.global_position = Vector3(-7, 0, 0)
	game.enemy.facing = Vector3.FORWARD
	game.father.global_position = Vector3(-7, 0, -3)
	await ticks(2)
	check(game.enemy.can_see(game.father), "Enemy sees father inside cone")
	game.father.global_position = Vector3(-7, 0, 3)
	await ticks(2)
	check(not game.enemy.can_see(game.father), "Enemy cannot see behind itself")
	game.father.global_position = Vector3(-7, 0, -9)
	await ticks(2)
	check(not game.enemy.can_see(game.father), "Enemy sight range is limited")
	game.enemy.global_position = Vector3(-4, 0, -4)
	game.enemy.facing = Vector3.RIGHT
	game.father.global_position = Vector3(-2, 0, -4)
	await ticks(2)
	check(not game.enemy.can_see(game.father), "Solid station wall blocks sight")
	game.enemy.global_position = Vector3(-0.2, 0, 6)
	game.enemy.facing = Vector3.FORWARD
	game.father.global_position = Vector3(-0.2, 0, 2.4)
	await ticks(2)
	check(game.enemy.can_see(game.father), "Standing father is visible above low cover")
	Input.action_press("crouch")
	await ticks(2)
	check(not game.enemy.can_see(game.father), "Crouching behind cover genuinely blocks the sight ray")
	game.enemy.global_position = Vector3(-7, 0, 0)
	game.father.global_position = Vector3(-7, 0, -3)
	await ticks(2)
	check(game.enemy.can_see(game.father), "Crouching in the open is not invisibility")
	release_movement()
	game.child.global_position = Vector3(-7.4, 0, -2.7)
	await ticks(2)
	check(game.enemy.can_see(game.child), "Enemy also detects child")
	game.enemy.active = true
	await ticks(5)
	check(game.enemy.state == PatrolEnemy.State.CHASE, "Detection transitions to chase")
	await ticks(180)
	check(game.phase == PrototypeGame.Phase.FAILED, "Reaching a character causes failure")
	check(not game.father.active and not game.child.active and not game.enemy.active, "Failure freezes simulation")
	command("restart")
	await ticks(5)
	game = current_scene as PrototypeGame
	check(game != null and game.phase == PrototypeGame.Phase.PLAYING and not game.resource_collected, "R restarts a fresh run")
	game.enemy.active = false
	game.child.toggle_wait()
	check(await navigate_father(Vector3(-1.6, 0, -4.6)), "Father can physically reach the resource through station doorway")
	command("interact")
	check(game.resource_collected and not game.level.get_node("Resource").visible, "E collects water exactly once")
	check(not game.try_interact(), "Collected resource cannot duplicate")
	check(await navigate_father(Vector3(8.3, 0, -8.5)), "Physical route from station to exit is walkable")
	check(game.phase == PrototypeGame.Phase.PLAYING, "Exit does not complete while child waits elsewhere")
	game.child.toggle_wait()
	for i in 1200:
		if game.phase == PrototypeGame.Phase.COMPLETE:
			break
		await physics_frame
	check(game.at_exit(game.child), "Child follows all the way to exit")
	check(game.phase == PrototypeGame.Phase.COMPLETE, "Water plus both characters completes prototype")
	command("restart")
	await ticks(5)
	game = current_scene as PrototypeGame
	check(game.phase == PrototypeGame.Phase.PLAYING and not game.resource_collected, "R restarts after completion too")
	print("RESULT: ", checks - failures, "/", checks, " checks passed")
	game.queue_free()
	await process_frame
	quit(0 if failures == 0 else 1)
