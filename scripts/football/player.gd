class_name FootballPlayer
extends CharacterBody3D

@export var controlled: bool = true
@export var walk_speed: float = 4.0
@export var jump_speed: float = 6.0
@onready var shadow: MeshInstance3D = $Shadow
@onready var sprite: Sprite3D = $Sprite3D
var look_at_ball: Vector3 = Vector3.INF
var facing = Vector3(1,0,1).normalized()
var run_phase: float = 0.0
var kick_time: float = 0.0
var charging: bool = false
var motion_goal: Vector3 = Vector3.ZERO

func _physics_process(delta: float) -> void:
	if not controlled:
		return
	var input = Input.get_vector("football_left","football_right","football_up","football_down",0.0)
	if Input.is_action_just_pressed("football_jump"):
		jump()
	drive(FootballControls.world_direction(input),delta)

func drive(direction: Vector3, delta: float) -> void:
	var speed = walk_speed
	if charging:
		speed *= 0.65
	motion_goal = direction*speed
	velocity.x = move_toward(velocity.x,motion_goal.x,20.0*delta)
	velocity.z = move_toward(velocity.z,motion_goal.z,20.0*delta)
	if is_on_floor() and velocity.y<=0.0:
		velocity.y = -0.5
	else:
		velocity.y -= 20.0*delta
	var previous = position
	move_and_slide()
	shadow.position.y = 0.012-position.y
	var shadow_size = 1.0/(1.0+maxf(position.y,0.0)*0.5)
	shadow.scale = Vector3(shadow_size,1.0,shadow_size)
	if not controlled and look_at_ball.is_finite():
		var look = look_at_ball-position
		look.y = 0.0
		if look.length_squared()>0.01:
			facing = look.normalized()
	elif direction.length_squared()>0.01:
		facing = direction.normalized()
	var distance = Vector2(position.x-previous.x,position.z-previous.z).length()
	kick_time = maxf(0.0,kick_time-delta)
	var row = 0
	if kick_time>0.0:
		row = 5
	elif not is_on_floor():
		row = 2
	elif distance>0.002:
		run_phase = fposmod(run_phase+distance/0.36,4.0)
		row = 1+int(run_phase)
	else:
		run_phase = 0.0
	sprite.frame = row*8+FootballControls.orientation(facing)

func show_kick() -> void:
	kick_time = 0.16
	sprite.frame = 40+FootballControls.orientation(facing)

func jump() -> bool:
	if not is_on_floor() or velocity.y>0.0:
		return false
	velocity.y = jump_speed
	return true
