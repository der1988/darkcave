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
func command(pressed: bool):
	var event = InputEventAction.new()
	event.action = "football_lob"
	event.pressed = pressed
	game._unhandled_input(event)
func run():
	game = load("res://scenes/football/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	game.get_node("DeviceUI/ControlMode").choose_mode("pc")
	await ticks(20)
	game.set_physics_process(false)
	for a in game.outfield+game.keepers: a.set_physics_process(false)
	var actor: StreetPlayer = game.player
	var enemy: StreetPlayer = game.team_players(1)[0]
	var friend = game.other_outfielder(actor)
	game.rules.start_match()
	actor.position = Vector3.ZERO
	for a in [enemy,friend,game.team_players(1)[1]]: a.position = game.WIDTH*6+game.LENGTH*(a.get_index()-8)
	check(is_equal_approx(actor.sprite.pixel_size,0.075*0.85) and is_equal_approx(game.keepers[0].sprite.pixel_size,0.075*0.85),"All six characters are 15 percent smaller at the same camera distance")
	check(is_equal_approx(actor.get_node("Body").shape.height,1.45*0.85),"Player collision height follows the smaller proportions")
	var original = load("res://assets/football/player.png").get_image()
	var packed = actor.sprite.texture.get_image()
	check(packed.get_region(Rect2i(0,0,488,732)).get_data()==original.get_data(),"The 96 existing poses are preserved pixel for pixel")
	check(actor.sprite.hframes==8 and actor.sprite.vframes==19,"All 56 additional source action frames are available")
	game.ball.pending_recall = game.WIDTH*5+Vector3.UP*0.22
	await ticks(2)
	game.possession = null
	actor.facing = game.LENGTH
	command(true)
	check(actor.action==StreetPlayer.Action.SLIDE and not game.charging,"D without possession starts a slide immediately")
	command(false)
	check(not game.charging and game.pass_receiver==null,"Releasing slide D cannot produce a charged pass")
	var start = actor.position
	var max_step = 0.0
	for i in 12:
		await physics_frame
		var before = actor.position
		actor.drive(Vector3.ZERO,1.0/60.0)
		max_step = maxf(max_step,before.distance_to(actor.position))
	check(actor.position.distance_to(start)>0.5 and max_step<0.13 and actor.sprite.frame>=96 and actor.sprite.frame<104,"Slide moves through native collision with the original directional pose")
	check(not actor.jump() and not game.attempt_kick(0.5,false),"Slide cannot jump, dribble or shoot")
	check(not actor.start_slide(game.LENGTH),"Slide cannot be chained during its cooldown")
	for i in 100:
		await physics_frame
		actor.drive(Vector3.ZERO,1.0/60.0)
	check(actor.action==StreetPlayer.Action.NORMAL and is_equal_approx(actor.get_node("Body").shape.height,1.45*0.85),"Slide recovers and restores the standing collider")
	actor.position = Vector3.ZERO
	actor.velocity = Vector3.ZERO
	actor.facing = game.LENGTH
	game.ball.pending_recall = actor.position+actor.facing*0.7+Vector3.UP*0.22
	await ticks(2)
	game.ball.touch_lock = 0.0
	game.possession = actor
	command(true)
	check(game.charging and game.charging_lob and actor.action==StreetPlayer.Action.NORMAL,"D with the ball retains the high-pass charge")
	game.charge_time = 0.4
	command(false)
	check(game.pass_receiver==friend and game.ball.linear_velocity.y>5.0,"Releasing possession D sends the existing high pass to a teammate")
	game.pass_receiver = null
	game.ball.pending_recall = game.WIDTH*5+Vector3.UP*0.22
	await ticks(2)
	actor.reset_action()
	actor.position = Vector3.ZERO
	actor.velocity = Vector3.ZERO
	enemy.position = game.LENGTH*1.2
	enemy.velocity = Vector3.ZERO
	friend.position = game.LENGTH*0.5+game.WIDTH*0.4
	actor.start_slide(game.LENGTH)
	for i in 22:
		await physics_frame
		actor.drive(Vector3.ZERO,1.0/60.0)
	check(enemy.action==StreetPlayer.Action.FALL,"A physical sliding body contact knocks the opponent down")
	check(friend.action==StreetPlayer.Action.NORMAL,"Friendly players are not knocked down by a teammate")
	check(not enemy.can_play_ball() and not game.rules.can_touch(enemy),"A fallen player cannot immediately play the ball")
	check(not enemy.fall(game.LENGTH),"A downed player is protected from repeated hits")
	for i in 8:
		await physics_frame
		enemy.drive(Vector3.ZERO,1.0/60.0)
	check(enemy.sprite.frame>=112 and enemy.sprite.frame<120,"Fall displays the original grounded pose after the source impact timing")
	for i in 51:
		await physics_frame
		enemy.drive(game.WIDTH,1.0/60.0)
	check(enemy.action==StreetPlayer.Action.STUMBLE and enemy.sprite.frame>=120,"Get-up transitions into the original off-balance run")
	for i in 45:
		await physics_frame
		enemy.drive(game.WIDTH,1.0/60.0)
	check(enemy.action==StreetPlayer.Action.NORMAL and enemy.can_play_ball(),"Recovery restores movement and ball actions without teleporting")
	actor.reset_action()
	actor.position = Vector3.ZERO
	actor.velocity = Vector3.ZERO
	game.ball.pending_recall = game.LENGTH*0.7+Vector3.UP*0.22
	await ticks(2)
	actor.start_slide(game.LENGTH)
	actor.drive(Vector3.ZERO,1.0/60.0)
	check(actor.ball_hit and game.ball.linear_velocity.dot(game.LENGTH)>7.0 and game.rules.last_touch==actor.participant_id,"Sliding contact deflects the physical ball and updates possession responsibility")
	actor.fall(-game.LENGTH)
	game.rules.reset_positions()
	check(game.outfield.all(func(a): return a.action==StreetPlayer.Action.NORMAL),"Kickoff clears slides, falls and cooldowns")
	game.set_controlled(game.outfield[0])
	game.player.position = Vector3.ZERO
	game.ball.pending_recall = game.LENGTH*0.7+Vector3.UP*1.5
	await ticks(2)
	game.ball.touch_lock = 0.0
	check(game.attempt_kick(0.4,false) and game.player.contact_animation=="head","High contact uses the original header animation in the team match")
	for i in 8:
		actor.reset_action()
		actor.position = Vector3.ZERO
		actor.velocity = Vector3.ZERO
		var direction = FootballControls.world_direction(Vector2.RIGHT.rotated(i*PI/4.0))
		actor.start_slide(direction)
		actor.drive(Vector3.ZERO,1.0/60.0)
		check(actor.sprite.frame==96+i,"Slide preserves source orientation "+str(i))
	actor.reset_action()
	actor.position = game.WIDTH*7.7
	actor.velocity = Vector3.ZERO
	enemy.reset_action()
	enemy.position = game.WIDTH*8.5
	game.ball.pending_recall = game.WIDTH*8.6+Vector3.UP*0.22
	await ticks(2)
	actor.start_slide(game.WIDTH)
	var wall_contact = false
	for i in 20:
		await physics_frame
		actor.drive(Vector3.ZERO,1.0/60.0)
		wall_contact = wall_contact or actor.get_slide_collision_count()>0
	check(wall_contact and actor.position.dot(game.WIDTH)<8.05,"Slide stops at the wall rather than passing through it")
	check(enemy.action==StreetPlayer.Action.NORMAL and not actor.ball_hit,"Tackle cannot hit a player or ball through a wall")
	game.rules.reset_positions()
	actor.position = Vector3.ZERO
	enemy.position = game.LENGTH*1.6
	enemy.facing = -game.LENGTH
	game.ball.pending_recall = game.LENGTH*0.7+Vector3.UP*0.22
	await ticks(2)
	game.possession = actor
	var plan = FootballTeamAI.new()
	plan.step(game,enemy,1.0/60.0)
	check(enemy.action==StreetPlayer.Action.SLIDE and plan.tackles==1,"AI can initiate a contextual sliding challenge")
	game.set_controlled(actor)
	friend.fall(game.LENGTH)
	check(game.choose_pass_target()==null,"A downed teammate is not shown as an available receiver")
	var change = InputEventAction.new()
	change.action = "football_switch"
	change.pressed = true
	game._unhandled_input(change)
	check(game.player==actor,"Q does not select a teammate who is still on the ground")
	check(game.help.text.contains("scivolata"),"Help explains contextual D")
	game.queue_free()
	await process_frame
	print("RESULT player actions: ",checks-failures,"/",checks)
	quit(1 if failures else 0)
