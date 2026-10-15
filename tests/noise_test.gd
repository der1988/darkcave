extends "res://tests/prototype_test.gd"

var events: Array[NoiseBus.Event] = []
var event_frames: Array[int] = []

func record(event: NoiseBus.Event) -> void:
	events.append(event)
	event_frames.append(Engine.get_physics_frames())

func clear_events() -> void:
	events.clear()
	event_frames.clear()

func fresh(enemy_position: Vector3 = Vector3(-7,0,0)) -> void:
	Controls.configure()
	release_movement()
	clear_events()
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
	reset_positions(Vector3(-9,0,-9),Vector3(-8,0,-9))
	await ticks(4)
	game.noises.emitted.connect(record)

func walk_input() -> void:
	Input.action_press("move_up")
	Input.action_press("move_right")

func run() -> void:
	await fresh()
	game.enemy.active = false
	game.father.active = true
	game.child.active = true
	game.child.mode = ChildCompanion.Mode.WAIT
	reset_positions(Vector3(-7,0,7),Vector3(-8,0,7))
	await ticks(120)
	check(events.is_empty(), "Stationary father and waiting child emit no footsteps")
	walk_input()
	await ticks(120)
	release_movement()
	check(events.size() >= 3 and events.size() <= 10, "Walking footsteps are discrete travel-based events")
	var walking = events[-1].radius if not events.is_empty() else 0.0
	check(walking == 2.5 and events[-1].kind == NoiseBus.Kind.WALK and events[-1].source == game.father, "Father walking event includes origin, radius, kind and producer")
	await ticks(20)
	reset_positions(Vector3(-7,0,7),Vector3(-8,0,7))
	await ticks(3)
	clear_events()
	walk_input()
	Input.action_press("run")
	await ticks(120)
	release_movement()
	var running = 0.0
	var cadence_ok = true
	for i in events.size():
		running = maxf(running, events[i].radius)
		if i > 0:
			cadence_ok = cadence_ok and event_frames[i]-event_frames[i-1] >= 16
	check(running == 6 and running > walking, "Actual running produces a larger perception radius")
	check(cadence_ok and events.size() <= 10, "Step cadence prevents notifications on every frame")
	await ticks(20)
	reset_positions(Vector3(-7,0,7),Vector3(-8,0,7))
	await ticks(3)
	clear_events()
	Input.action_press("crouch")
	walk_input()
	await ticks(120)
	release_movement()
	var quiet = not events.is_empty()
	for event in events:
		quiet = quiet and event.radius <= .4 and event.kind == NoiseBus.Kind.CROUCH
	check(quiet, "Crouched movement is significantly quieter")
	await ticks(20)
	reset_positions(Vector3(-4.2,0,-4),Vector3(-8,0,7))
	Input.action_press("move_down")
	Input.action_press("move_right")
	await ticks(100)
	clear_events()
	var blocked = game.father.position
	await ticks(100)
	release_movement()
	check(events.is_empty() and blocked.distance_to(game.father.position) < .02, "Pushing into a solid wall does not create phantom steps")

	game.father.active = false
	game.child.mode = ChildCompanion.Mode.FOLLOW
	game.child._reset_follow()
	reset_positions(Vector3(-7,0,-1),Vector3(-7.8,0,7))
	clear_events()
	await ticks(240)
	var child_walk = false
	var child_run = false
	var coherent = not events.is_empty()
	for event in events:
		coherent = coherent and event.source == game.child
		child_walk = child_walk or (event.kind == NoiseBus.Kind.WALK and event.radius < walking)
		child_run = child_run or (event.kind == NoiseBus.Kind.RUN and event.radius == 4.0)
	check(coherent and child_walk and child_run, "Child emits its own lighter steps and louder recovery steps")
	await ticks(180)
	clear_events()
	await ticks(90)
	check(events.is_empty(), "Settled companion does not emit movement noise")

	await fresh()
	game.enemy.active = false
	game.father.active = true
	game.child.active = true
	reset_positions(Vector3(-7,0,7),Vector3(-7.85,0,7.1))
	await ticks(3)
	command("hold_hand")
	await ticks(150)
	clear_events()
	walk_input()
	Input.action_press("run")
	await ticks(120)
	release_movement()
	var father_steps = 0
	var child_steps = 0
	var shared_cadence = true
	var last_frame = {}
	for i in events.size():
		var source = events[i].source
		father_steps += int(source == game.father)
		child_steps += int(source == game.child)
		if last_frame.has(source):
			shared_cadence = shared_cadence and event_frames[i]-last_frame[source] >= 16
		last_frame[source] = event_frames[i]
	check(game.child.mode == ChildCompanion.Mode.HAND and father_steps >= 2 and child_steps >= 2, "Hand formation emits distinct real steps for both actors")
	check(shared_cadence and events.size() <= 18, "Shared movement does not duplicate each actor's foot events")

	await fresh()
	var visual_memory = game.enemy.last_seen
	game.noises.publish(Vector3(-7,0,12),6,NoiseBus.Kind.RUN,game.father)
	check(not game.enemy.has_heard and game.enemy.state == PatrolEnemy.State.PATROL, "Out-of-range sounds are ignored")
	game.noises.publish(Vector3(-7,0,2),2.5,NoiseBus.Kind.WALK,game.father)
	check(game.enemy.has_heard and game.enemy.state == PatrolEnemy.State.INVESTIGATE and game.enemy.target == null, "Audible noise causes investigation, not automatic visual chase")
	var heard = game.enemy.last_heard
	check(heard == Vector3(-7,0,2) and game.enemy.last_seen == visual_memory, "Heard position remains distinct from visual memory")
	game.father.position = Vector3(-8,0,-9)
	game.enemy.set_physics_process(true)
	await ticks(40)
	check(game.enemy.last_heard == heard and game.enemy.last_seen == visual_memory and game.enemy.position.z > .3, "Enemy travels to heard snapshot without tracking the unseen producer")
	await ticks(100)
	var sound_search = game.enemy.state == PatrolEnemy.State.SEARCH
	for point in game.enemy.search_points:
		sound_search = sound_search and point.distance_to(heard) < 2
	check(sound_search and not game.enemy.search_points.is_empty(), "Existing SEARCH inspects the heard area rather than old visual memory")

	await fresh(Vector3(-4.5,0,-4.5))
	game.enemy.facing = Vector3.LEFT
	game.noises.publish(Vector3(-2.2,0,-4.5),4,NoiseBus.Kind.WALK,game.father)
	check(not game.enemy.has_heard, "Solid obstacle attenuates a sound below hearing threshold")
	game.noises.publish(Vector3(-2.2,0,-4.5),8,NoiseBus.Kind.METAL,game.metal_can)
	check(game.enemy.has_heard and game.enemy.state == PatrolEnemy.State.INVESTIGATE, "Stronger sound can still be heard through the same wall")

	await fresh()
	game.noises.publish(Vector3(-7,0,2),2.5,NoiseBus.Kind.WALK,game.father)
	heard = game.enemy.last_heard
	game.enemy.state_time = .7
	for i in 60:
		game.noises.publish(Vector3(-7,0,2+i*.001),2.5,NoiseBus.Kind.WALK,game.father)
	check(game.enemy.last_heard == heard and game.enemy.state_time == .7, "Repeated footsteps do not reset investigation or oscillate destinations")
	game.noises.publish(Vector3(-6,0,1),8,NoiseBus.Kind.METAL,game.metal_can)
	check(game.enemy.last_heard == Vector3(-6,0,1), "A clearly stronger distraction can supersede weak footsteps")
	game.enemy.set_physics_process(true)
	await ticks(100)
	game.noises.publish(Vector3(-7,0,4),6,NoiseBus.Kind.RUN,game.father)
	check(game.enemy.last_heard == Vector3(-7,0,4) and game.enemy.state == PatrolEnemy.State.INVESTIGATE, "New meaningful noise updates destination after cooldown")

	await fresh()
	game.father.position = Vector3(-7,0,-3)
	await ticks(2)
	game.noises.publish(Vector3(-7,0,2),8,NoiseBus.Kind.METAL,game.metal_can)
	check(not game.enemy.has_heard, "Currently visible character takes priority before hearing callback")
	game.enemy.set_physics_process(true)
	await ticks(2)
	visual_memory = game.enemy.last_seen
	game.noises.publish(Vector3(-7,0,3),8,NoiseBus.Kind.METAL,game.metal_can)
	check(game.enemy.state == PatrolEnemy.State.CHASE and game.enemy.last_seen == visual_memory and not game.enemy.investigating_sound, "Noise cannot interrupt a visual chase or overwrite seen memory")

	await fresh(Vector3(5.2,0,-2))
	game.enemy.facing = Vector3.RIGHT
	game.father.position = Vector3(1.5,0,-2)
	await ticks(3)
	check(game.interaction_target() == game.metal_can and game.interaction_hint().contains("lattina"), "Nearby can exposes a contextual deterministic E interaction")
	check(game.try_interact() and game.metal_can.used, "E triggers the metal distraction once")
	await ticks(35)
	var metal_events = 0
	for event in events:
		if event.kind == NoiseBus.Kind.METAL:
			metal_events += 1
	check(metal_events == 1 and game.enemy.last_heard.distance_to(game.metal_can.position) < .01, "Impact publishes one 8m event and attracts enemy toward the can")
	var landed = game.metal_can.position
	check(landed.y < .2 and not game.try_interact(), "Can stays on floor and repeated E cannot reuse it")
	await ticks(45)
	check(game.metal_can.position.distance_to(landed) < .001 and events.size() == 1, "Distraction remains spent without delayed extra events")

	await fresh()
	game.enemy.active = false
	game.father.position = Vector3(-1.6,0,-4.6)
	game.metal_can.position = Vector3(-1.3,1.02,-4.55)
	await ticks(3)
	check(game.resource_in_reach() and game.interaction_target() == game.metal_can, "Nearest reachable interaction wins when both targets are nearby")
	game.metal_can.position = Vector3(-1.3,1.1,-5.4)
	check(game.metal_can.in_reach(game.father) and game.interaction_target() == game.level.get_node("Resource"), "Water wins deterministically when it is closer")
	check(game.try_interact() and game.resource_collected and not game.metal_can.used, "Water objective is preserved independently from optional distraction")
	AudioServer.set_bus_mute(0,true)
	clear_events()
	game.noises.publish(Vector3.ZERO,8,NoiseBus.Kind.METAL,game.metal_can)
	check(events.size() == 1, "Gameplay noise delivery is independent from audio output and mute")
	AudioServer.set_bus_mute(0,false)
	check(game.father.get_node("AudioListener3D").is_current() and game.metal_can.audio.stream.get_length() > .2, "Spatial listener and small local audio assets are configured")
	print("RESULT noise: ",checks-failures,"/",checks)
	clear_events()
	game.queue_free()
	await process_frame
	quit(0 if failures == 0 else 1)
