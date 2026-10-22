class_name FootballSandbox
extends Node3D

@onready var player: FootballPlayer = $Player
@onready var teammate: FootballPlayer = $Teammate
@onready var ball: FootballBall = $Ball
@onready var camera_rig: Node3D = $CameraRig
@onready var camera: Camera3D = $CameraRig/Camera3D
@onready var court: MeshInstance3D = $Court
@onready var rules = $MatchRules
@onready var pass_target = $PassTarget
@onready var help: Label = $HUD/Controls
@onready var feedback: Label = $HUD/Feedback
var charge_time: float = 0.0
var charging: bool = false
var charging_lob: bool = false
var desired_zoom: float = 18.72
var pass_receiver: FootballPlayer
var receive_target = Vector3.ZERO
var support_plans: Dictionary = {}
var outfield: Array[FootballPlayer] = []
var pass_high: bool = false
var pass_age: float = 0.0
var volley_buffer: float = 0.0
var volley_power: float = 0.0
var feedback_time: float = 0.0

func _ready() -> void:
	outfield.assign([$Player,$Teammate,$Teammate2,$Teammate3])
	FootballControls.configure()
	help.text = FootballControls.help_text()
	ball.goal_center = ($Goal/LeftPost.position+$Goal/RightPost.position)*0.5
	ball.goal_half_width = $Goal/LeftPost.position.distance_to($Goal/RightPost.position)*0.5
	rules.start_match()
	$HUD/Restart.pressed.connect(rules.start_match)

