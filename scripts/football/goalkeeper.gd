extends CharacterBody3D
## Adapted from footballgame ai_goalie / entity_player goalie states.
enum State { PROTECT, DIVE, JUMP, SMOTHER, RECOVER, HOLD, THROW }
@export var movement_speed: float = 3.2
@export var dive_speed: float = 6.0
@export var reaction_time: float = 0.15
@export var recovery_time: float = 0.75
@onready var ball: FootballBall = get_parent().get_node("Ball")
@onready var sprite = $Sprite3D
var center = Vector3.ZERO
var lateral = Vector3.RIGHT
var forward = Vector3.BACK
var half_width: float = 2.0
var phase: float = 0.0
var parry_cooldown: float = 0.0
var saves: int = 0
var state: State = State.PROTECT
var state_time: float = 0.0
var dive_velocity = Vector3.ZERO
var dive_high: bool = false
var dive_side: String = "left"
var dive_face: String = "front"

func _ready() -> void:
	remove_from_group("football_player")
	$Body.shape = $Body.shape.duplicate()
	var posts = get_parent().get_node("GoalTrees")
	center = (posts.get_child(0).position+posts.get_child(1).position)*0.5
	lateral = (posts.get_child(1).position-posts.get_child(0).position).normalized()
	forward = lateral.cross(Vector3.UP).normalized()
	if forward.dot(-center)<0.0:
		forward = -forward
	half_width = posts.get_child(0).position.distance_to(posts.get_child(1).position)*0.5-0.45

func predict_crossing() -> Dictionary:
	var point = ball.position
	var motion = ball.linear_velocity
	if motion.dot(forward)>= -0.1 or (point-center).dot(forward)<0.0:
		return {}
	for i in 72:
		motion /= 1.0+ball.air_drag*motion.length()/60.0
		motion.y -= 9.8/60.0
		if point.y<=0.23:
			var planar = Vector3(motion.x,0,motion.z).move_toward(Vector3.ZERO,ball.rolling_deceleration/60.0)
			motion.x = planar.x
			motion.z = planar.z
		point += motion/60.0
		if point.y<0.2:
			point.y = 0.2
			motion.y = absf(motion.y)*0.5
		if (point-center).dot(forward)<=0.45:
			return {"point":point,"time":(i+1)/60.0}
	return {}

func target_position() -> Vector3:
	var prediction = predict_crossing()
	var target = ball.position if prediction.is_empty() else prediction.point
	var side = clampf((target-center).dot(lateral),-half_width,half_width)
	var ahead = (ball.position-center).dot(forward)
	if ahead>22.0 or ahead< -2.0:
		side = 0.0
	return center+lateral*side

func choose_dive() -> bool:
	if state!=State.PROTECT or ball.linear_velocity.length()<=15.0 or ball.flight_age<reaction_time:
		return false
	var prediction = predict_crossing()
	if prediction.is_empty() or prediction.time>0.75:
		return false
	var point: Vector3 = prediction.point
	var side = (point-position).dot(lateral)
	if absf((point-center).dot(lateral))>half_width*1.1 or point.y>3.54:
		return false
	# Straight shots are taken standing; high central shots call for a jump.
	if absf(side)<0.5 and point.y<=1.6:
		return false
	dive_face = "front" if FootballControls.screen_direction(forward).y>=0.0 else "back"
	dive_side = "right" if FootballControls.screen_direction(lateral*side).x>0.0 else "left"
	dive_high = point.y>=1.2
	state_time = 0.0
	if absf(side)<0.5:
		state = State.JUMP
		velocity.y = 5.2
		sprite.animate([dive_face+"_jump_parry_start",dive_face+"_jump_parry_end"])
	else:
		state = State.DIVE
		dive_velocity = lateral*signf(side)*minf(dive_speed,absf(side)/maxf(float(prediction.time),0.05))
		var name = "dive_"+dive_face+"_"+("high" if dive_high else "low")+"_"+dive_side
		sprite.animate([name+"_start",name+"_end"])
	return true

func choose_smother() -> bool:
	if state!=State.PROTECT or ball.held_by!=null or ball.position.y>0.8 or ball.linear_velocity.length()>=15.0:
		return false
	var gap = ball.position-position
	gap.y = 0.0
	var player = get_parent().player
	if gap.length()>2.5 or gap.length()<0.3 or player.position.distance_to(ball.position)>3.0:
		return false
	if absf((ball.position-center).dot(lateral))>half_width or (ball.position-center).dot(forward)<0.0:
		return false
	var query = PhysicsRayQueryParameters3D.create(position+Vector3.UP*0.3,ball.position,16)
	if not get_world_3d().direct_space_state.intersect_ray(query).is_empty():
		return false
	state = State.SMOTHER
	state_time = 0.0
	dive_high = false
	dive_velocity = gap.normalized()*minf(dive_speed,gap.length()/0.3)
	var direction = sprite.DIRECTIONS[FootballControls.orientation(gap)]
	sprite.animate(["smother_"+direction])
	return true

