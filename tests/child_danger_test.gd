extends "res://tests/prototype_test.gd"

var max_step: float = 0.0
var penetration: bool = false
var previous: Vector3
var watching: bool = false

func observe() -> void:
	if not watching:
		return
	max_step = maxf(max_step, game.child.position.distance_to(previous))
	penetration = penetration or game.child.test_move(game.child.global_transform, Vector3.ZERO)
	previous = game.child.position

func scenario(father_position: Vector3, child_position: Vector3, enemy_position: Vector3, enemy_facing: Vector3) -> void:
	watching = false
	if is_instance_valid(game):
		game.queue_free()
		await process_frame
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	game.enemy.set_physics_process(false) # Real vision and geometry, stationary threat.
	game.enemy.position = enemy_position
	game.enemy.facing = enemy_facing
	game.father.active = false
	reset_positions(father_position, child_position)
	await ticks(2)
	previous = game.child.position
	watching = true

func run() -> void:
	physics_frame.connect(observe)
	await scenario(Vector3(-7,0,3),Vector3(-7,0,7),Vector3(8,0,-8),Vector3.RIGHT)
	await ticks(240)
	check(not game.child.danger.is_active() and game.child.position.distance_to(game.father.position) < 1.35, "Normal following is unchanged without a threat")

	await scenario(Vector3(-8,0,-4),Vector3(-8,0,3),Vector3(-8,0,0),Vector3.BACK)
	check(game.enemy.can_see(game.child), "Controlled enemy genuinely sees the child")
	await ticks(18)
	check(game.child.danger.is_active() and game.child.crouched, "Sight enters danger and child crouches")
	var held = game.child.position
	await ticks(90)
	check(game.child.danger.state == ChildDanger.State.HOLD and game.child.position.distance_to(held) < .1, "Without reachable safe cover child holds instead of crossing enemy")

	await scenario(Vector3(-1.6,0,-4.6),Vector3(-1.6,0,3.8),Vector3(-.2,0,7),Vector3.FORWARD)
	await ticks(15)
	check(game.child.danger.state == ChildDanger.State.SEEK_COVER, "Nearby reachable cover is selected under direct threat")
	await ticks(200)
	check(game.child.danger.state == ChildDanger.State.HIDDEN and not game.enemy.can_see(game.child), "Child physically reaches cover and breaks enemy sight")
	check(game.child.position.z > -1 and game.child.position.distance_to(game.father.position) > 3, "Child does not blindly run to distant father")

	await scenario(Vector3(3,0,4.8),Vector3(-.2,0,2.3),Vector3(-.2,0,7),Vector3.FORWARD)
	await ticks(30)
	check(game.child.danger.is_active(), "Exposed reunion route triggers danger even at a covered start")
	held = game.child.position
	await ticks(240)
	check(game.child.danger.state == ChildDanger.State.HIDDEN and game.child.position.distance_to(held) < .1, "Child stays behind crate while the exit route is watched")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.FOLLOW and game.child.danger.is_active(), "F at a distance cannot pull child out of cover")
	command("child_wait")
	check(game.child.mode == ChildCompanion.Mode.WAIT and game.child.danger.is_active(), "Q records WAIT without cancelling danger")
	command("child_wait")
	check(game.child.mode == ChildCompanion.Mode.FOLLOW and game.child.danger.is_active(), "Q can request FOLLOW without forcing an exposed crossing")
	game.enemy.facing = Vector3.RIGHT
	await ticks(35)
	game.enemy.facing = Vector3.FORWARD
	await ticks(25)
	check(game.child.danger.safe_time < .1 and game.child.danger.is_active(), "A brief safe window is cancelled when danger returns")
	game.enemy.position = Vector3(9,0,-9)
	await ticks(70)
	check(game.child.danger.is_active() and game.child.position.distance_to(held) < .1, "Cover is retained during safety delay")
	await ticks(100)
	check(not game.child.danger.is_active() and game.child.mode == ChildCompanion.Mode.FOLLOW, "Continuous safety gradually restores FOLLOW")
	await ticks(360)
	check(game.child.position.distance_to(game.father.position) < 1.35, "Child physically rejoins father after threat leaves")

	await scenario(Vector3(-1,0,2.35),Vector3(-.2,0,2.3),Vector3(-.2,0,7),Vector3.FORWARD)
	await ticks(30)
	held = game.child.position
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.HAND and game.child.danger.is_active(), "Nearby F records HAND without bypassing threat safety")
	await ticks(45)
	check(game.child.position.distance_to(held) < .1, "Requested HAND does not drag child from cover")
	command("hold_hand")
	check(game.child.mode == ChildCompanion.Mode.FOLLOW and game.child.danger.is_active(), "F releases pending HAND without breaking hiding")
	command("child_wait")
	game.enemy.active = false
	await ticks(170)
	check(not game.child.danger.is_active() and game.child.mode == ChildCompanion.Mode.WAIT and game.child.position.distance_to(held) < .1 and not game.child.crouched, "Safe release honours WAIT and restores the child's own posture")

	await scenario(Vector3(-1,0,2.35),Vector3(-.2,0,2.3),Vector3(-.2,0,7),Vector3.FORWARD)
	await ticks(30)
	command("hold_hand")
	game.father.active = true
	check(await navigate_father(Vector3(-6,0,1)), "Father can move away while hand contact is suspended by danger")
	game.enemy.active = false
	await ticks(170)
	check(not game.child.danger.is_active() and game.child.mode == ChildCompanion.Mode.FOLLOW, "Distant broken hand contact resumes as physical FOLLOW")

	# Near threat behind its cone, and a wall that must prevent detection through geometry.
	await scenario(Vector3(-7,0,4),Vector3(-7,0,2),Vector3(-7,0,0),Vector3.FORWARD)
	await ticks(18)
	check(not game.enemy.can_see(game.child) and game.child.danger.is_active(), "Very close unobstructed enemy triggers caution outside its cone")
	await scenario(Vector3(2.4,0,-4.5),Vector3(3.3,0,-4.5),Vector3(4.8,0,-4.5),Vector3.LEFT)
	await ticks(40)
	check(not game.child.danger.is_active(), "A solid wall prevents nearby threat detection through geometry")
	check(not penetration and max_step < .12, "All danger movement respects collisions and never teleports")
	print("RESULT danger: ",checks-failures,"/",checks," max step=",max_step)
	watching = false
	game.queue_free()
	await process_frame
	quit(0 if failures == 0 else 1)
