extends "res://tests/prototype_test.gd"

var watching: bool = false
var previous: Vector3
var max_step: float = 0.0
var overlap: bool = false

func observe() -> void:
	if not watching:
		return
	max_step = maxf(max_step, game.enemy.position.distance_to(previous))
	overlap = overlap or game.enemy.test_move(game.enemy.global_transform, Vector3.ZERO)
	previous = game.enemy.position

func scenario(enemy_position: Vector3, father_position: Vector3) -> void:
	watching = false
	if is_instance_valid(game):
		game.queue_free()
		await process_frame
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	game.enemy.set_physics_process(false)
	game.enemy.position = enemy_position
	game.enemy.facing = Vector3.FORWARD
	game.father.active = false
	game.child.active = false
	reset_positions(father_position,Vector3(-9,0,8))
	await ticks(3)
	previous = game.enemy.position
	watching = true
	game.enemy.set_physics_process(true)

func until_state(expected: PatrolEnemy.State, frames: int) -> bool:
	for frame in frames:
		if game.enemy.state == expected:
			return true
		await ticks(1)
	return game.enemy.state == expected

func run() -> void:
	physics_frame.connect(observe)
	await scenario(Vector3(5.8,0,3.4),Vector3(-9,0,-8))
	var start = game.enemy.position
	await ticks(90)
	check(game.enemy.state == PatrolEnemy.State.PATROL and game.enemy.position.distance_to(start) > 1.5, "Normal patrol moves along existing route")

	await scenario(Vector3(-5,0,-3),Vector3(-5,0,-6.5))
	await ticks(5)
	check(game.enemy.state == PatrolEnemy.State.CHASE and game.enemy.target == game.father, "Visible father immediately triggers CHASE")
	var memory = game.enemy.last_seen
	check(memory.distance_to(game.father.position) < .03, "Memory equals a genuinely observed position")
	game.father.position = Vector3(-1.8,0,-4.5)
	await ticks(2)
	check(not game.enemy.can_see(game.father) and game.enemy.state == PatrolEnemy.State.INVESTIGATE, "Lost sight immediately transitions to INVESTIGATE")
	check(game.enemy.target == null and game.enemy.last_seen == memory, "Losing sight clears target reference but preserves observation")
	game.father.position = Vector3(2.5,0,-4.5)
	await ticks(20)
	check(game.enemy.last_seen == memory, "Unseen movement behind shop walls does not update memory")
	check(await until_state(PatrolEnemy.State.SEARCH,240), "Enemy physically reaches investigation area and starts SEARCH")
	check(Vector2(game.enemy.position.x-memory.x,game.enemy.position.z-memory.z).length() < .75, "Investigation reaches the last observed location")
	var points = game.enemy.search_points.duplicate()
	var points_valid = points.size() >= 2 and points.size() <= 3
	for point in points:
		var nearest = NavigationServer3D.map_get_closest_point(game.enemy.agent.get_navigation_map(),point)
		var path = game.enemy._reachable_path(point)
		points_valid = points_valid and nearest.distance_to(point) < .02 and point.distance_to(memory) < 2.0 and not path.is_empty()
	check(points_valid, "SEARCH points are local and reachable on native navmesh")
	game.enemy._build_search_points()
	check(points == game.enemy.search_points, "Search candidates are deterministic from observation and navigation")
	var search_start = game.enemy.position
	check(await until_state(PatrolEnemy.State.RETURN,400), "Unsuccessful search ends within its configured duration")
	check(game.enemy.search_index >= 2 and game.enemy.position.distance_to(search_start) > .5, "SEARCH physically inspects multiple points with pauses")
	check(game.enemy.last_seen == memory, "Search and return never invent a new observed position")
	check(await until_state(PatrolEnemy.State.PATROL,1000), "RETURN physically rejoins an existing patrol point")
	check(game.enemy.position.distance_to(game.enemy.patrol_points[game.enemy.patrol_index]) < .8, "Patrol resumes near its return point, without snapping")

	# Reacquisition must interrupt search, including sightings of the child.
	await scenario(Vector3(-5,0,-3),Vector3(-5,0,-6.5))
	await ticks(4)
	game.father.position = Vector3(2.5,0,-4.5)
	await until_state(PatrolEnemy.State.SEARCH,240)
	game.enemy.facing = Vector3.FORWARD
	game.father.position = game.enemy.position + Vector3.FORWARD * 2.5
	await ticks(2)
	check(game.enemy.state == PatrolEnemy.State.CHASE and game.enemy.last_seen.distance_to(game.father.position) < .05, "A real sighting interrupts SEARCH and updates memory immediately")
	game.father.position = Vector3(-9,0,8)
	game.child.position = game.enemy.position + Vector3.FORWARD * 2.5
	await ticks(2)
	check(game.enemy.state == PatrolEnemy.State.CHASE and game.enemy.target == game.child, "Child is an equally valid reacquired target")

	# Real child 0.4 controller and moving enemy, not a mocked can_see result.
	await scenario(Vector3(-.2,0,7),Vector3(-1.6,0,-4.6))
	watching = false
	game.child.position = Vector3(-1.6,0,3.8)
	await ticks(2)
	previous = game.enemy.position
	watching = true
	check(game.enemy.state == PatrolEnemy.State.CHASE and game.enemy.target == game.child, "Enemy actually observes exposed child before hiding")
	game.child.active = true
	var lost_child = false
	for frame in 200:
		await ticks(1)
		if game.enemy.state == PatrolEnemy.State.INVESTIGATE and not game.enemy.can_see(game.child):
			lost_child = true
			break
	check(lost_child and game.child.danger.is_active() and game.child.crouched, "Child cover reaction breaks sight and triggers genuine investigation")
	check(game.phase == PrototypeGame.Phase.PLAYING, "Taking cover does not cause a remote or automatic capture")
	await scenario(Vector3(-3.7,0,5.5),Vector3(-3.7,0,-.5))
	game.enemy.set_physics_process(false)
	Input.action_press("crouch")
	await ticks(2)
	check(not game.enemy.can_see(game.father), "Car physically blocks sight to a crouching character")
	Input.action_release("crouch")
	await ticks(2)
	check(game.enemy.can_see(game.father), "Standing above low car silhouette remains legitimately visible")
	check(not overlap and max_step < .12, "Enemy uses physical navigation without penetration or teleport")
	print("RESULT enemy memory: ",checks-failures,"/",checks," max step=",max_step)
	watching = false
	game.queue_free()
	await process_frame
	quit(0 if failures == 0 else 1)
