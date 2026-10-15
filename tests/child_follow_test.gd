extends "res://tests/prototype_test.gd"

var largest_step: float = 0.0
var smallest_gap: float = INF

func setup_pair(father_position: Vector3, child_position: Vector3) -> void:
	release_movement()
	game.father.active = true
	game.child.active = true
	game.child.mode = ChildCompanion.Mode.FOLLOW
	game.father.facing = Vector3.FORWARD
	game.child._reset_follow()
	game.child.heading_initialized = false
	reset_positions(father_position, child_position)
	await ticks(3)

func sample_tick() -> void:
	var before = game.child.global_position
	await physics_frame
	largest_step = maxf(largest_step, game.child.global_position.distance_to(before))
	smallest_gap = minf(smallest_gap, game.child.global_position.distance_to(game.father.global_position))

func run() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await ticks(5)
	game.enemy.active = false
	await setup_pair(Vector3(-7, 0, 8), Vector3(-7.7, 0, 8.3))
	Input.action_press("move_up")
	Input.action_press("move_right")
	var max_gap = 0.0
	var early_gap = 0.0
	var recovery_switches = 0
	var was_recovering = false
	var speed_jump = 0.0
	for frame in 330:
		var previous_speed = game.child.follow_speed
		await sample_tick()
		var gap = game.child.position.distance_to(game.father.position)
		max_gap = maxf(max_gap, gap)
		if frame == 150:
			early_gap = gap
		if game.child.recovering != was_recovering:
			recovery_switches += 1
			was_recovering = game.child.recovering
		speed_jump = maxf(speed_jump, absf(previous_speed - game.child.follow_speed))
	check(max_gap < 2.8, "Continuous father walk keeps the companion within 2.8 metres")
	check(game.child.position.distance_to(game.father.position) < early_gap + 0.4, "Walking does not create progressive separation")
	check(recovery_switches <= 4 and speed_jump < 0.11, "Speed adapts gradually without threshold chatter")
	var goal = game.child._accompany_position()
	var closest = NavigationServer3D.map_get_closest_point(game.child.agent.get_navigation_map(), goal)
	check(goal.distance_to(closest) < 0.02 and Vector2(goal.x-game.father.position.x, goal.z-game.father.position.z).length() >= 0.6, "Accompaniment slot is on navmesh and outside father centre")
	release_movement()
	for i in 180:
		await sample_tick()
	check(game.child.position.distance_to(game.father.position) < 1.3, "Child closes distance when father stops")
	var settled = game.child.position
	var motion_frames = 0
	for i in 120:
		await sample_tick()
		if game.child.moving:
			motion_frames += 1
	check(game.child.position.distance_to(settled) < 0.1 and motion_frames < 10, "Idle father does not cause circling or repeated start-stop")

	await setup_pair(Vector3(-7,0,8),Vector3(-7.7,0,8.3))
	Input.action_press("run")
	Input.action_press("move_up")
	Input.action_press("move_right")
	var top_speed = 0.0
	for i in 160:
		await sample_tick()
		top_speed = maxf(top_speed, Vector2(game.child.velocity.x,game.child.velocity.z).length())
	check(top_speed > game.father.walk_speed and top_speed <= game.child.recovery_speed + .1, "Child briefly accelerates to recover a running father")
	release_movement()
	for i in 240:
		await sample_tick()
	check(game.child.position.distance_to(game.father.position) < 1.3 and not game.child.recovering, "After run-and-stop child catches up and exits recovery")

	# Reverse immediately twice; physics must keep separation without teleporting.
	for direction in [1,-1]:
		release_movement()
		Input.action_press("move_down" if direction == 1 else "move_up")
		Input.action_press("move_left" if direction == 1 else "move_right")
		for i in 75:
			await sample_tick()
	release_movement()
	for i in 180:
		await sample_tick()
	check(game.child.position.distance_to(game.father.position) < 1.35, "Sudden direction reversals settle into following")

	command("child_wait")
	await ticks(20)
	var waiting = game.child.position
	game.father.position = Vector3(-7,0,7)
	Input.action_press("crouch")
	await ticks(30)
	check(not game.child.crouched and game.child.position.distance_to(waiting) < .04, "Waiting child keeps position and does not imitate distant crouching")
	command("child_wait")
	await ticks(3)
	check(game.child.mode == ChildCompanion.Mode.FOLLOW and game.child.crouched, "Q resumes follow and posture synchronizes again")
	command("child_wait")
	release_movement()
	await ticks(20)
	check(game.child.crouched and not game.father.crouched, "Waiting child also retains a previously crouched posture")
	command("child_wait")
	await ticks(3)
	check(not game.child.crouched, "Resuming follow restores standing posture")

	# The existing physical route helper drives the father around the car and through the shop door.
	await setup_pair(Vector3(-7,0,7),Vector3(-7.8,0,7.4))
	check(await navigate_father(Vector3(-1.6,0,-4.6)), "Father travels around car and through station doorway")
	for i in 360:
		await sample_tick()
	check(game.child.position.distance_to(game.father.position) < 1.35 and game.child.position.z < -1.4, "Companion follows around car and through door without sticking")
	var environment_hit = game.child.test_move(game.child.global_transform,Vector3.ZERO)
	check(not environment_hit and smallest_gap > .48 and largest_step < .12, "No body penetration or teleport in follow scenarios")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.HAND, "F still enters hand mode after adaptive following")
	Input.action_press("move_down")
	for i in 50:
		await sample_tick()
	release_movement()
	check(game.child.position.distance_to(game.father.position) < 1.6, "Unchanged hand mode keeps the pair together")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.FOLLOW, "F releases hand back into adaptive follow")
	print("RESULT adaptive follow: ", checks-failures,"/",checks," checks passed; max walk gap=",max_gap," recovery switches=",recovery_switches," max step=",largest_step)
	game.queue_free()
	await process_frame
	quit(0 if failures==0 else 1)
