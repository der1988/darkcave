class_name StreetPlayer
extends FootballPlayer
## Original footballgame action poses, with physical sliding and recovery.
enum Action { NORMAL, SLIDE, FALL, RECOVER, STUMBLE }
const ART = preload("res://assets/football/player_actions.png")
const MODEL_SCALE = 0.85
var action: Action = Action.NORMAL
var action_time: float = 0.0
var slide_cooldown: float = 0.0
var protection: float = 0.0
var action_direction = Vector3.RIGHT
var ball_hit: bool = false
var struck: Array = []
var recovering_fall: bool = false

func _ready() -> void:
	sprite.texture = ART
	sprite.vframes = 19
	sprite.pixel_size *= MODEL_SCALE
	sprite.position.y *= MODEL_SCALE
	$Body.shape = $Body.shape.duplicate()
	$Body.shape.radius *= MODEL_SCALE
	shadow.mesh = shadow.mesh.duplicate()
	shadow.mesh.top_radius *= MODEL_SCALE
	shadow.mesh.bottom_radius *= MODEL_SCALE
	set_low_posture(false)

func is_busy() -> bool:
	return action in [Action.SLIDE,Action.FALL,Action.RECOVER]

func can_play_ball() -> bool:
	return not is_busy()

func reset_action() -> void:
	action = Action.NORMAL
	action_time = 0.0
	slide_cooldown = 0.0
	protection = 0.0
	kick_time = 0.0
	set_low_posture(false)

func set_low_posture(low: bool) -> void:
	$Body.shape.height = (0.65 if low else 1.45)*MODEL_SCALE
	$Body.position.y = $Body.shape.height*0.5

func start_slide(direction: Vector3) -> bool:
	if action!=Action.NORMAL or slide_cooldown>0.0 or not is_on_floor(): return false
	action = Action.SLIDE
	action_time = 0.0
	slide_cooldown = 1.6
	action_direction = direction.normalized() if direction.length()>0.1 else facing
	ball_hit = false
	struck.clear()
	charging = false
	recovering_fall = false
	set_low_posture(true)
	return true

func fall(direction: Vector3) -> bool:
	if protection>0.0 or action in [Action.FALL,Action.RECOVER]: return false
	action = Action.FALL
	action_time = 0.0
	protection = 1.9
	action_direction = direction.normalized()
	recovering_fall = true
	charging = false
	set_low_posture(true)
	return true

func drive(direction: Vector3, delta: float) -> void:
	slide_cooldown = maxf(0.0,slide_cooldown-delta)
	protection = maxf(0.0,protection-delta)
	action_time += delta
	if (action==Action.SLIDE and action_time>=0.5) or (action==Action.FALL and action_time>=0.75):
		action = Action.RECOVER
		action_time = 0.0
	elif action==Action.RECOVER and action_time>=0.18:
		action = Action.STUMBLE if recovering_fall else Action.NORMAL
		action_time = 0.0
		set_low_posture(false)
	elif action==Action.STUMBLE and action_time>=0.6:
		action = Action.NORMAL
	var movement = direction
	if is_busy():
		look_at_ball = Vector3.INF
		var speed = maxf(2.0,7.0-action_time*9.0) if action==Action.SLIDE else (maxf(0.0,2.2-action_time*6.0) if action==Action.FALL else 0.0)
		movement = action_direction*speed/walk_speed
	elif action==Action.STUMBLE:
		movement *= 0.6
	var before = position
	super.drive(movement,delta)
	if is_busy(): facing = action_direction
	var orientation = FootballControls.orientation(facing)
	if action==Action.SLIDE:
		sprite.frame = 12*8+orientation
		resolve_tackle(before)
	elif action==Action.FALL:
		sprite.frame = (13 if action_time<0.075 else 14)*8+orientation
	elif action==Action.RECOVER:
		sprite.frame = 13*8+orientation
	elif kick_time>0.0 and contact_animation=="head":
		var sequence = [0,0,0,1,1,2,2,3,3,4,4,5]
		sprite.frame = (6+sequence[mini(11,int((0.24-kick_time)/0.02))])*8+orientation
	elif action==Action.STUMBLE and movement.length()>0.05:
		sprite.frame = (15+mini(3,int(action_time/0.15)))*8+orientation

func resolve_tackle(before: Vector3) -> void:
	var game = get_parent()
	var ball: FootballBall = game.ball
	if not ball_hit and ball.held_by==null and ball.position.y<0.95:
		var foot = Vector3(ball.position.x,position.y,ball.position.z)
		if Geometry3D.get_closest_point_to_segment(foot,before,position).distance_to(foot)<0.85 and clear_contact(ball.position):
			ball.linear_velocity = action_direction*8.0+Vector3.UP
			ball.touch_lock = 0.35
			ball.controlled = false
			ball.sleeping = false
			ball.play_id += 1
			ball.last_kick_volley = false
			game.rules.touch(self,"foot",false)
			game.possession = null
			ball_hit = true
	for other in game.outfield:
		if other==self or other.team==team or struck.has(other) or other.position.y>0.5: continue
		var foot = Vector3(other.position.x,position.y,other.position.z)
		if Geometry3D.get_closest_point_to_segment(foot,before,position).distance_to(foot)<0.65 and clear_contact(other.position+Vector3.UP*0.3):
			other.fall(action_direction)
			struck.append(other)

func clear_contact(target: Vector3) -> bool:
	var query = PhysicsRayQueryParameters3D.create(position+Vector3.UP*0.3,target,1)
	return get_world_3d().direct_space_state.intersect_ray(query).is_empty()

func jump() -> bool:
	return false if is_busy() else super.jump()
