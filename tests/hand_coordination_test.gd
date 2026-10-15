extends "res://tests/child_follow_test.gd"

var watching: bool = false
var previous_father: Vector3
var previous_child: Vector3
var max_body_step: float = 0.0
var min_body_gap: float = INF
var overlap_seen: bool = false
var narrow_seen: bool = false
var minimum_pace: float = 1.0
var maximum_pace_change: float = 0.0
var previous_pace: float = 1.0

func watch_motion() -> void:
	if not watching:
		return
	max_body_step = maxf(max_body_step, maxf(game.father.position.distance_to(previous_father), game.child.position.distance_to(previous_child)))
	min_body_gap = minf(min_body_gap, game.father.position.distance_to(game.child.position))
	overlap_seen = overlap_seen or game.father.test_move(game.father.global_transform, Vector3.ZERO) or game.child.test_move(game.child.global_transform, Vector3.ZERO)
	if game.child.mode == ChildCompanion.Mode.HAND:
		minimum_pace = minf(minimum_pace, game.father.hand_pace)
		maximum_pace_change = maxf(maximum_pace_change, absf(game.father.hand_pace - previous_pace))
	previous_pace = game.father.hand_pace
	narrow_seen = narrow_seen or game.child.hand_single_file
	previous_father = game.father.position
	previous_child = game.child.position

func hand_setup(father_position: Vector3, child_position: Vector3) -> void:
	watching = false
	await setup_pair(father_position, child_position)
	command("hold_hand")
	previous_father = game.father.position
	previous_child = game.child.position
	previous_pace = game.father.hand_pace
	watching = true

func move_world(direction: Vector3) -> void:
	release_movement()
	var screen = Vector2(direction.x - direction.z, direction.x + direction.z).normalized()
	Input.action_press("move_right", maxf(0, screen.x))
	Input.action_press("move_left", maxf(0, -screen.x))
	Input.action_press("move_down", maxf(0, screen.y))
	Input.action_press("move_up", maxf(0, -screen.y))

func run() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await ticks(5)
	game.enemy.active = false
	physics_frame.connect(watch_motion)
	await hand_setup(Vector3(-7,0,8), Vector3(-7.9,0,8.2))
	check(game.child.mode == ChildCompanion.Mode.HAND, "F enters HAND nearby")
	await ticks(180)
	var offset = game.child.position - game.father.position
	check(absf(offset.x) > .65 and absf(offset.z) < .35, "Child joins a lateral slot instead of the father's centre")
	var settled = game.child.position
	await ticks(120)
	check(game.child.position.distance_to(settled) < .06, "Stationary formation settles without repeated corrections")
	move_world(Vector3.FORWARD)
	var max_gap = 0.0
	var lateral_frames = 0
	var pace_jump = 0.0
	for frame in 180:
		var before = game.father.hand_pace
		await ticks(1)
		pace_jump = maxf(pace_jump, absf(game.father.hand_pace - before))
		offset = game.child.position - game.father.position
		max_gap = maxf(max_gap, offset.length())
		if frame > 60 and absf(offset.x) > .6 and absf(offset.z) < .45:
			lateral_frames += 1
	check(max_gap < 1.5 and lateral_frames > 100, "Straight walking keeps a stable side-by-side formation")
	check(Vector2(game.father.velocity.x,game.father.velocity.z).length() > 1.7 and pace_jump < .04, "Pair sustains walking speed with gradual shared pacing")
	for direction in [Vector3.BACK, Vector3.RIGHT, Vector3.LEFT]:
		move_world(direction)
		await ticks(100)
		release_movement()
		await ticks(180)
		check(game.child.position.distance_to(game.father.position) < 1.25, "Formation recovers after abrupt turn " + str(direction))
	release_movement()
	await ticks(180)
	settled = game.child.position
	await ticks(120)
	check(game.child.position.distance_to(settled) < .06, "Stopping after turns does not produce idle circling")
	move_world(Vector3.FORWARD)
	Input.action_press("crouch")
	await ticks(100)
	check(game.father.crouched and game.child.crouched and game.child.position.distance_to(game.father.position) < 1.3, "Crouched hand walking remains coordinated")
	release_movement()
	command("child_wait")
	await ticks(20)
	settled = game.child.position
	move_world(Vector3.BACK)
	await ticks(90)
	release_movement()
	check(game.child.mode == ChildCompanion.Mode.WAIT and game.child.position.distance_to(settled) < .05, "Q ends HAND and child waits while father walks away")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.WAIT, "F cannot acquire a distant waiting child")
	command("child_wait")
	await ticks(240)
	check(game.child.mode == ChildCompanion.Mode.FOLLOW and game.child.position.distance_to(game.father.position) < 1.35, "Q resumes unchanged FOLLOW after waiting")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.HAND, "F reacquires hand after FOLLOW resumes")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.FOLLOW, "F toggles HAND back to FOLLOW")

	await hand_setup(Vector3(-7,0,7), Vector3(-7.85,0,7.1))
	await ticks(120)
	check(await navigate_father(Vector3(-1.6,0,-4.6)), "Hand pair can navigate around car and enter shop doorway")
	await ticks(300)
	check(game.child.position.z < -1.4 and game.child.position.distance_to(game.father.position) < 1.3, "Child clears doorway and rejoins father inside")
	check(narrow_seen, "Formation temporarily folds behind father near restricted geometry")
	check(await navigate_father(Vector3(-7,0,1)), "Pair crosses doorway again on exit")
	await ticks(240)
	check(not game.child.hand_single_file and game.child.position.distance_to(game.father.position) < 1.25, "Lateral formation returns after leaving restricted space")
	check(minimum_pace < .95 and maximum_pace_change < .04, "Father actually adapts his pace without abrupt threshold changes")
	check(not overlap_seen and min_body_gap > .48, "Physical bodies never penetrate geometry or each other")
	check(max_body_step < .12, "All hand motion uses physics without teleporting")
	print("RESULT hand coordination: ",checks-failures,"/",checks,"; min gap=",min_body_gap," max step=",max_body_step)
	watching = false
	game.queue_free()
	await process_frame
	quit(0 if failures == 0 else 1)
