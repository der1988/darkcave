extends SceneTree
var checks = 0
var failures = 0
var game: FootballSandbox
var rules: Node
func _initialize() -> void:
	call_deferred("run")
func ticks(n: int) -> void:
	for i in n:
		await physics_frame
func check(value: bool, text_value: String) -> void:
	checks += 1
	if value: print("PASS · ",text_value)
	else:
		failures += 1
		push_error("FAIL · "+text_value)
func run() -> void:
	game = load("res://scenes/football/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	game.get_node("DeviceUI/ControlMode").choose_mode("pc")
	rules = game.get_node("MatchRules")
	await ticks(20)
	check(rules.points=={"X":11,"Y":11,"Z":11},"Every participant starts at eleven")
	check(game.get_node_or_null("GrassTrails")==null and game.get_node_or_null("Terrain")==null,"No grass or grass trails on asphalt")
	check(game.get_node("Goal/PostsArt").texture.resource_path.ends_with("posts_0.png"),"Goal uses original footballgame posts artwork")
	check(game.get_node("Goal/NetArt").texture.resource_path.ends_with("net_up_0.png"),"Goal uses original footballgame net artwork")
	check(game.get_node("Player/NameLabel").text=="X · 11" and game.get_node("Goalkeeper/NameLabel").text=="Z · 11","Names and points appear under the correct players")
	check(not rules.rally_live,"Ball can rest before the first serve")
	check(game.attempt_pass(0.0,false),"S can start an aerial short serve")
	check(game.ball.linear_velocity.y>3.0 and rules.last_touch=="X","Short passes are airborne and identify the last player")
	var uncommanded_height = 0.0
	for i in 100:
		await physics_frame
		uncommanded_height = maxf(uncommanded_height,maxf(game.get_node("Player").position.y,game.get_node("Teammate").position.y))
	check(uncommanded_height<1.0,"Ball cannot carry outfield players upward as a moving platform")
	check(rules.keeper_id=="X","An unreturned serve touching asphalt sends its last player into goal")
	await ticks(80)
	check(rules.points=={"X":11,"Y":11,"Z":11},"A change of keeper preserves everyone's points")
	check(game.get_node("Goalkeeper/NameLabel").text=="X · 11","Names follow role swaps")
	check(not rules.resetting and not rules.rally_live,"Dead-ball restart returns to a ready service")
	rules.start_match()
	await ticks(20)
	check(game.attempt_pass(0.5,true),"D starts a high serve")
	var actor = game.player
	game.ball.pending_recall = actor.position+actor.facing*0.7+Vector3.UP*1.0
	await ticks(2)
	game.ball.touch_lock = 0.0
	check(game.attempt_pass(0.0,false),"S can pass an airborne ball without bringing it to ground")
	check(rules.rally_live and not rules.resetting,"A valid aerial pass keeps the rally live")
	game.ball.pending_recall = actor.position+actor.facing*0.7+Vector3.UP*1.5
	await ticks(2)
	game.ball.touch_lock = 0.0
	check(game.attempt_kick(0.6,false),"Airborne heading contact can shoot")
	check(game.ball.last_contact_kind=="head" and actor.sprite.frame>=48,"Header uses the original header frames and records head scoring")
	rules.goal("head")
	check(rules.points.Z==8,"Header goal removes three points from the keeper")
	rules.goal("head")
	check(rules.points.Z==8,"A dead rally cannot deduct points a second time")
	await ticks(80)
	rules.rally_live = true
	rules.last_touch = "Y"
	rules.fault("Y","Palla fuori")
	check(rules.keeper_id=="Y" and rules.points.Z==8,"Out-of-bounds culprit becomes keeper without resetting scores")
	await ticks(80)
	rules.start_match()
	rules.rally_live = true
	rules.last_touch = "X"
	game.ball.last_kick_volley = true
	rules.goal("foot")
	check(rules.points.Z==10,"Foot volley costs one point")
	await ticks(80)
	rules.rally_live = true
	rules.last_touch = "X"
	game.ball.last_kick_volley = true
	rules.goal("heel")
	check(rules.points.Z==5,"Backheel costs five points")
	await ticks(80)
	rules.rally_live = true
	rules.last_touch = "X"
	game.ball.last_kick_volley = true
	rules.goal("bicycle")
	check(rules.points.Z==0 and rules.keeper_id=="X","Zero points eliminates the keeper and selects the next keeper")
	await ticks(80)
	check(not game.teammate.visible and game.player.participant_id=="Y","Eliminated identity disappears and the remaining outfielder is controllable")
	check(game.attempt_pass(0.0,true),"Final two participants can lift a self-serve for a volley")
	rules.points.X = 1
	game.ball.last_kick_volley = true
	rules.goal("foot")
	check(rules.finished and rules.winner=="Y" and game.ball.freeze,"Last survivor wins and the ball stops")
	check(game.get_node("HUD/Restart").visible,"Victory offers a clickable restart on PC and touch")
	rules.start_match()
	check(not rules.finished and rules.points=={"X":11,"Y":11,"Z":11} and game.teammate.visible,"Restart restores all three players and eleven points")
	await ticks(20)
	var actor_again = game.player
	game.ball.pending_recall = actor_again.position+actor_again.facing*0.7+Vector3.UP*0.7
	await ticks(2)
	actor_again.facing = (actor_again.position-game.ball.goal_center).normalized()
	check(rules.contact_kind(actor_again,true)=="heel","Facing away at low aerial contact selects the five-point backheel")
	actor_again.jump()
	await ticks(2)
	game.ball.pending_recall = actor_again.position+actor_again.facing*0.7+Vector3.UP*1.2
	await ticks(2)
	check(rules.contact_kind(actor_again,true)=="bicycle","Airborne backward contact selects a bicycle kick")
	rules.start_match()
	await ticks(20)
	rules.rally_live = true
	rules.last_touch = "X"
	rules.shot_in_flight = true
	rules.rally_time = 0.3
	game.ball.pending_recall = Vector3(0,0.21,0)
	await ticks(2)
	game.ball.linear_velocity = Vector3(2,0,0)
	await ticks(4)
	check(not rules.resetting,"A volley shot may bounce after contact without invalidating the shot")
	rules.rally_live = true
	rules.last_touch = "X"
	game.ball.pending_recall = Vector3(20,1,0)
	await ticks(4)
	check(rules.keeper_id=="X" and rules.resetting,"A real ball leaving the court triggers the keeper change")
	game.queue_free()
	await process_frame
	print("RESULT eleven: ",checks-failures,"/",checks)
	quit(1 if failures else 0)