func _physics_process(delta: float) -> void:
	state_time += delta
	parry_cooldown = maxf(0.0,parry_cooldown-delta)
	if state==State.HOLD or state==State.THROW:
		update_hold(delta)
		return
	if not choose_dive():
		choose_smother()
	var desired = Vector3.ZERO
	if state==State.PROTECT:
		desired = ((target_position()-position)*5.0).limit_length(movement_speed)
	elif state==State.DIVE or state==State.SMOTHER:
		desired = dive_velocity
		if state_time>0.35:
			dive_velocity = dive_velocity.move_toward(Vector3.ZERO,15.0*delta)
	if state==State.DIVE or state==State.JUMP or state==State.SMOTHER:
		if state_time>0.55 and (state!=State.JUMP or is_on_floor()):
			state = State.RECOVER
			state_time = 0.0
	elif state==State.RECOVER and state_time>=recovery_time:
		state = State.PROTECT
		state_time = 0.0
	var low_posture = (state==State.DIVE or state==State.SMOTHER or state==State.RECOVER) and not dive_high
	$Body.shape.height = 0.6 if low_posture else 1.45
	$Body.position.y = 0.3 if low_posture else 0.725
	velocity.x = move_toward(velocity.x,desired.x,25.0*delta)
	velocity.z = move_toward(velocity.z,desired.z,25.0*delta)
	velocity.y = -0.5 if is_on_floor() and velocity.y<=0.0 else velocity.y-20.0*delta
	var before = position
	move_and_slide()
	var travel = Vector2(position.x-before.x,position.z-before.z).length()
	$Shadow.position.y = 0.012-position.y
	if state==State.PROTECT:
		phase = fposmod(phase+travel/0.36,4.0)
		sprite.locomotion(ball.position-position,phase,travel>0.002)
	else:
		sprite.update_sequence(delta)
	try_parry(true)

func try_parry(allow_catch: bool = false) -> bool:
	var gap = ball.position-position
	var planar = Vector2(gap.x,gap.z).length()
	var reach = 0.95 if state==State.DIVE else 0.68
	var height = (2.5 if dive_high else 1.2) if state==State.DIVE else 1.6
	if state==State.RECOVER or parry_cooldown>0.0 or planar>reach or gap.y<0.15 or gap.y>height or ball.held_by!=null:
		return false
	if ball.linear_velocity.dot(forward)>= -0.1 and state!=State.SMOTHER:
		return false
	var speed = ball.linear_velocity.length()
	# Source: slow balls held, intermediate speeds occasionally held, high balls parried.
	if allow_catch and speed<15.0 and ball.position.y<2.5:
		state = State.HOLD
		state_time = 0.0
		ball.held_by = self
		ball.freeze = true
		ball.sprite.visible = false
		ball.linear_velocity = Vector3.ZERO
		ball.controlled = false
	else:
		var edge = clampf(gap.dot(lateral)/reach,-1.0,1.0)
		var factor = 0.3+0.2*edge*edge
		var direction = forward.rotated(Vector3.UP,-edge*PI/2.0)
		ball.linear_velocity = direction*speed*factor+Vector3.UP*1.5
		ball.touch_lock = 0.4
		ball.controlled = false
		ball.sleeping = false
		if state==State.PROTECT:
			dive_high = true
			sprite.animate(["front_jump_parry_start","front_jump_parry_end"])
			state = State.RECOVER
			state_time = 0.0
	parry_cooldown = 0.5
	saves += 1
	return true

func update_hold(delta: float) -> void:
	if ball.held_by!=self:
		state = State.PROTECT
		return
	velocity.x = 0.0
	velocity.z = 0.0
	velocity.y = -0.5 if is_on_floor() else velocity.y-20.0*delta
	move_and_slide()
	$Shadow.position.y = 0.012-position.y
	ball.global_position = global_position+forward*0.45+Vector3.UP*0.8
	if state==State.HOLD:
		sprite.locomotion(forward,0.0,false,true)
		if state_time>=0.65:
			state = State.THROW
			state_time = 0.0
			sprite.animate(["hand_pass_front"])
	else:
		sprite.update_sequence(delta)
		if state_time>=0.2:
			release_ball()

func release_ball() -> void:
	if ball.held_by==self:
		ball.held_by = null
		ball.freeze = false
		ball.sprite.visible = true
		ball.pending_recall = ball.global_position
		ball.release_velocity = forward*7.0+Vector3.UP*2.0
		ball.touch_lock = 0.4
	state = State.RECOVER
	state_time = 0.0