func _unhandled_input(event: InputEvent) -> void:
	if rules.enabled and (rules.finished or rules.resetting):
		if event.is_action_pressed("football_recall") and rules.finished:
			rules.start_match()
		return
	if event.is_action_pressed("football_help"):
		help.visible = not help.visible
	elif event.is_action_pressed("football_recall"):
		cancel_charge()
		pass_receiver = null
		volley_buffer = 0.0
		if rules.enabled and rules.rally_live:
			rules.fault(rules.last_touch,"Azione interrotta")
			return
		if rules.enabled:
			rules.rally_live = false
		ball.recall(player)
		feedback_time = 0.0
		feedback.text = ""
	elif event.is_action_pressed("football_pass") and not event.is_echo():
		cancel_charge()
		volley_buffer = 0.0
		attempt_pass(0.0,false)
	elif event.is_action_pressed("football_shoot") and not event.is_echo():
		begin_charge(false)
	elif event.is_action_released("football_shoot") and charging and not charging_lob:
		attempt_kick(clampf(charge_time/0.85,0.0,1.0),false)
		cancel_charge()
	elif event.is_action_pressed("football_lob") and not event.is_echo():
		begin_charge(true)
	elif event.is_action_released("football_lob") and charging and charging_lob:
		attempt_pass(clampf(charge_time/0.85,0.0,1.0),true)
		cancel_charge()
	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			desired_zoom = maxf(12.0,desired_zoom-2.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			desired_zoom = minf(34.0,desired_zoom+2.0)

func _physics_process(delta: float) -> void:
	if rules.enabled and (rules.finished or rules.resetting):
		return
	volley_buffer = maxf(0.0,volley_buffer-delta)
	if volley_buffer>0.0 and ball.volley_reachable(player) and ball.kick(player,volley_power,false):
		pass_receiver = null
		volley_buffer = 0.0
	var direction = Vector3.ZERO
	if pass_receiver!=null:
		pass_age += delta
		if ball.position.y<0.5 and pass_age>0.3:
			receive_target = Vector3(ball.position.x,0,ball.position.z)
		var intercept = receive_target
		if pass_high:
			intercept = ball.position+Vector3(ball.linear_velocity.x,0,ball.linear_velocity.z)*0.25
		var gap = intercept-pass_receiver.position
		gap.y = 0.0
		if gap.length()>0.2:
			direction = gap.normalized()
		var ground_receive = ball.reachable(pass_receiver) and ball.position.y<0.35
		var aerial_receive = (pass_high or rules.enabled) and ball.held_by==null and ball.position.y>0.35 and ball.position.y<3.2 and Vector2(ball.position.x-pass_receiver.position.x,ball.position.z-pass_receiver.position.z).length()<2.6
		if pass_age>0.25 and (ground_receive or aerial_receive):
			var previous = player
			player = pass_receiver
			teammate = previous
			previous.controlled = false
			previous.charging = false
			player.controlled = true
			player.charging = charging
			feedback.text = "A · Tira al volo" if aerial_receive else "Palla al compagno"
			feedback_time = 0.8
			pass_receiver = null
			volley_buffer = 0.0
		elif pass_age>4.0 or ball.held_by!=null:
			pass_receiver = null
	var teammates = active_outfield()
	teammates.erase(player)
	var axis = Vector3(-0.70710678,0,0.70710678)
	teammates.sort_custom(func(a,b): return a.position.dot(axis)<b.position.dot(axis))
	for i in teammates.size():
		var actor: FootballPlayer = teammates[i]
		if not support_plans.has(actor.get_instance_id()):
			support_plans[actor.get_instance_id()] = FootballTeammateSupport.new()
		var plan: FootballTeammateSupport = support_plans[actor.get_instance_id()]
		var movement = direction if actor==pass_receiver else plan.direction(player,actor,ball,delta,teammates,i,active_outfield())
		actor.look_at_ball = ball.position
		actor.drive(movement,delta)
	ball.control_near(player,delta)
	if rules.enabled and rules.rally_live and ball.controlled and (rules.last_touch!=player.participant_id or rules.shot_in_flight):
		rules.touch(player,"foot",false)
	if charging:
		charge_time = minf(0.85,charge_time+delta)

func _process(delta: float) -> void:
	if rules.enabled and rules.finished:
		feedback.text = "%s VINCE · Nuova partita" % rules.winner
		return
	camera.size = lerpf(camera.size,desired_zoom,1.0-exp(-10.0*delta))
	feedback_time = maxf(0.0,feedback_time-delta)
	if charging:
		feedback.text = ("PASSAGGIO ALTO %d%%" if charging_lob else "TIRO %d%% · ideale 80%%") % roundi(charge_time/0.85*100.0)
	elif feedback_time<=0.0:
		feedback.text = "Palla lontana · R per richiamarla" if player.position.distance_to(ball.position)>16.0 else ""

func attempt_kick(power: float, lob: bool) -> bool:
	var success = ball.kick(player,power,lob)
	if success:
		pass_receiver = null
	if not success and not lob and ball.held_by==null:
		var gap = Vector2(ball.position.x-player.position.x,ball.position.z-player.position.z).length()
		if gap<3.0 and ball.position.y>0.35:
			volley_buffer = 0.38
			volley_power = power
			feedback.text = ""
			return false
	if not success:
		feedback.text = "Gol solo al volo · alza la palla con S o D" if rules.enabled and not lob and ball.reachable(player) else "Avvicinati alla palla"
		feedback_time = 1.2
	return success

func attempt_pass(power: float, high: bool) -> bool:
	var receiver = choose_pass_target()
	if receiver!=null:
		teammate = receiver
	var target_position = receiver.position if receiver!=null else player.position+player.facing*0.8
	var success = ball.pass_to(player,target_position,power,high)
	if not success:
		feedback.text = "Avvicinati alla palla"
		feedback_time = 1.2
		return false
	pass_receiver = receiver
	pass_high = high
	pass_age = 0.0
	volley_buffer = 0.0
	if high:
		var direction = Vector3(ball.linear_velocity.x,0,ball.linear_velocity.z).normalized()
		var flight_time = 2.0*ball.linear_velocity.y/9.8
		receive_target = ball.position+direction*Vector2(ball.linear_velocity.x,ball.linear_velocity.z).length()*flight_time*0.90
		receive_target.y = 0.0
	else:
		receive_target = teammate.position
	return true

func begin_charge(lob: bool) -> void:
	volley_buffer = 0.0
	charging = true
	charging_lob = lob
	charge_time = 0.0
	player.charging = true

func cancel_charge() -> void:
	charging = false
	charging_lob = false
	charge_time = 0.0
	player.charging = false

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and is_instance_valid(player):
		cancel_charge()
		volley_buffer = 0.0

func active_outfield() -> Array:
	return outfield.filter(func(actor): return not actor.participant_id.is_empty())

func choose_pass_target() -> FootballPlayer:
	var wish = Input.get_vector("football_left","football_right","football_up","football_down")
	var direction = FootballControls.world_direction(wish) if wish.length()>0.2 else player.facing
	return pass_target.choose(player,active_outfield(),direction)
