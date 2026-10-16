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
	check(game.camera.projection==Camera3D.PROJECTION_ORTHOGONAL and is_equal_approx(game.camera.size,18.0),"Fixed isometric orthographic framing")
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
	game.desired_zoom = 18.0
	var art = game.player.sprite.texture.get_image().get_region(Rect2i(0,0,61,61)).get_used_rect()
	var height = art.size.y*game.player.sprite.pixel_size/game.camera.size*720.0
	check(height>=72.0 and height<=82.0,"Close camera makes the player clearly readable at 1280x720")
	check(game.player.sprite.hframes==8 and game.player.sprite.vframes==6 and game.ball.sprite.hframes==8 and game.ball.sprite.vframes==4,"Original player and ball frames have valid packed grids")
	for i in 8:
		var angle = i*PI/4.0
		var input = Vector2(cos(angle),sin(angle))
		var direction = FootballControls.world_direction(input)
		check(FootballControls.orientation(direction)==i,"Original directional art follows screen direction "+str(i))
	check(game.player.is_on_floor() and game.ball.position.y>=0.19,"Player and ball rest on the native infinite floor")
	var start = game.player.position
	Input.action_press("football_down")
	var largest_gap = 0.0
	var max_step = 0.0
	for i in 240:
		var previous = game.ball.position
		await physics_frame
		largest_gap = maxf(largest_gap,game.player.position.distance_to(game.ball.position))
		max_step = maxf(max_step,game.ball.position.distance_to(previous))
	Input.action_release("football_down")
	check(game.player.position.distance_to(start)>12.0,"Movement advances continuously across the field")
	check(largest_gap<1.5 and max_step<0.2,"Dribbling rolls the native ball smoothly, without teleporting")
	await ticks(60)
	check(game.player.sprite.frame<8 and Vector2(game.player.velocity.x,game.player.velocity.z).length()<0.01,"Stopping returns to the original standing frame")
	Input.action_press("football_sprint")
	Input.action_press("football_right")
	await ticks(40)
	check(Vector2(game.player.velocity.x,game.player.velocity.z).length()>7.8,"Shift increases movement speed")
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
	check(reverse_gap<1.5 and reverse_step<0.15,"Sudden sprint reversal keeps physical foot control without a position snap")
	check(Vector2(game.player.velocity.x,game.player.velocity.z).length()>7.8,"Player recovers full sprint after turning around the ball")
	Input.action_release("football_left")
	Input.action_release("football_sprint")
	await ticks(40)
	command("recall")
	await ticks(30)
	command("shoot")
	await ticks(10)
	command("shoot",false)
	var tap_speed = Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()
	check(tap_speed>5.0 and game.player.sprite.frame>=40,"Releasing a short charge kicks with the source foot pose")
	check(not game.ball.controlled and game.ball.touch_lock>0.0,"A kicked ball is released from foot control")
	command("recall")
	await ticks(30)
	command("shoot")
	await ticks(80)
	check(is_equal_approx(game.charge_time,0.85) and game.player.charging,"Held A caps the charge and uses the charging stance")
	var position_before = game.ball.position
	command("shoot",false)
	var charged_speed = Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()
	check(charged_speed>tap_speed+5.0 and game.ball.position.is_equal_approx(position_before),"Full charge adds velocity, never moves the ball instantly")
	check(not game.charging and not game.player.charging,"Release clears charging state")
	await ticks(600)
	check(game.ball.position.y>=0.19 and game.ball.linear_velocity.length()<0.25,"Grass resistance eventually stops the shot on the floor")
	game.ball.position = game.player.position+Vector3(10,0.22,0)
	check(not game.attempt_kick(1.0,false),"A distant ball cannot be kicked remotely")
	command("recall")
	await ticks(30)
	check(game.attempt_kick(0.35,true),"A nearby ball accepts a lob")
	check(absf(game.ball.linear_velocity.y-6.05)<0.01,"Short lob preserves its original vertical launch")
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
	command("lob")
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
	check(game.ball.linear_velocity.y<1.0 and Vector2(game.ball.linear_velocity.x,game.ball.linear_velocity.z).length()>10.0,"Releasing charge strikes an airborne ball decisively")
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
	game.player.position = Vector3(5000,0.02,-5000)
	game.player.velocity = Vector3.ZERO
	await ticks(90)
	command("recall")
	await ticks(60)
	check(game.player.is_on_floor() and absf(game.player.position.y)<0.1 and game.ball.position.y>0.19,"Infinite floor supports player and ball thousands of units away")
	check(Vector2(game.grass.position.x-game.player.position.x,game.grass.position.z-game.player.position.z).length()<24.0,"Grass follows the player without a visible field boundary")
	check(game.player.position.distance_to(game.ball.position)<1.2,"R recalls a lost ball beside the current player position")
	check(game.get_node("Terrain").chunks.size()==25,"Infinite terrain keeps only twenty-five decorative chunks after travel")
	game.queue_free()
	await process_frame
	print("RESULT football: ",checks-failures,"/",checks,"; max dribble gap=",largest_gap," max step=",max_step)
	quit(1 if failures else 0)
