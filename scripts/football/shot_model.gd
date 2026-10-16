class_name FootballShotModel
extends RefCounted
## Port of footballgame entity_player_aim_shot / entity_ball_shoot.
## World units are metres (the source uses 10 pixels per metre).
static func charge_profile(charge: float, height: float) -> Vector2:
	var power = clampf(charge,0.0,1.0)
	if power>0.8:
		var overcharge = (power-0.8)/0.2
		return Vector2(0.8-0.1*overcharge,height*(1.3+0.3*overcharge))
	return Vector2(power/0.8,height)

static func launch(direction: Vector3, charge: float, height: float, maximum: float, contact_multiplier: float) -> Vector3:
	var profile = charge_profile(charge,height)
	var lift = 0.2*(0.2+0.8*profile.y)
	var speed = maximum*(0.5+0.5*profile.x)*contact_multiplier
	return (direction+Vector3.UP*lift).normalized()*speed

static func aim(ball_position: Vector3, goal: Vector3, half_width: float, steering: Vector2, velocity: Vector3, charge: float, accuracy_extra: float) -> Vector4:
	var center = goal-ball_position
	center.y = 0.0
	center = center.normalized()
	var lateral = Vector3(-center.z,0,center.x)
	var post = (goal+lateral*(half_width+accuracy_extra)-ball_position).normalized()
	post.y = 0.0
	var angle = center.signed_angle_to(post,Vector3.UP)
	var direction = center.rotated(Vector3.UP,angle*steering.x)
	var movement = Vector3(velocity.x,0,velocity.z)
	if movement.length()>0.01:
		var turn = movement.normalized().signed_angle_to(direction,Vector3.UP)
		direction = movement.normalized().rotated(Vector3.UP,clampf(turn,deg_to_rad(-100),deg_to_rad(100)))
	var goal_on_screen = FootballControls.screen_direction(center)
	var attack_sign = -1.0 if goal_on_screen.y>0 else 1.0
	var height = clampf((1.0-steering.y*attack_sign)*0.4,0.0,1.0)
	return Vector4(direction.x,0,direction.z,height)
