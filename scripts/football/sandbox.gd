class_name FootballSandbox
extends Node3D

@onready var player: FootballPlayer = $Player
@onready var teammate: FootballPlayer = $Teammate
@onready var ball: FootballBall = $Ball
@onready var camera_rig: Node3D = $CameraRig
@onready var camera: Camera3D = $CameraRig/Camera3D
@onready var grass: MeshInstance3D = $Grass
@onready var help: Label = $HUD/Controls
@onready var feedback: Label = $HUD/Feedback
var charge_time: float = 0.0
var charging: bool = false
var charging_lob: bool = false
var desired_zoom: float = 18.72
var pass_receiver: FootballPlayer
var receive_target = Vector3.ZERO
var pass_age: float = 0.0
var volley_buffer: float = 0.0
var volley_power: float = 0.0
var feedback_time: float = 0.0

func _ready() -> void:
	FootballControls.configure()
	help.text = FootballControls.help_text()
	ball.goal_center = ($GoalTrees/LeftTree.position+$GoalTrees/RightTree.position)*0.5
	ball.goal_half_width = $GoalTrees/LeftTree.position.distance_to($GoalTrees/RightTree.position)*0.5
	ball.recall(player)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("football_help"):
		help.visible = not help.visible
	elif event.is_action_pressed("football_recall"):
		cancel_charge()
		pass_receiver = null
		volley_buffer = 0.0
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
	volley_buffer = maxf(0.0,volley_buffer-delta)
	if volley_buffer>0.0 and ball.volley_reachable(player):
		ball.kick(player,volley_power,false)
		pass_receiver = null
		volley_buffer = 0.0
	var direction = Vector3.ZERO
	if pass_receiver!=null:
		pass_age += delta
		if ball.position.y<0.5 and pass_age>0.3:
			receive_target = Vector3(ball.position.x,0,ball.position.z)
		var gap = receive_target-pass_receiver.position
		gap.y = 0.0
		if gap.length()>0.2:
			direction = gap.normalized()
		if pass_age>0.25 and ball.reachable(pass_receiver) and ball.position.y<0.35:
			var previous = player
			player = pass_receiver
			teammate = previous
			previous.controlled = false
			previous.charging = false
			player.controlled = true
			feedback.text = "Palla al compagno"
			feedback_time = 0.8
			pass_receiver = null
			volley_buffer = 0.0
		elif pass_age>4.0 or ball.held_by!=null:
			pass_receiver = null
	teammate.drive(direction if pass_receiver!=null else Vector3.ZERO,false,delta)
	ball.control_near(player,delta)
	if charging:
		charge_time = minf(0.85,charge_time+delta)
	# Visual cover follows discretely; world-space grass does not slide with it.
	grass.position = Vector3(snappedf(player.position.x,32.0),0,snappedf(player.position.z,32.0))

func _process(delta: float) -> void:
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
		if gap<2.5 and ball.position.y>0.35:
			volley_buffer = 0.22
			volley_power = power
			feedback.text = ""
			return false
	if not success:
		feedback.text = "Avvicinati alla palla"
		feedback_time = 1.2
	return success

func attempt_pass(power: float, high: bool) -> bool:
	var success = ball.pass_to(player,teammate.position,power,high)
	if not success:
		feedback.text = "Avvicinati alla palla"
		feedback_time = 1.2
		return false
	pass_receiver = teammate
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
