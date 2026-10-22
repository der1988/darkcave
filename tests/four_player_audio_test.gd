extends SceneTree
var checks = 0
var failures = 0
func _initialize(): call_deferred("run")
func check(value: bool, label: String):
	checks += 1
	if not value:
		failures += 1
		push_error("FAIL · "+label)
func ticks(n: int):
	for i in n: await physics_frame
func run():
	var game = load("res://scenes/football/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	var audio = game.get_node("Ball/Audio")
	check(not audio.enabled,"Audio remains quiet before device selection")
	game.get_node("DeviceUI/ControlMode").choose_mode("pc")
	check(audio.enabled,"Explicit device choice enables browser audio")
	await ticks(20)
	game.set_physics_process(false)
	for actor in game.outfield+game.keepers: actor.set_physics_process(false)
	check(game.outfield.size()+game.keepers.size()==8,"Eight unique actors on the field")
	var ids = []
	for a in game.outfield+game.keepers:
		check(not ids.has(a.participant_id),"Distinct player identity")
		ids.append(a.participant_id)
	for team in 2:
		var squad = game.team_players(team)
		check(squad.size()==3,"Three outfield players per team")
		check(squad[1].position.distance_to(squad[2].position)>5.0,"Wide starting lanes do not overlap")
	game.rules.start_match()
	var initial = game.player
	var e = InputEventAction.new()
	e.action = "football_switch"
	e.pressed = true
	var selected = []
	for i in 3:
		game._unhandled_input(e)
		selected.append(game.player)
	check(selected.has(game.team_players(0)[0]) and selected.has(game.team_players(0)[1]) and selected.has(game.team_players(0)[2]) and game.player==initial,"Q cycles through all three reds")
	var defender = game.team_players(1)[0]
	var holder = game.player
	holder.position = Vector3.ZERO
	defender.position = game.LENGTH*1.6
	defender.facing = -game.LENGTH
	for a in game.team_players(1):
		if a!=defender: a.position = game.LENGTH*6+game.WIDTH*5
	game.possession = holder
	game.ball.pending_recall = holder.position+game.LENGTH*0.7+Vector3.UP*0.22
	await ticks(2)
	var ai = FootballTeamAI.new()
	ai.step(game,defender,1.0/60.0)
	check(defender.action==StreetPlayer.Action.NORMAL and ai.tackles==0,"Blue does not slide immediately after gaining sight of the holder")
	check(Vector2(defender.velocity.x,defender.velocity.z).length()<=3.13,"Blue movement stays below the red maximum")
	ai.pressure_time = 1.3
	defender.position = game.LENGTH*1.6
	ai.step(game,defender,1.0/60.0)
	check(ai.tackles==1 and ai.action_cooldown>=4.4,"Close blue tackle requires observation and a longer recovery interval")
	game.rules.start_match()
	game.ball.pending_recall = game.player.position+game.player.facing*0.7+Vector3.UP*0.22
	await ticks(2)
	game.ball.touch_lock = 0.0
	check(game.attempt_kick(0.6,false) and audio.played.get("shot",0)>0,"Actual shots trigger a kick sound")
	game.ball.pending_recall = game.player.position+game.player.facing*0.7+Vector3.UP*0.22
	await ticks(2)
	game.ball.touch_lock = 0.0
	check(game.attempt_pass(0.0,false) and audio.played.get("pass",0)>0,"Actual passes trigger a lighter sound")
	game.ball.pending_recall = game.WIDTH*5+Vector3.UP*1.5
	game.ball.release_velocity = Vector3(0,-3,0)
	await ticks(65)
	check(audio.played.get("bounce",0)>0,"Native floor bounce emits a sound")
	game.ball.pending_recall = game.WIDTH*7.4+Vector3.UP*0.5
	game.ball.release_velocity = game.WIDTH*9.0
	await ticks(25)
	check(audio.played.get("wall",0)>0,"Native side-wall impact emits a sound")
	var bounce_count = audio.played.get("bounce",0)
	audio.cooldowns["bounce"] = 0.1
	audio.on_contact(game.get_node("Floor"))
	check(audio.played.get("bounce",0)==bounce_count,"Repeated resting contacts do not spam sounds")
	check(audio.voices.size()==4 and audio.sounds.size()==4,"Sound mixing stays bounded")
	game.queue_free()
	await process_frame
	OS.delay_msec(100) # Let the real audio mixer release queued playbacks before shutdown.
	print("RESULT four players/audio: ",checks-failures,"/",checks)
	quit(1 if failures else 0)
