extends SceneTree

var game: FootballSandbox
var checks = 0
var failures = 0

func _initialize() -> void:
	call_deferred("run")

func check(value: bool, label: String) -> void:
	checks += 1
	if value:
		print("PASS · ",label)
	else:
		failures += 1
		push_error("FAIL · "+label)

func ticks(count: int) -> void:
	for i in count:
		await physics_frame

func command(name: String, pressed: bool = true) -> void:
	var event = InputEventAction.new()
	event.action = "football_"+name
	event.pressed = pressed
	game._unhandled_input(event)

func run() -> void:
	game = load("res://scenes/football/eleven.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	game.get_node("MatchRules").enabled = false
	game.get_node("DeviceUI/ControlMode").choose_mode("pc")
	await ticks(30)
	check(ProjectSettings.get_setting("application/run/main_scene")=="res://scenes/football/main.tscn","Football sandbox is the active game")
	check(get_nodes_in_group("football_player").size()==4 and game.find_children("*","Light3D",true,false).is_empty(),"Four outfield players and no flashlight or other lights")
	check(game.get_node_or_null("Father")==null and game.get_node_or_null("Child")==null and game.get_node_or_null("Enemy")==null,"No companion or hostile actor in the new scene")
	check(game.camera.projection==Camera3D.PROJECTION_ORTHOGONAL and is_equal_approx(game.camera.size,18.72),"Fixed isometric orthographic framing")
	var wheel = InputEventMouseButton.new()
	wheel.pressed = true
	wheel.button_index = MOUSE_BUTTON_WHEEL_UP
	for i in 30:
		game._unhandled_input(wheel)
	check(is_equal_approx(game.desired_zoom,12.0),"Mouse wheel can move closer without exceeding near limit")
	wheel.button_index = MOUSE_BUTTON_WHEEL_DOWN
	for i in 30:
		game._unhandled_input(wheel)
	check(is_equal_approx(game.desired_zoom,34.0),"Mouse wheel can return to the former wide framing within far limit")
	game.desired_zoom = 18.72
	var art = game.player.sprite.texture.get_image().get_region(Rect2i(0,0,61,61)).get_used_rect()
	var height = art.size.y*game.player.sprite.pixel_size/game.camera.size*720.0
	check(height>=54.0 and height<=62.0,"Close camera makes the player clearly readable at 1280x720")
	check(game.player.sprite.hframes==8 and game.player.sprite.vframes==12 and game.ball.sprite.hframes==8 and game.ball.sprite.vframes==4,"Original player and ball frames have valid packed grids")
	for i in 8:
		var angle = i*PI/4.0
		var input = Vector2(cos(angle),sin(angle))
		var direction = FootballControls.world_direction(input)
		check(FootballControls.orientation(direction)==i,"Original directional art follows screen direction "+str(i))
	check(game.player.is_on_floor() and game.ball.position.y>=0.19,"Player and ball rest on the native infinite floor")
	# Golden cases from the C implementation, not a second copy of its formulas.
	var direction = Vector3.FORWARD
	var tap = FootballShotModel.launch(direction,0.0,0.4,45.0,1.0)
	var ideal = FootballShotModel.launch(direction,0.8,0.4,45.0,1.0)
	var over = FootballShotModel.launch(direction,1.0,0.4,45.0,1.0)
	check(absf(tap.length()-22.5)<0.001,"Source zero-charge shot retains half of base force")
	check(absf(ideal.length()-45.0)<0.001,"Source optimal shot reaches maximum force at 80 percent")
	check(absf(over.length()-38.25)<0.001 and over.y>ideal.y,"Source overcharge loses force and gains height")
	check(absf(ideal.y/(-ideal.z)-0.104)<0.001,"Source neutral elevation matches split-lerp golden value")
	var neutral = FootballShotModel.aim(Vector3.ZERO,Vector3(0,0,-10),2.0,Vector2.ZERO,Vector3.ZERO,0.8,0.0)
	check(Vector3(neutral.x,0,neutral.z).is_equal_approx(Vector3.FORWARD),"Source neutral aim points at the tree goal center")
	var high = FootballShotModel.aim(Vector3.ZERO,Vector3(0,0,-10),2.0,Vector2.UP,Vector3.ZERO,0.8,0.0)
	var low = FootballShotModel.aim(Vector3.ZERO,Vector3(0,0,-10),2.0,Vector2.DOWN,Vector3.ZERO,0.8,0.0)
	check(high.w>neutral.w and low.w<neutral.w,"Source directional input adjusts shot elevation")
	var side = FootballShotModel.aim(Vector3.ZERO,Vector3(0,0,-10),2.0,Vector2.RIGHT,Vector3.ZERO,0.8,0.0)
	check(absf(side.x)>0.1,"Source assisted aim can target either side of the opening")
	var limited = FootballShotModel.aim(Vector3.ZERO,Vector3(0,0,-10),2.0,Vector2.ZERO,Vector3.BACK*5,0.8,0.0)
	check(Vector3.BACK.angle_to(Vector3(limited.x,0,limited.z))<=deg_to_rad(100.01),"Source moving shot cannot turn beyond 100 degrees")
	var saved_position = game.ball.position
	game.ball.position.y = 0.7
	game.ball.linear_velocity.y = -2.0
	check(is_equal_approx(game.ball.contact_multiplier(),1.05),"Source falling-ball volley receives five percent bonus")
	game.ball.linear_velocity.y = 2.0
	game.ball.bounce_age = 0.1
	check(is_equal_approx(game.ball.contact_multiplier(),1.1),"Source early bounce contact receives ten percent bonus")
	game.ball.bounce_age = 0.35
	check(is_equal_approx(game.ball.contact_multiplier(),0.8),"Source late bounce contact loses twenty percent force")
	game.ball.position = saved_position
	game.ball.linear_velocity = Vector3.ZERO
	var fixed_camera = game.camera_rig.position
	var keeper = game.get_node("Goalkeeper")
	keeper.set_physics_process(false)
	keeper.collision_layer = 0
	var trees = game.get_node("Goal")
	check(trees.get_node_or_null("LeftPost")!=null and trees.get_node_or_null("RightPost")!=null,"Physical goal posts replace the trees")
	var space = game.get_world_3d().direct_space_state
	var trunk_ray = PhysicsRayQueryParameters3D.create(Vector3(-6,0.7,-4),Vector3(-6,0.7,0),1)
	check(not space.intersect_ray(trunk_ray).is_empty(),"Goal tree trunks block physical bodies")
	var opening_ray = PhysicsRayQueryParameters3D.create(Vector3(-2,0.7,-2),Vector3(-4.2,0.7,-4.2),1)
	check(space.intersect_ray(opening_ray).is_empty(),"Goal opening between the trees stays clear")
	var start = game.player.position
	Input.action_press("football_down")
	var largest_gap = 0.0
	var max_step = 0.0
	for i in 240:
		var previous = game.ball.position
		await physics_frame
		largest_gap = maxf(largest_gap,game.player.position.distance_to(game.ball.position))
		max_step = maxf(max_step,game.ball.position.distance_to(previous))
	check(Vector2(game.player.velocity.x,game.player.velocity.z).length()>3.9 and Vector2(game.player.velocity.x,game.player.velocity.z).length()<4.1,"Single movement speed stays steady while controlling the ball")
	check(game.get_node_or_null("GrassTrails")==null,"Asphalt has no grass footprints")
	Input.action_release("football_down")
	check(game.camera_rig.position.is_equal_approx(fixed_camera),"Camera stays fixed when the player moves across the field")
	check(game.player.position.distance_to(start)>14.0,"Movement advances continuously across the field")
	check(largest_gap<1.5 and max_step<0.2,"Dribbling rolls the native ball smoothly, without teleporting")
	await ticks(60)
	check(game.player.sprite.frame<8 and Vector2(game.player.velocity.x,game.player.velocity.z).length()<0.01,"Stopping returns to the original standing frame")
	var shift = InputEventKey.new()
	shift.physical_keycode = KEY_SHIFT
	shift.pressed = true
	Input.parse_input_event(shift)
	Input.action_press("football_right")
	await ticks(40)
	check(Vector2(game.player.velocity.x,game.player.velocity.z).length()>3.9 and Vector2(game.player.velocity.x,game.player.velocity.z).length()<4.1,"Shift cannot boost the single movement speed")
	Input.action_release("football_right")
	Input.action_press("football_left")
	var reverse_gap = 0.0
	var reverse_step = 0.0
	for i in 120:
		var previous = game.player.position
		await physics_frame
		reverse_gap = maxf(reverse_gap,game.player.position.distance_to(game.ball.position))
		reverse_step = maxf(reverse_step,game.player.position.distance_to(previous))
	print("Movement reversal gap=",reverse_gap," step=",reverse_step)
	check(reverse_gap<1.5 and reverse_step<0.18,"Sudden direction reversal keeps physical foot control without a position snap")
	check(Vector2(game.player.velocity.x,game.player.velocity.z).length()>3.9,"Player recovers normal speed after turning around the ball")
	Input.action_release("football_left")
	shift.pressed = false
	Input.parse_input_event(shift)
	await ticks(40)
	command("recall")
	await ticks(30)
	command("shoot")
	await ticks(10)
	command("shoot",false)
	var tap_speed = Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()
	check(tap_speed>4.5 and game.player.sprite.frame>=40,"Releasing a short charge kicks with the source foot pose")
	check(not game.ball.controlled and game.ball.touch_lock>0.0,"A kicked ball is released from foot control")
	command("recall")
	await ticks(30)
	command("shoot")
	await ticks(80)
	check(is_equal_approx(game.charge_time,0.85) and game.player.charging,"Held A caps the charge and uses the charging stance")
	var position_before = game.ball.position
	command("shoot",false)
	var charged_speed = Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()
	check(charged_speed>tap_speed+4.0 and charged_speed<45.01 and game.ball.position.is_equal_approx(position_before),"Full charge adds velocity, never moves the ball instantly")
	check(not game.charging and not game.player.charging,"Release clears charging state")
	var shot_origin = game.ball.position
	var strong_peak = 0.0
	for i in 30:
		await physics_frame
		strong_peak = maxf(strong_peak,game.ball.position.y)
	check(strong_peak>0.75,"A strongly charged shot lifts clearly off the grass")
	check(game.ball.linear_velocity.length()<charged_speed,"Air and grass resistance reduce shot speed after release")
	await ticks(570)
	print("Shot travel=",game.ball.position.distance_to(shot_origin))
	check(game.ball.position.distance_to(shot_origin)>10.0 and game.ball.position.distance_to(shot_origin)<90.0,"Shot travels physically until friction or the goal net stops it")
	check(game.get_node_or_null("Terrain")==null,"Grass tufts and stones are removed from the asphalt court")
	check(game.ball.position.y>=0.19 and game.ball.linear_velocity.length()<0.25,"Grass resistance eventually stops the shot on the floor")
	game.ball.position = game.player.position+Vector3(10,0.22,0)
	check(not game.attempt_kick(1.0,false),"A distant ball cannot be kicked remotely")
	command("recall")
	await ticks(30)
	check(game.attempt_kick(0.35,true),"A nearby ball accepts a lob")
	check(absf(game.ball.linear_velocity.y-7.3)<0.01,"Lob vertical launch follows its charge")
	check(Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()<6.0,"Lob horizontal launch is shorter than the a full driven shot")
	var peak = 0.0
	var bounced = false
	var previous_vertical = 0.0
	for i in 180:
		await physics_frame
		peak = maxf(peak,game.ball.position.y)
		if previous_vertical< -1.0 and game.ball.linear_velocity.y>1.0:
			bounced = true
		previous_vertical = game.ball.linear_velocity.y
	check(peak>1.3 and bounced,"The lob rises and bounces through native physics")
	check(is_equal_approx(game.ball.shadow.global_position.y,0.015),"The moving ball's shadow remains on the ground")
	command("recall")
	await ticks(30)
	game.attempt_kick(0.6,true)
	await ticks(18)
	check(game.ball.position.y>0.8,"Ball is airborne before testing live recall")
	command("recall")
	await ticks(20)
	check(game.ball.position.distance_to(game.player.position)<1.1 and game.ball.position.y<0.35,"R reliably recalls an airborne native body at a physics boundary")
	check(FootballControls.KEYS.shoot==[KEY_A] and FootballControls.KEYS.lob==[KEY_D] and FootballControls.KEYS.pass==[KEY_S] and FootballControls.KEYS.jump==[KEY_SPACE],"A D S map to shot high pass short pass")
	check(FootballControls.KEYS.left==[KEY_LEFT] and FootballControls.KEYS.down==[KEY_DOWN],"Movement arrows do not conflict with action keys")
	check(game.player.jump(),"Grounded player can jump")
	check(not game.player.jump(),"Repeated jump cannot stack impulses")
	await ticks(12)
	check(game.player.position.y>0.6 and not game.player.is_on_floor(),"Jump lifts the native character")
	check(not game.ball.reachable(game.player) and not game.ball.controlled,"Airborne player cannot drag or kick a ground ball")
	check(absf(game.player.shadow.global_position.y-0.012)<0.01 and absf(game.camera_rig.position.y)<0.01,"Jump shadow and camera stay grounded")
	await ticks(60)
	check(game.player.is_on_floor() and absf(game.player.position.y)<0.01,"Jump lands naturally on the floor")
	command("recall")
	await ticks(30)
	game.player.facing = FootballControls.world_direction(Vector2.DOWN)
	command("recall")
	await ticks(30)
	game.attempt_kick(0.0,true)
	command("shoot")
	Input.action_press("football_down")
	await ticks(47)
	check(game.charging and game.ball.position.y>1.0,"Shot charge can start while a lob is airborne")
	game.player.jump()
	await ticks(16)
	Input.action_release("football_down")
	var volley_position = game.ball.position
	check(game.ball.volley_reachable(game.player),"Player can reach the lob with a running jump")
	command("shoot",false)
	check(game.ball.linear_velocity.y>0.0 and Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()>8.5,"Releasing charge strikes an airborne ball decisively")
	check(game.ball.position.is_equal_approx(volley_position) and not game.ball.controlled,"Volley changes velocity without snapping or attaching the ball")
	await ticks(1)
	check(game.player.sprite.frame>=40,"Airborne kick pose remains visible over jump pose")
	await ticks(90)
	command("recall")
	await ticks(30)
	game.ball.pending_recall = game.player.position+game.player.facing*0.8+Vector3.UP*3.5
	await ticks(2)
	check(not game.attempt_kick(1.0,false),"Ball above the player's reach cannot be volleyed remotely")
	command("recall")
	await ticks(30)
	command("help")
	check(not game.help.visible,"H hides controls")
	command("help")
	check(game.help.visible and game.help.text==FootballControls.help_text(),"H restores controls from the centralized configuration")
	command("shoot")
	game._notification(Node.NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(not game.charging and not game.player.charging,"Losing window focus cancels a pending kick")
	command("recall")
	await ticks(30)
	command("lob")
	await ticks(8)
	check(game.charging_lob and game.ball.position.y<0.35,"Holding D charges without launching the ball")
	command("lob",false)
	var short_lob_up = game.ball.linear_velocity.y
	var short_lob_forward = Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()
	var short_peak = 0.0
	for i in 150:
		await physics_frame
		short_peak = maxf(short_peak,game.ball.position.y)
	command("recall")
	await ticks(30)
	command("lob")
	await ticks(80)
	check(is_equal_approx(game.charge_time,0.85),"Lob charge is capped when D stays held")
	command("lob",false)
	check(game.ball.linear_velocity.y<short_lob_up-1.0 and game.ball.linear_velocity.y>5.0,"Long D hold lowers the arc while retaining a high pass")
	check(Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()>short_lob_forward+5.0,"High pass charge increases forward travel")
	var high_peak = 0.0
	for i in 150:
		await physics_frame
		high_peak = maxf(high_peak,game.ball.position.y)
	check(high_peak<short_peak and high_peak>1.3,"Long high pass remains airborne with a lower arc")
	command("lob")
	game._notification(Node.NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(not game.charging and not game.charging_lob,"Focus loss clears a charged lob without firing")
	game.player.position = Vector3(5000,0.02,-5000)
	game.player.velocity = Vector3.ZERO
	await ticks(90)
	command("recall")
	await ticks(60)
	check(game.player.is_on_floor() and absf(game.player.position.y)<0.1 and game.ball.position.y>0.19,"Infinite floor supports player and ball thousands of units away")
	check(game.court.mesh.material.shader.resource_path.ends_with("asphalt.gdshader"),"Court uses the worn asphalt shader")
	check(game.player.position.distance_to(game.ball.position)<1.2,"R recalls a lost ball beside the current player position")
	check(game.get_node_or_null("Terrain")==null,"No grass chunk generation remains active")
	# Restore the keeper for focused physical interception checks.
	game.player.position = Vector3(0,0.02,0)
	game.player.velocity = Vector3.ZERO
	keeper.collision_layer = 64
	keeper.set_physics_process(true)
	game.ball.pending_recall = keeper.center+keeper.lateral*1.5+keeper.forward*4.0+Vector3.UP*0.3
	await ticks(2)
	game.ball.linear_velocity = -keeper.forward*6.0
	var keeper_before = keeper.position
	var max_keeper_step = 0.0
	for i in 20:
		var previous = keeper.position
		await physics_frame
		max_keeper_step = maxf(max_keeper_step,keeper.position.distance_to(previous))
	check(keeper.position.distance_to(keeper_before)>0.1,"Keeper moves sideways to intercept an approaching shot")
	check(max_keeper_step<0.07 and absf((keeper.position-keeper.center).dot(keeper.lateral))<=keeper.half_width+0.05,"Keeper remains between posts without teleporting")
	game.ball.pending_recall = keeper.position+keeper.forward*0.45+Vector3.UP*0.7
	await ticks(2)
	game.ball.linear_velocity = -keeper.forward*8.0
	check(keeper.try_parry() and game.ball.linear_velocity.dot(keeper.forward)>0.0,"Keeper deflects a reachable incoming shot back into play")
	game.ball.pending_recall = keeper.position+keeper.forward*0.4+Vector3.UP*2.5
	await ticks(35)
	game.ball.pending_recall = keeper.position+keeper.forward*0.4+Vector3.UP*2.5
	await ticks(1)
	game.ball.linear_velocity = -keeper.forward*8.0
	check(not keeper.try_parry(),"Keeper cannot save a ball above his physical reach")
	check(keeper.sprite.texture.resource_path.ends_with("goalkeeper.png") and keeper.sprite.data.frames.size()==240,"Keeper uses the 240 original goalkeeper frames")
	keeper.state = keeper.State.PROTECT
	keeper.position = keeper.center
	keeper.velocity = Vector3.ZERO
	keeper.parry_cooldown = 0.0
	game.ball.pending_recall = keeper.center+keeper.lateral*1.8+keeper.forward*8.0+Vector3.UP*0.25
	await ticks(2)
	game.ball.linear_velocity = -keeper.forward*24.0
	game.ball.flight_age = 0.0
	await ticks(4)
	check(keeper.state==keeper.State.PROTECT,"Keeper respects source reaction delay before diving")
	await ticks(8)
	check(keeper.state==keeper.State.DIVE,"Fast off-center shot triggers a physical lateral dive")
	check(keeper.sprite.current_name.begins_with("goalkeeper_save_low_"),"Low dive plays the original low-save animation")
	var largest_dive_step = 0.0
	for i in 110:
		var before = keeper.position
		await physics_frame
		largest_dive_step = maxf(largest_dive_step,keeper.position.distance_to(before))
	check(largest_dive_step<0.12,"Dive moves with native collision steps, without teleporting")
	check(keeper.state==keeper.State.PROTECT,"Keeper recovers and returns to goal protection")
	keeper.position = keeper.center
	keeper.velocity = Vector3.ZERO
	keeper.parry_cooldown = 0.0
	game.ball.pending_recall = keeper.center+keeper.lateral*1.8+keeper.forward*4.0+Vector3.UP*2.0
	await ticks(2)
	keeper.state = keeper.State.PROTECT
	keeper.position = keeper.center
	keeper.velocity = Vector3.ZERO
	game.ball.linear_velocity = -keeper.forward*22.0
	game.ball.flight_age = 1.0
	check(keeper.choose_dive() and keeper.dive_high,"High lateral trajectory selects high diving logic")
	keeper.sprite.update_sequence(0.06)
	check(keeper.sprite.current_name.begins_with("goalkeeper_save_high_"),"High dive uses original high-save frames and timing")
	keeper.state = keeper.State.PROTECT
	keeper.position = keeper.center
	keeper.velocity = Vector3.ZERO
	game.ball.pending_recall = keeper.center+keeper.forward*4.0+Vector3.UP*2.8
	await ticks(2)
	keeper.state = keeper.State.PROTECT
	keeper.position = keeper.center
	keeper.velocity = Vector3.ZERO
	game.ball.linear_velocity = -keeper.forward*22.0
	game.ball.flight_age = 1.0
	check(keeper.choose_dive() and keeper.state==keeper.State.JUMP and keeper.velocity.y>0.0,"Central high shot triggers a real upward jump")
	keeper.state = keeper.State.PROTECT
	keeper.position = keeper.center
	keeper.velocity = Vector3.ZERO
	keeper.parry_cooldown = 0.0
	game.ball.pending_recall = keeper.position+keeper.forward*0.4+Vector3.UP*0.7
	await ticks(2)
	game.ball.linear_velocity = -keeper.forward*8.0
	check(keeper.try_parry(true) and game.ball.held_by==keeper and game.ball.freeze,"Slow reachable ball is caught into one authoritative keeper possession")
	await ticks(10)
	check(not game.ball.reachable(game.player) and not game.ball.controlled and not game.ball.sprite.visible,"A ball held by the keeper cannot also be controlled by the player")
	await ticks(65)
	check(game.ball.held_by==null and not game.ball.freeze and game.ball.sprite.visible and game.ball.linear_velocity.dot(keeper.forward)>0.0,"Keeper returns a caught ball with his original hand-pass sequence")
	keeper.state = keeper.State.PROTECT
	keeper.parry_cooldown = 0.0
	game.ball.pending_recall = keeper.position+keeper.forward*0.4+Vector3.UP*0.7
	await ticks(2)
	game.ball.linear_velocity = -keeper.forward*8.0
	keeper.try_parry(true)
	command("recall")
	await ticks(3)
	check(game.ball.held_by==null and not game.ball.freeze,"Recall safely releases a keeper-held ball")
	keeper.set_physics_process(false)
	keeper.state = keeper.State.PROTECT
	keeper.position = keeper.center
	keeper.velocity = Vector3.ZERO
	keeper.parry_cooldown = 0.0
	game.player.position = keeper.center+keeper.forward*2.8
	game.ball.pending_recall = keeper.center+keeper.forward*1.5+Vector3.UP*0.2
	await ticks(2)
	game.ball.linear_velocity = Vector3.ZERO
	check(keeper.choose_smother() and keeper.state==keeper.State.SMOTHER,"Keeper lunges for a contested slow ball when the path is clear")
	check(keeper.sprite.current_name.begins_with("goalkeeper_save_dash_"),"Smother uses the original goalkeeper dash-save frames")
	keeper.set_physics_process(true)
	await ticks(25)
	check(game.ball.held_by==keeper,"A physical smother can collect a stationary loose ball")
	command("recall")
	keeper.set_physics_process(false)
	keeper.collision_layer = 0
	game.player.position = Vector3.ZERO
	game.player.velocity = Vector3.ZERO
	game.teammate.position = Vector3(3,0,-2)
	game.teammate.velocity = Vector3.ZERO
	command("recall")
	await ticks(30)
	var passer = game.player
	var receiver = game.teammate
	command("pass")
	check(game.ball.linear_velocity.y<0.3 and game.ball.linear_velocity.dot(receiver.position-passer.position)>0.0,"S plays a low short pass toward the teammate without jumping")
	await ticks(110)
	check(game.player==receiver and receiver.controlled and not passer.controlled,"Receiving a short pass transfers control to the teammate")
	check(game.ball.controlled and game.ball.position.distance_to(receiver.position)<1.2,"Receiver takes the same physical ball under foot control")
	check(get_nodes_in_group("football_player").size()==4,"There are exactly four outfield players")
	command("recall")
	await ticks(30)
	command("lob")
	await ticks(5)
	command("lob",false)
	var short_high_horizontal = Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()
	var short_high_vertical = game.ball.linear_velocity.y
	check(short_high_vertical>7.0 and short_high_horizontal<4.0,"Brief D press makes a high short pass")
	command("recall")
	await ticks(30)
	command("lob")
	await ticks(65)
	command("lob",false)
	check(game.ball.linear_velocity.y>5.5 and game.ball.linear_velocity.y<short_high_vertical and Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()>short_high_horizontal+5.0,"Held D makes a longer flatter pass that remains airborne")
	var high_receiver = game.teammate
	await ticks(210)
	check(game.player==high_receiver,"Teammate follows the landing point and receives a long high pass")
	command("recall")
	game.player.position = Vector3.ZERO
	game.player.velocity = Vector3.ZERO
	game.teammate.position = Vector3(5,0,0)
	await ticks(30)
	game.ball.pending_recall = game.player.position+game.player.facing*2.1+Vector3.UP*0.9
	await ticks(2)
	game.ball.linear_velocity = -game.player.facing*4.0
	game.ball.touch_lock = 0.0
	game.attempt_kick(0.65,false)
	check(game.volley_buffer>0.0,"Early volley release is buffered while a nearby ball approaches")
	await ticks(8)
	check(game.volley_buffer==0.0 and game.ball.linear_velocity.length()>20.0,"Buffered volley strikes when the ball enters real reach")
	game.ball.pending_recall = game.player.position+Vector3(5,1,0)
	await ticks(2)
	game.attempt_kick(0.65,false)
	check(game.volley_buffer==0.0,"Volley assistance cannot queue a remote shot")
	game.ball.pending_recall = game.player.position+game.player.facing*2.2+Vector3.UP*0.9
	await ticks(2)
	game.ball.touch_lock = 0.0
	game.ball.linear_velocity = game.player.facing*2.0
	game.attempt_kick(0.65,false)
	await ticks(30)
	check(game.volley_buffer==0.0 and game.ball.linear_velocity.length()<10.0,"Unreachable early volley expires without firing a delayed remote shot")
	game.ball.pending_recall = game.player.position+game.player.facing*2.2+Vector3.UP*0.9
	await ticks(2)
	game.ball.touch_lock = 0.0
	game.attempt_kick(0.65,false)
	game._notification(Node.NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(game.volley_buffer==0.0,"Focus loss cancels pending volley assistance")
	# Supporting runs keep the non-controlled player involved and facing the ball.
	command("recall")
	game.player.position = Vector3.ZERO
	game.player.velocity = Vector3.ZERO
	game.teammate.position = Vector3(3,0,-2)
	game.teammate.velocity = Vector3.ZERO
	await ticks(30)
	var support_start = game.teammate.position
	var support_distance = 0.0
	var support_step = 0.0
	var facing_error = 0.0
	for i in 240:
		var before = game.teammate.position
		await physics_frame
		support_distance += game.teammate.position.distance_to(before)
		support_step = maxf(support_step,game.teammate.position.distance_to(before))
		var look = game.ball.position-game.teammate.position
		look.y = 0.0
		if look.length()>0.2:
			facing_error = maxf(facing_error,game.teammate.facing.angle_to(look.normalized()))
	print("Support path ",support_distance," displacement ",game.teammate.position.distance_to(support_start))
	check(support_distance>1.5 and game.teammate.position.distance_to(support_start)>0.3,"Off-ball teammate makes supporting runs without needing a pass")
	check(support_step<0.08 and game.teammate.position.distance_to(game.player.position)>1.0,"Supporting runs use physical movement and keep separation")
	check(facing_error<0.15,"Moving teammate stays oriented toward the ball")
	command("recall")
	await ticks(30)
	game.attempt_pass(1.0,true)
	var aerial_receiver = game.teammate
	var switched_airborne = false
	for i in 140:
		await physics_frame
		if game.player==aerial_receiver and game.ball.position.y>0.4:
			switched_airborne = true
			break
	check(switched_airborne,"High-pass recipient becomes controllable before the ball lands for a volley")
	command("recall")
	await ticks(3)
	var goal = game.get_node("VolleyGoal")
	var goals_before = goal.volley_goals
	var center = game.ball.goal_center
	var normal = -center.normalized()
	game.ball.play_id += 1
	game.ball.last_kick_volley = true
	game.ball.flight_age = 0.0
	goal.armed = true
	goal.previous = center+normal*0.4+Vector3.UP*1.0
	game.ball.position = center-normal*0.4+Vector3.UP*1.0
	goal._physics_process(0.0)
	check(goal.volley_goals==goals_before+1,"Swept crossing between trees records a volley goal")
	goal.armed = true
	goal.previous = center+normal*0.4+Vector3.UP*1.0
	goal._physics_process(0.0)
	check(goal.volley_goals==goals_before+1,"One volley cannot be counted twice")
	game.ball.play_id += 1
	game.ball.last_kick_volley = false
	goal.armed = true
	goal.previous = center+normal*0.4+Vector3.UP*0.2
	game.ball.position = center-normal*0.4+Vector3.UP*0.2
	goal._physics_process(0.0)
	check(goal.volley_goals==goals_before+1,"A ground shot does not complete the volley objective")
	game.ball.play_id += 1
	game.ball.last_kick_volley = true
	goal.armed = true
	goal.previous = center+normal*0.4+Vector3.UP*3.0
	game.ball.position = center-normal*0.4+Vector3.UP*3.0
	goal._physics_process(0.0)
	check(goal.volley_goals==goals_before+1,"Shot above goal height does not count")
	game.queue_free()
	await process_frame
	print("RESULT football: ",checks-failures,"/",checks,"; max dribble gap=",largest_gap," max step=",max_step)
	quit(1 if failures else 0)
