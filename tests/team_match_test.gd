extends SceneTree
var checks = 0
var failures = 0
var game
func _initialize(): call_deferred("run")
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
	check(game.outfield.size()==4 and game.keepers.size()==2,"Six actors: two outfield and a keeper per team")
	for team in 2:
		var actors = game.team_players(team)+[game.keepers[team]]
		check(actors.size()==3 and actors.all(func(a): return a.team==team),"Three players per side")
		var color = actors[0].sprite.material_override.get_shader_parameter("kit_color")
		check(actors.all(func(a): return a.sprite.material_override.get_shader_parameter("kit_color")==color),"Uniform team kits including keeper")
	check(game.team_players(0)[0].sprite.material_override.get_shader_parameter("kit_color")!=game.team_players(1)[0].sprite.material_override.get_shader_parameter("kit_color"),"Red and blue are distinct")
	var left = game.get_node("LeftGoal").position
	var right = game.get_node("RightGoal").position
	check(FootballControls.screen_direction(left).x< -10 and FootballControls.screen_direction(right).x>10,"Two goals at opposite left/right ends")
	check(absf(FootballControls.screen_direction(right-left).y)<0.01,"Court length is horizontal on screen")
	check(game.keepers[0].forward.dot(game.LENGTH)>0.99 and game.keepers[1].forward.dot(game.LENGTH)< -0.99,"Keepers defend opposite goals and face into play")
	check(game.active_outfield().all(func(a): return a.team==0),"Pass selection includes only red teammates")
	var old = game.player
	var event = InputEventAction.new()
	event.action = "football_switch"
	event.pressed = true
	game._unhandled_input(event)
	check(game.player!=old and game.player.team==0 and game.outfield.filter(func(a): return a.controlled).size()==1,"Q switches exactly one controlled red")
	check(game.rules.scores==[0,0] and not game.rules.finished,"Team scores replace individual eleven-point rules")
	check(game.help.text.contains("Q") and game.help.text.contains("Nuova partita") and not game.help.text.contains("rinuncia"),"Current help shows team controls rather than obsolete rules")
	# Isolate native rebound tests from actor contacts and AI.
	game.set_physics_process(false)
	for a in game.outfield+game.keepers: a.set_physics_process(false)
	var red_shooter = game.player
	game.ball.pending_recall = red_shooter.position+red_shooter.facing*0.7+Vector3.UP*0.22
	await ticks(2)
	game.ball.touch_lock = 0.0
	check(game.attempt_kick(0.5,false) and game.ball.linear_velocity.dot(game.LENGTH)>10.0,"Controlled red can shoot from ground towards the right goal")
	var blue_shooter = game.team_players(1)[0]
	game.ball.pending_recall = blue_shooter.position+blue_shooter.facing*0.7+Vector3.UP*0.22
	await ticks(2)
	game.ball.touch_lock = 0.0
	Input.action_press("football_up")
	check(game.ball.kick(blue_shooter,0.5,false) and game.ball.linear_velocity.dot(game.LENGTH)< -10.0 and absf(game.ball.linear_velocity.dot(game.WIDTH))<0.2,"Blue attacks the left goal without inheriting human steering")
	Input.action_release("football_up")
	game.ball.pending_recall = game.WIDTH*7.5+Vector3.UP*0.5
	game.ball.release_velocity = game.WIDTH*8.0
	var bounced = false
	for i in 35:
		await physics_frame
		if game.ball.linear_velocity.dot(game.WIDTH)< -1.0: bounced = true
	check(bounced and not game.rules.resetting and game.rules.scores==[0,0],"Ball rebounds from a wall outside the painted sideline without a stoppage")
	game.ball.pending_recall = game.LENGTH*12.6+game.WIDTH*5.0+Vector3.UP*0.5
	game.ball.release_velocity = game.LENGTH*8.0
	bounced = false
	for i in 35:
		await physics_frame
		if game.ball.linear_velocity.dot(game.LENGTH)< -1.0: bounced = true
	check(bounced and game.rules.scores==[0,0],"End wall rebounds outside the goal opening do not count as goals")
	game.ball.pending_recall = game.LENGTH*11.7+game.WIDTH*1.5+Vector3.UP*0.22
	game.ball.release_velocity = game.LENGTH*9.0
	await ticks(12)
	check(game.rules.scores==[1,0] and game.rules.resetting,"Ground shot through the right goal scores for red")
	game.rules.score_goal(0)
	check(game.rules.scores==[1,0],"A goal cannot count twice during the stoppage")
	await ticks(100)
	check(not game.rules.resetting and game.rules.kickoff_team==1 and not game.ball.freeze,"Conceding blue side receives the next kickoff")
	game.ball.pending_recall = -game.LENGTH*11.7+game.WIDTH*1.5+Vector3.UP*0.9
	game.ball.release_velocity = -game.LENGTH*9.0
	await ticks(12)
	check(game.rules.scores==[1,1],"Airborne shot through the left goal scores for blue")
	await ticks(100)
	game.ball.pending_recall = game.LENGTH*11.7+Vector3.UP*3.0
	game.ball.release_velocity = game.LENGTH*9.0
	await ticks(12)
	check(game.rules.scores==[1,1],"Ball above the crossbar does not score")
	# Both keepers retain real catches and distribution rather than stopping the match.
	for keeper in game.keepers:
		game.ball.pending_recall = keeper.position+keeper.forward*0.4+Vector3.UP*0.6
		await ticks(2)
		game.ball.linear_velocity = -keeper.forward*4.0
		keeper.parry_cooldown = 0.0
		keeper.state = keeper.State.PROTECT
		check(keeper.try_parry(true) and game.ball.held_by==keeper,"Keeper can catch an incoming slow ball")
		keeper.release_ball()
		await ticks(2)
		check(game.ball.held_by==null and not game.ball.freeze and game.ball.sprite.visible and game.ball.linear_velocity.dot(keeper.forward)>0.0,"Keeper returns the live ball towards his team")
	game.rules.start_match()
	for i in 5:
		game.rules.score_goal(0)
		if i<4: await ticks(100)
	check(game.rules.scores==[5,0] and game.rules.finished and game.ball.freeze,"First team to five wins")
	check(game.get_node("HUD/Restart").visible,"Victory offers a PC/touch restart")
	game.rules.start_match()
	check(game.rules.scores==[0,0] and not game.rules.finished and not game.get_node("HUD/Restart").visible,"Restart restores the complete match")
	# Red's off-ball companion must also be capable of taking a real attacking action.
	game.set_physics_process(true)
	for a in game.outfield+game.keepers: a.set_physics_process(true)
	var companion = game.other_outfielder(game.player)
	companion.position = game.LENGTH*4.0+game.WIDTH*2.0
	companion.facing = game.LENGTH
	game.ball.pending_recall = companion.position+game.LENGTH*0.72+Vector3.UP*0.22
	game.ball.touch_lock = 0.0
	var red_action = false
	for i in 60:
		await physics_frame
		if game.ai_plans.has(companion) and game.ai_plans[companion].actions>0: red_action = true
	check(red_action or game.rules.scores[0]>0,"Red companion can initiate a real attack and shoot at the blue goal")
	game.rules.start_match()
	# Run both AIs in live play, serving blue to guarantee an autonomous attack.
	game.rules.kickoff_team = 1
	game.rules.reset_positions()
	game.set_physics_process(true)
	for a in game.outfield+game.keepers: a.set_physics_process(true)
	var initial = {}
	for a in game.outfield: initial[a] = a.position
	var moved = {}
	var ai_actions = 0
	var invalid = false
	for i in 1500:
		await physics_frame
		for a in game.outfield:
			if a.position.distance_to(initial[a])>1.0: moved[a] = true
			invalid = invalid or not a.position.is_finite() or absf(a.position.y)>7.0
		for plan in game.ai_plans.values(): ai_actions = maxi(ai_actions,plan.actions)
	check(game.team_players(1).all(func(a): return moved.has(a)),"Both blue players move in autonomous attack and defence")
	check(moved.has(game.get_node("Teammate")),"Red companion supports and defends")
	check(ai_actions>0,"Team AI executes real passes or shots")
	check(not invalid,"Long live simulation preserves finite positions and physical grounding")
	check(game.outfield.filter(func(a): return a.controlled and a.team==0).size()==1,"Autoselection keeps one red under player control")
	print("Live scores ",game.rules.scores," AI actions ",ai_actions)
	game.rules.resetting = true
	old = game.player
	game._unhandled_input(event)
	check(game.player==old,"Player selection stays fixed during a goal stoppage")
	game.rules.start_match()
	var ui = game.get_node("DeviceUI/ControlMode")
	ui.choose_mode("smartphone")
	check(ui.button_centers.has("switch"),"Team match offers a touch switch-player button")
	old = game.player
	var button: Vector2 = ui.button_centers.switch
	check(ui.begin_touch(9,button) and game.player!=old and game.player.team==0,"Touch switch changes only the controlled red")
	ui.end_touch(9)
	ui.choose_mode("pc")
	game.queue_free()
	await process_frame
	print("RESULT teams: ",checks-failures,"/",checks)
	quit(1 if failures else 0)
