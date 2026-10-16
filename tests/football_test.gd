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
	game = load("res://scenes/football/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await ticks(30)
	check(ProjectSettings.get_setting("application/run/main_scene")=="res://scenes/football/main.tscn","Football sandbox is the active game")
	check(get_nodes_in_group("football_player").size()==1 and game.find_children("*","Light3D",true,false).is_empty(),"One player and no flashlight or other lights")
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
	check(game.player.sprite.hframes==8 and game.player.sprite.vframes==6 and game.ball.sprite.hframes==8 and game.ball.sprite.vframes==4,"Original player and ball frames have valid packed grids")
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
	var trees = game.get_node("GoalTrees")
	check(trees.get_child_count()==2,"Two physical trees mark the goal")
	var space = game.get_world_3d().direct_space_state
	var trunk_ray = PhysicsRayQueryParameters3D.create(Vector3(-6,0.7,-4),Vector3(-6,0.7,0),1)
	check(not space.intersect_ray(trunk_ray).is_empty(),"Goal tree trunks block physical bodies")
	var opening_ray = PhysicsRayQueryParameters3D.create(Vector3(-2,0.7,-2),Vector3(-6,0.7,-6),1)
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
	check(Vector2(game.player.velocity.x,game.player.velocity.z).length()>4.6,"Walking is 25 percent faster while controlling the ball")
	var trails = game.get_node("GrassTrails")
	check(trails.ages.count(6.0)<128,"Walking leaves temporary marks in the grass")
	Input.action_release("football_down")
	check(game.camera_rig.position.is_equal_approx(fixed_camera),"Camera stays fixed when the player moves across the field")
	check(game.player.position.distance_to(start)>16.0,"Movement advances continuously across the field")
	check(largest_gap<1.5 and max_step<0.2,"Dribbling rolls the native ball smoothly, without teleporting")
	await ticks(60)
	check(game.player.sprite.frame<8 and Vector2(game.player.velocity.x,game.player.velocity.z).length()<0.01,"Stopping returns to the original standing frame")
	Input.action_press("football_sprint")
	Input.action_press("football_right")
	await ticks(40)
	check(Vector2(game.player.velocity.x,game.player.velocity.z).length()>10.2,"Shift increases movement speed")
	Input.action_release("football_right")
	Input.action_press("football_left")
	var reverse_gap = 0.0
	var reverse_step = 0.0
	for i in 120:
		var previous = game.player.position
		await physics_frame
		reverse_gap = maxf(reverse_gap,game.player.position.distance_to(game.ball.position))
		reverse_step = maxf(reverse_step,game.player.position.distance_to(previous))
	print("Sprint reversal gap=",reverse_gap," step=",reverse_step)
	check(reverse_gap<1.5 and reverse_step<0.18,"Sudden sprint reversal keeps physical foot control without a position snap")
	check(Vector2(game.player.velocity.x,game.player.velocity.z).length()>10.2,"Player recovers full sprint after turning around the ball")
	Input.action_release("football_left")
	Input.action_release("football_sprint")
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
	check(game.ball.position.distance_to(shot_origin)>40.0 and game.ball.position.distance_to(shot_origin)<90.0,"Source-power shot follows its longer physical trajectory before stopping")
	check(trails.ages.count(6.0)==128,"Grass marks expire completely after standing still")
	check(game.ball.position.y>=0.19 and game.ball.linear_velocity.length()<0.25,"Grass resistance eventually stops the shot on the floor")
	game.ball.position = game.player.position+Vector3(10,0.22,0)
	check(not game.attempt_kick(1.0,false),"A distant ball cannot be kicked remotely")
	command("recall")
	await ticks(30)
	check(game.attempt_kick(0.35,true),"A nearby ball accepts a lob")
	check(absf(game.ball.linear_velocity.y-6.75)<0.01,"Lob vertical launch follows its charge")
	check(Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()<3.5,"Lob horizontal launch is shorter than the former 8.5")
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
	check(FootballControls.KEYS.shoot==[KEY_A] and FootballControls.KEYS.lob==[KEY_D] and FootballControls.KEYS.jump==[KEY_S],"A D S map to shot lob jump")
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
	game.attempt_kick(0.35,true)
	command("shoot")
	Input.action_press("football_down")
	await ticks(24)
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
	check(game.ball.linear_velocity.y>short_lob_up+3.0,"Long D hold launches higher than a short tap")
	check(absf(Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()-short_lob_forward)<0.01,"Lob charge changes height without increasing horizontal launch speed")
	var high_peak = 0.0
	for i in 150:
		await physics_frame
		high_peak = maxf(high_peak,game.ball.position.y)
	check(high_peak>short_peak+2.0,"Native lob trajectory reaches a visibly higher peak after longer hold")
	command("lob")
	game._notification(Node.NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(not game.charging and not game.charging_lob,"Focus loss clears a charged lob without firing")
	game.player.position = Vector3(5000,0.02,-5000)
	game.player.velocity = Vector3.ZERO
	await ticks(90)
	command("recall")
	await ticks(60)
	check(game.player.is_on_floor() and absf(game.player.position.y)<0.1 and game.ball.position.y>0.19,"Infinite floor supports player and ball thousands of units away")
	check(Vector2(game.grass.position.x-game.player.position.x,game.grass.position.z-game.player.position.z).length()<24.0,"Grass follows the player without a visible field boundary")
	check(game.player.position.distance_to(game.ball.position)<1.2,"R recalls a lost ball beside the current player position")
	check(game.get_node("Terrain").chunks.size()==25,"Infinite terrain keeps only twenty-five decorative chunks after travel")
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
	game.queue_free()
	await process_frame
	print("RESULT football: ",checks-failures,"/",checks,"; max dribble gap=",largest_gap," max step=",max_step)
	quit(1 if failures else 0)
