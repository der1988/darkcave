extends FootballSandbox
## Reuses the existing input, charge, passing, sprites and ball physics.
const LENGTH = Vector3(0.70710678,0,-0.70710678)
const WIDTH = Vector3(0.70710678,0,0.70710678)
var keepers: Array = []
var ai_plans: Dictionary = {}
var possession: FootballPlayer
var switch_cooldown: float = 0.0
var slide_press: bool = false

func _ready() -> void:
	outfield.assign([$Player,$Teammate,$Blue1,$Blue2])
	keepers = [$RedKeeper,$BlueKeeper]
	FootballControls.configure()
	help.text = FootballControls.help_text(true)
	desired_zoom = 20.0
	ball.goal_center = LENGTH*12.0
	ball.goal_half_width = 2.4
	for actor in outfield:
		actor.attack_goal = LENGTH*(12.0 if actor.team==0 else -12.0)
	for actor in outfield+keepers:
		FootballRoster.apply_kit(actor)
		actor.sprite.material_override.set_shader_parameter("kit_color",Color("eb454b") if actor.team==0 else Color("488fec"))
		actor.get_node("NameLabel").text = actor.participant_id
	rules.start_match()
	$HUD/Restart.pressed.connect(rules.start_match)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_released("football_lob") and slide_press:
		slide_press = false
		return
	if event.is_action_pressed("football_lob") and not event.is_echo() and not rules.finished and not rules.resetting and not has_ball(player):
		var wish = Input.get_vector("football_left","football_right","football_up","football_down")
		cancel_charge()
		player.start_slide(FootballControls.world_direction(wish) if wish.length()>0.1 else player.facing)
		slide_press = true
		return
	if player.is_busy() and (event.is_action("football_lob") or event.is_action("football_pass") or event.is_action("football_shoot")):
		return
	if event.is_action_pressed("football_recall"):
		rules.start_match()
	elif event.is_action_pressed("football_switch") and not rules.resetting and not rules.finished:
		var candidate = other_outfielder(player)
		if candidate.can_play_ball():
			set_controlled(candidate)
			switch_cooldown = 1.2
	else:
		super._unhandled_input(event)

func team_players(team: int) -> Array:
	return outfield.filter(func(actor): return actor.team==team)

func active_outfield() -> Array:
	return team_players(0).filter(func(actor): return actor.can_play_ball())

func attack_direction(team: int) -> Vector3:
	return LENGTH if team==0 else -LENGTH

func other_outfielder(actor: FootballPlayer) -> FootballPlayer:
	for candidate in team_players(actor.team):
		if candidate!=actor: return candidate
	return null

func nearest_outfielder(point: Vector3, team: int = -1, available: bool = false) -> FootballPlayer:
	var nearest: FootballPlayer
	var distance = INF
	for actor in outfield:
		if team>=0 and actor.team!=team: continue
		if available and not actor.can_play_ball(): continue
		var gap = Vector2(actor.position.x-point.x,actor.position.z-point.z).length()
		if gap<distance:
			distance = gap
			nearest = actor
	return nearest

func team_outlet(team: int, point: Vector3) -> FootballPlayer:
	return nearest_outfielder(point,team)

func set_controlled(actor: FootballPlayer) -> void:
	cancel_charge()
	for candidate in outfield: candidate.controlled = candidate==actor
	player = actor
	teammate = other_outfielder(actor)
	pass_receiver = null
	volley_buffer = 0.0

func clamp_to_arena(point: Vector3, margin: float) -> Vector3:
	return LENGTH*clampf(point.dot(LENGTH),-13.4+margin,13.4-margin)+WIDTH*clampf(point.dot(WIDTH),-8.2+margin,8.2-margin)

func _physics_process(delta: float) -> void:
	if rules.finished or rules.resetting: return
	if player.is_busy() and charging: cancel_charge()
	switch_cooldown = maxf(0.0,switch_cooldown-delta)
	possession = null
	if ball.held_by==null:
		var closest = nearest_outfielder(ball.position,-1,true)
		if closest!=null: ball.control_near(closest,delta)
		if closest!=null and ball.controlled:
			possession = closest
			if rules.last_touch!=closest.participant_id: rules.touch(closest,"foot",false)
	if pass_receiver!=null:
		pass_age += delta
		var planar = Vector2(ball.position.x-pass_receiver.position.x,ball.position.z-pass_receiver.position.z).length()
		if pass_age>0.25 and pass_receiver.can_play_ball() and ball.held_by==null and planar<1.8 and ball.position.y<2.3:
			set_controlled(pass_receiver)
			switch_cooldown = 1.0
		elif pass_age>4.0 or ball.held_by!=null:
			pass_receiver = null
	if pass_receiver==null and not charging and not player.is_busy() and switch_cooldown<=0.0 and (possession==null or possession.team==1):
		var defender = nearest_outfielder(ball.position,0,true)
		if defender!=null and defender!=player and player.position.distance_to(ball.position)>defender.position.distance_to(ball.position)+2.5:
			set_controlled(defender)
			switch_cooldown = 1.0
	if volley_buffer>0.0:
		volley_buffer -= delta
		if ball.kick(player,volley_power,false): volley_buffer = 0.0
	for actor in outfield:
		if actor==player: continue
		if not ai_plans.has(actor): ai_plans[actor] = FootballTeamAI.new()
		ai_plans[actor].step(self,actor,delta)
	if charging: charge_time = minf(0.85,charge_time+delta)
	$ControlRing.global_position = Vector3(player.position.x,0.025,player.position.z)

func _process(delta: float) -> void:
	if rules.finished: return
	camera.size = lerpf(camera.size,desired_zoom,1.0-exp(-10.0*delta))
	feedback_time = maxf(0.0,feedback_time-delta)
	if charging:
		feedback.text = ("PASSAGGIO %d%%" if charging_lob else "TIRO %d%%") % roundi(charge_time/0.85*100.0)
	elif feedback_time<=0.0: feedback.text = ""

func has_ball(actor: FootballPlayer) -> bool:
	if ball.held_by!=null: return false
	if possession!=null: return possession==actor
	return ball.reachable(actor) or (ball.position.y>0.5 and ball.volley_reachable(actor))
