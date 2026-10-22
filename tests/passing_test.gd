extends SceneTree
var failures = 0
var checks = 0
var game: FootballSandbox
func _initialize():
	call_deferred("run")
func check(value: bool, label: String):
	checks += 1
	if not value:
		failures += 1
		push_error("FAIL · "+label)
func ticks(n: int):
	for i in n: await physics_frame
func run():
	game = load("res://scenes/football/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	game.get_node("DeviceUI/ControlMode").choose_mode("pc")
	await ticks(20)
	var passer = game.player
	var right = game.outfield[1]
	var left = game.outfield[2]
	var upper = game.outfield[3]
	# Hold a readable formation while testing real input and the shared preview.
	game.set_physics_process(false)
	for actor in game.outfield+[game.get_node("Goalkeeper")]: actor.set_physics_process(false)
	passer.position = Vector3.ZERO
	right.position = FootballControls.world_direction(Vector2.RIGHT)*5.0
	left.position = FootballControls.world_direction(Vector2.LEFT)*2.5
	upper.position = FootballControls.world_direction(Vector2.UP)*4.0
	passer.facing = FootballControls.world_direction(Vector2.RIGHT)
	check(game.choose_pass_target()==right,"Facing selects the aligned teammate over a nearer opposite teammate")
	Input.action_press("football_left")
	check(game.choose_pass_target()==left,"Left arrow immediately changes the receiver")
	Input.action_release("football_left")
	Input.action_press("football_up")
	check(game.choose_pass_target()==upper,"Up arrow selects the goalward receiver")
	game.pass_target._process(0.0)
	check(game.pass_target.marker.visible and game.pass_target.global_position.is_equal_approx(upper.global_position+Vector3.UP*1.9),"Small preview follows the selected receiver")
	check(game.attempt_pass(0.0,false) and game.pass_receiver==upper,"Short pass uses the indicated receiver")
	Input.action_release("football_up")
	game.pass_receiver = null
	passer.facing = FootballControls.world_direction(Vector2.RIGHT)
	check(game.choose_pass_target()==right,"Releasing input falls back to character orientation")
	game.ball.pending_recall = Vector3(3,1.4,3)
	game.ball.release_velocity = Vector3(0,-2,0)
	var saw_bounce = false
	for i in 180:
		await physics_frame
		if game.ball.bounce_age<0.04: saw_bounce = true
	check(saw_bounce and game.rules.rally_live and not game.rules.resetting and game.rules.keeper_id=="David","Real floor bounces do not stop a pass or swap keeper")
	game.ball.pending_recall = passer.position+passer.facing*0.7+Vector3.UP*0.22
	await ticks(2)
	game.ball.touch_lock = 0.0
	check(not game.attempt_kick(0.6,false) and not game.rules.resetting,"Grounded shots are refused without penalizing a permitted bounce")
	check(game.attempt_pass(0.0,false),"The ball can be passed again from the ground")
	game.ball.pending_recall = passer.position+passer.facing*0.7+Vector3.UP*0.22
	await ticks(2)
	game.ball.touch_lock = 0.0
	var preview = game.choose_pass_target()
	check(game.attempt_pass(0.7,true) and game.pass_receiver==preview,"Charged high pass uses the same preview")
	game.ball.pending_recall = passer.position+passer.facing*0.7+Vector3.UP*0.9
	await ticks(2)
	game.ball.touch_lock = 0.0
	game.ball.bounce_age = 0.02
	check(game.attempt_kick(0.6,false) and game.ball.last_kick_volley,"A rebounding airborne ball is eligible for a volley")
	game.rules.resetting = true
	game.pass_target._process(0.0)
	check(not game.pass_target.marker.visible,"Dead-ball state hides the target")
	game.rules.start_match()
	game.rules.enabled = false
	game.set_physics_process(true)
	for actor in game.outfield+[game.get_node("Goalkeeper")]: actor.set_physics_process(true)
	await ticks(20)
	var receiver = game.choose_pass_target()
	game.pass_receiver = receiver
	game.pass_high = false
	game.pass_age = 0.4
	game.receive_target = receiver.position
	game.ball.pending_recall = receiver.position+receiver.facing*0.7+Vector3.UP*0.22
	game.ball.touch_lock = 0.0
	game.rules.enabled = true
	game.rules.rally_live = true
	game.rules.last_touch = game.player.participant_id
	await ticks(10)
	check(game.player==receiver and not game.rules.resetting,"Ground reception transfers control during a live action")
	check(game.rules.last_touch==receiver.participant_id,"A grounded recovery updates responsibility for the next out-of-bounds")
	game.rules.enabled = false
	var max_change = 0.0
	var previous = {}
	for i in 240:
		if i==100:
			game.ball.pending_recall = Vector3(3,0.22,3)
		await physics_frame
		for actor in game.active_outfield():
			if actor==game.player: continue
			var v = Vector3(actor.velocity.x,0,actor.velocity.z)
			if previous.has(actor): max_change = maxf(max_change,v.distance_to(previous[actor]))
			previous[actor] = v
	check(max_change<0.3,"Supporting players adapt smoothly without abrupt velocity changes")
	# Near-identical directions do not flicker; eliminated candidates disappear.
	game.set_physics_process(false)
	passer = game.player
	var candidates = game.active_outfield()
	candidates.erase(passer)
	for i in candidates.size(): candidates[i].position = passer.position+Vector3(4,0,-4+i*0.08)
	passer.facing = Vector3(1,0,-1).normalized()
	var initial = game.choose_pass_target()
	var stable = true
	for i in 20:
		passer.facing = Vector3(1,0,-1+(0.005 if i%2 else -0.005)).normalized()
		stable = stable and game.choose_pass_target()==initial
	check(stable,"Near ties retain a stable preview")
	initial.participant_id = ""
	check(game.choose_pass_target()!=initial,"An eliminated player cannot remain selected")
	for actor in candidates: actor.participant_id = ""
	game.pass_target._process(0.0)
	check(game.choose_pass_target()==null and not game.pass_target.marker.visible,"No indicator when only one outfielder remains")
	game.queue_free()
	await process_frame
	print("RESULT passing: ",checks-failures,"/",checks," max velocity change ",max_change)
	quit(1 if failures else 0)
