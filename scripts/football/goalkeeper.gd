extends CharacterBody3D
## A small reactive keeper: lateral interception and physical deflection, no snaps.
@export var movement_speed: float = 3.2
@onready var ball: FootballBall = get_parent().get_node("Ball")
@onready var sprite: Sprite3D = $Sprite3D
var center = Vector3.ZERO
var lateral = Vector3.RIGHT
var forward = Vector3.BACK
var half_width: float = 2.0
var phase: float = 0.0
var parry_cooldown: float = 0.0
var saves: int = 0

func _ready() -> void:
	remove_from_group("football_player")
	var posts = get_parent().get_node("GoalTrees")
	center = (posts.get_child(0).position+posts.get_child(1).position)*0.5
	lateral = (posts.get_child(1).position-posts.get_child(0).position).normalized()
	forward = lateral.cross(Vector3.UP).normalized()
	if forward.dot(-center)<0.0:
		forward = -forward
	half_width = posts.get_child(0).position.distance_to(posts.get_child(1).position)*0.5-0.45

func target_position() -> Vector3:
	var offset = ball.position-center
	var approach_speed = ball.linear_velocity.dot(forward)
	var ahead = offset.dot(forward)
	var anticipated = ball.position
	if approach_speed< -0.1 and ahead>0.0:
		var time = ahead/-approach_speed
		if time<1.2:
			anticipated += ball.linear_velocity*time
	var side = clampf((anticipated-center).dot(lateral),-half_width,half_width)
	# Return to center when play moves well away from the goal.
	if ahead>22.0 or ahead< -2.0:
		side = 0.0
	return center+lateral*side

func _physics_process(delta: float) -> void:
	parry_cooldown = maxf(0.0,parry_cooldown-delta)
	var offset = target_position()-position
	offset.y = 0.0
	var desired = offset*5.0
	desired = desired.limit_length(movement_speed)
	velocity.x = move_toward(velocity.x,desired.x,12.0*delta)
	velocity.z = move_toward(velocity.z,desired.z,12.0*delta)
	velocity.y = -0.5 if is_on_floor() else velocity.y-20.0*delta
	var before = position
	move_and_slide()
	var travel = Vector2(position.x-before.x,position.z-before.z).length()
	var facing = ball.position-position
	facing.y = 0.0
	var row = 0
	if travel>0.002:
		phase = fposmod(phase+travel/0.36,4.0)
		row = 1+int(phase)
	if parry_cooldown>0.25:
		row = 5
	sprite.frame = row*8+FootballControls.orientation(facing)
	try_parry()

func try_parry() -> bool:
	var gap = ball.position-position
	var planar = Vector2(gap.x,gap.z).length()
	if parry_cooldown>0.0 or planar>0.68 or gap.y<0.15 or gap.y>1.6:
		return false
	if ball.linear_velocity.dot(forward)>= -0.1:
		return false
	var speed = clampf(ball.linear_velocity.length()*0.45,4.0,14.0)
	var sideways = clampf(gap.dot(lateral)*3.0,-1.2,1.2)
	ball.linear_velocity = forward*speed+lateral*sideways+Vector3.UP*1.5
	ball.touch_lock = 0.4
	ball.controlled = false
	ball.sleeping = false
	parry_cooldown = 0.5
	saves += 1
	return true
