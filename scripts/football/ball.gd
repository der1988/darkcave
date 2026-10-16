class_name FootballBall
extends RigidBody3D

@onready var sprite: Sprite3D = $Sprite3D
@onready var shadow: MeshInstance3D = $Shadow
var touch_lock: float = 0.0
var roll_phase: float = 0.0
var controlled: bool = false
var pending_recall: Vector3 = Vector3.INF

func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
	if pending_recall.is_finite():
		# Input can arrive between physics steps: reset the authoritative body state.
		state.transform = Transform3D(Basis.IDENTITY,pending_recall)
		state.linear_velocity = Vector3.ZERO
		state.angular_velocity = Vector3.ZERO
		pending_recall = Vector3.INF

func _physics_process(delta: float) -> void:
	touch_lock = maxf(0.0,touch_lock-delta)
	# Rolling resistance on grass, distinct from air drag; gravity/bounces are native.
	if position.y<0.23:
		linear_velocity.x = move_toward(linear_velocity.x,0.0,1.2*delta)
		linear_velocity.z = move_toward(linear_velocity.z,0.0,1.2*delta)
	var planar = Vector3(linear_velocity.x,0,linear_velocity.z)
	if planar.length()>0.08:
		roll_phase = fposmod(roll_phase+planar.length()*delta/0.12,4.0)
		sprite.frame = int(roll_phase)*8+FootballControls.orientation(planar)
	shadow.global_position = Vector3(global_position.x,0.015,global_position.z)
	var scale_factor = clampf(1.0/(1.0+position.y*0.4),0.35,1.0)
	shadow.scale = Vector3(scale_factor,1.0,scale_factor)

func reachable(player: FootballPlayer) -> bool:
	var gap = Vector2(position.x-player.position.x,position.z-player.position.z).length()
	return player.is_on_floor() and gap<1.05 and position.y<0.75 and touch_lock<=0.0

# A volley has its own reach envelope; it must never enable airborne dribbling.
func volley_reachable(player: FootballPlayer) -> bool:
	var gap = Vector2(position.x-player.position.x,position.z-player.position.z).length()
	var relative_height = position.y-player.position.y
	return gap<1.2 and relative_height>=0.15 and relative_height<=1.6 and touch_lock<=0.0

func control_near(player: FootballPlayer, delta: float) -> void:
	controlled = false
	if not reachable(player) or position.y>0.34 or linear_velocity.length()>player.sprint_speed+3.0:
		return
	var radial = Vector3(position.x-player.position.x,0,position.z-player.position.z)
	var contact_direction = player.facing
	if radial.length()>0.1:
		# An intermediate point on the foot circle avoids steering through the body.
		var turn = clampf(radial.normalized().signed_angle_to(player.facing,Vector3.UP),-PI/3.0,PI/3.0)
		contact_direction = radial.normalized().rotated(Vector3.UP,turn)
	var goal = player.position+contact_direction*0.72
	# Feed forward the intended step: a brief body/ball contact must not stall both.
	var target = (goal-position)*11.0+player.motion_goal
	target = target.limit_length(player.sprint_speed+4.0)
	var response = 1.0-exp(-10.0*delta)
	linear_velocity.x = lerpf(linear_velocity.x,target.x,response)
	linear_velocity.z = lerpf(linear_velocity.z,target.z,response)
	sleeping = false
	controlled = true

func kick(player: FootballPlayer, power: float, lob: bool = false) -> bool:
	if not (reachable(player) if lob else volley_reachable(player)):
		return false
	var force = clampf(power,0.0,1.0)
	var speed = lerpf(2.6,4.2,force) if lob else lerpf(5.0,15.0,force)
	linear_velocity = player.facing*speed+Vector3.UP*(lerpf(5.0,8.0,force) if lob else 0.8)
	touch_lock = 0.4
	controlled = false
	sleeping = false
	player.show_kick()
	return true

func recall(player: FootballPlayer) -> void:
	# Explicit practice control; never used by dribbling or shooting.
	pending_recall = player.global_position+player.facing*0.85+Vector3.UP*0.22
	pending_recall.y = 0.22
	touch_lock = 0.1
	roll_phase = 0.0
	controlled = false
	sleeping = false
