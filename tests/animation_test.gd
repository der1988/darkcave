extends "res://tests/prototype_test.gd"

func sample(actor: HumanActor, speed: float, seconds: float = 1.0/60.0) -> void:
	actor.sprite.animate(actor, seconds, Vector3.RIGHT * speed * seconds)

func run() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await ticks(5)
	game.enemy.active = false
	game.child.mode = ChildCompanion.Mode.WAIT
	game.father.set_physics_process(false)
	game.child.set_physics_process(false)
	for actor in [game.father,game.child]:
		var art = actor.sprite as CharacterSprite
		var name = "child" if actor == game.child else "father"
		check(art != null and art.hframes == 24 and art.vframes == 9, name+": 24x48 cells, directional gait atlas")
		var before = actor.global_transform
		var shape = actor.body_shape.shape.duplicate()
		actor.crouched = false
		sample(actor,0.0)
		check(art.gait == CharacterSprite.Gait.IDLE, name+": stationary idle")
		sample(actor,2.6)
		check(art.gait == CharacterSprite.Gait.WALK, name+": walking at actual normal speed")
		sample(actor,3.35 if actor == game.child else 4.2)
		check(art.gait == CharacterSprite.Gait.RUN, name+": distinct recovery/run gait")
		sample(actor,2.8 if actor == game.father else 2.65)
		check(art.gait == CharacterSprite.Gait.RUN, name+": run exit hysteresis avoids chatter")
		sample(actor,0.0)
		actor.crouched = true
		sample(actor,0.0)
		check(art.gait == CharacterSprite.Gait.CROUCH_IDLE and art.scale == Vector3.ONE and is_equal_approx(art.position.y,1.04),name+": painted crouch, no vertical squash or anchor shift")
		sample(actor,1.25)
		check(art.gait == CharacterSprite.Gait.CROUCH_WALK,name+": distinct low walking gait")
		check(actor.global_transform == before and actor.body_shape.shape.height == shape.height and actor.body_shape.shape.radius == shape.radius,name+": animation never writes physical transform or capsule")
		actor.crouched = false
		art.phase = 0.0
		for i in 60:
			sample(actor,1.0)
		var slow_phase = art.phase
		art.phase = 0.0
		for i in 60:
			sample(actor,2.0)
		var stride = 1.5 if actor == game.child else 1.8
		check(is_equal_approx(slow_phase,fposmod(1.0/stride,1.0)) and is_equal_approx(art.phase,fposmod(2.0/stride,1.0)),name+": stride advances by metres, not fixed wall-clock FPS")
		var sheet = art.texture.get_image()
		var unique_poses: Array[PackedByteArray] = []
		for row in 5:
			var pose = sheet.get_region(Rect2i(432,row*48,24,48))
			check(not unique_poses.has(pose.get_data()),name+": gait "+str(row)+" has its own painted silhouette")
			unique_poses.append(pose.get_data())
		for facing in [Vector3(1,0,1),Vector3(-1,0,-1),Vector3(-1,0,1),Vector3(1,0,-1)]:
			actor.facing = facing.normalized()
			sample(actor,2.6)
			var expected = [Vector3(1,0,1),Vector3(-1,0,-1),Vector3(-1,0,1),Vector3(1,0,-1)].find(facing)
			check(art.orientation == expected and art.frame < 216,name+": facing "+str(expected)+" uses valid atlas bank")
	# Native collision test: pushing against the boundary must stop the gait.
	game.father.position = Vector3(-9.65,0,6)
	game.father.crouched = false
	for i in 120:
		game.father.drive(Vector3.LEFT,2.6,1.0/60.0)
		await physics_frame
	check(game.father.sprite.gait == CharacterSprite.Gait.IDLE,"Blocked actor stops walking despite held movement intent")
	reset_positions(Vector3(-7,0,6),Vector3(-7.8,0,6))
	await ticks(2)
	check(game.child.toggle_hand(),"HAND still enters through existing command")
	sample(game.father,2.0)
	sample(game.child,2.0)
	check(game.father.sprite.hand_pose and game.child.sprite.hand_pose,"HAND enables contact arm on both sprites")
	game.child.hand_single_file = true
	sample(game.father,2.0)
	check(not game.father.sprite.hand_pose,"Narrow passage releases cosmetic contact arm")
	game.child.toggle_wait()
	sample(game.child,0.0)
	check(not game.child.sprite.hand_pose and game.child.mode == ChildCompanion.Mode.WAIT,"WAIT releases pose without changing command logic")
	check(not (game.enemy.sprite is CharacterSprite) and game.enemy.sprite.hframes == 12,"Enemy keeps its existing animation system")
	game.queue_free()
	await process_frame
	print("RESULT: ",checks-failures,"/",checks," checks passed")
	quit(1 if failures else 0)
