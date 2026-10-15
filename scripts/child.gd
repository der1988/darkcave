class_name ChildCompanion
extends HumanActor

signal mode_changed

enum Mode { FOLLOW, WAIT, HAND }
@export var walk_speed: float = 2.35
@onready var agent: NavigationAgent3D = $NavigationAgent3D
@onready var danger: ChildDanger = ChildDanger.new(self)
var father: Father
var mode: Mode = Mode.FOLLOW
var route_timer: float = 0.0

# Separate thresholds prevent speed and start/stop chatter near the desired gap.
const FOLLOW_START: float = 1.45
const FOLLOW_STOP: float = 1.05
const RECOVER_START: float = 2.3
const RECOVER_STOP: float = 1.35
@export var recovery_speed: float = 3.35
var recovering: bool = false
var following: bool = false
var follow_speed: float = 0.0
var follow_heading: float = 0.0
var heading_initialized: bool = false
var follow_direction: Vector3 = Vector3.ZERO
var last_goal: Vector3 = Vector3.INF

# HAND has its own formation state; FOLLOW keeps the 0.2 controller.
const HAND_SPACING: float = 0.85
var hand_heading: float = 0.0
var hand_side: float = 1.0
var hand_speed: float = 0.0
var hand_settled: bool = false
var hand_single_file: bool = false
var hand_clear_time: float = 0.0

func _physics_process(delta: float) -> void:
	if not is_instance_valid(father):
		return
	if not active:
		drive(Vector3.ZERO, 0.0, delta)
		return
	if NavigationServer3D.map_get_iteration_id(agent.get_navigation_map()) == 0:
		return
	if danger.update(delta):
		return
	# Outside danger, waiting retains the child's own posture even at a distance.
	if mode == Mode.WAIT:
		drive(Vector3.ZERO, 0.0, delta)
		return
	crouched = father.crouched
	if mode == Mode.HAND:
		_update_hand(delta)
		return
	_update_follow(delta)

func _begin_hand() -> void:
	hand_heading = atan2(father.facing.z, father.facing.x)
	var side = Vector3(-sin(hand_heading), 0, cos(hand_heading))
	hand_side = 1.0 if (global_position - father.global_position).dot(side) >= 0.0 else -1.0
	hand_speed = Vector2(velocity.x, velocity.z).length()
	hand_settled = false
	hand_single_file = false
	hand_clear_time = 0.0

# Shared pacing is continuous, rather than switching the father abruptly to 0.4.
func hand_pace_scale() -> float:
	var gap = Vector2(global_position.x - father.global_position.x, global_position.z - father.global_position.z).length()
	return clampf(1.0 - maxf(0.0, gap - 1.05) * 0.8, 0.0, 1.0)

func _hand_slot(desired: Vector3) -> Vector3:
	var point = NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), desired)
	if Vector2(point.x - desired.x, point.z - desired.z).length() > 0.15:
		return Vector3.INF
	var query = PhysicsRayQueryParameters3D.create(father.sight_point(), point + Vector3.UP * 0.5, 1)
	return point if get_world_3d().direct_space_state.intersect_ray(query).is_empty() else Vector3.INF

func _hand_position(delta: float) -> Vector3:
	var forward = Vector3(cos(hand_heading), 0, sin(hand_heading))
	var side = Vector3(-forward.z, 0, forward.x) * hand_side
	var lateral = _hand_slot(father.global_position + side * HAND_SPACING - forward * 0.1)
	if not lateral.is_finite():
		hand_single_file = true
		hand_clear_time = 0.0
	elif hand_single_file:
		hand_clear_time += delta
		if hand_clear_time > 0.5:
			hand_single_file = false
	if not hand_single_file:
		return lateral
	var rear = _hand_slot(father.global_position - forward * 0.95)
	if rear.is_finite():
		return rear
	# If contact is obstructed, keep native routing to a projected rear slot.
	return NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), father.global_position - forward * 0.95)

func _update_hand(delta: float) -> void:
	var motion = Vector3(father.velocity.x, 0, father.velocity.z)
	if motion.length() > 0.12:
		hand_heading = lerp_angle(hand_heading, atan2(motion.z, motion.x), 1.0 - exp(-4.0 * delta))
	var goal = _hand_position(delta)
	var error = goal - global_position
	error.y = 0.0
	if motion.length() < 0.12 and error.length() < 0.18:
		hand_settled = true
	elif motion.length() > 0.12 or error.length() > 0.4:
		hand_settled = false
	if hand_settled:
		hand_speed = move_toward(hand_speed, 0.0, 4.0 * delta)
		drive(Vector3.ZERO, 0.0, delta)
		return
	# A route to the opposite side must go around the father's physical capsule.
	var offset = global_position - father.global_position
	offset.y = 0.0
	if error.length_squared() > 0.01:
		var along = clampf(-offset.dot(error) / error.length_squared(), 0.0, 1.0)
		if (offset + error * along).length() < 0.6 and offset.length() > 0.1:
			var tangent = Vector3(-offset.z, 0, offset.x).normalized()
			if tangent.dot(error) < 0.0:
				tangent = -tangent
			var detour = _hand_slot(father.global_position + (offset.normalized() + tangent).normalized() * 0.95)
			if detour.is_finite():
				goal = detour
				error = goal - global_position
				error.y = 0.0
	agent.target_desired_distance = 0.1
	route_timer -= delta
	if route_timer <= 0.0:
		if not last_goal.is_finite() or goal.distance_to(last_goal) > 0.1:
			agent.target_position = goal
			last_goal = goal
		route_timer = 0.1
	var next = agent.get_next_path_position() - global_position
	next.y = 0.0
	var desired = motion + error * 3.0
	# Follow the native path around geometry; feed-forward only on the final leg.
	if next.distance_to(error) > 0.35 or hand_single_file:
		desired = next.normalized() * (motion.length() + error.length() * 2.0)
	if error.length() < 0.1 and motion.length() < 0.12:
		desired = Vector3.ZERO
	var limit = 1.65 if crouched else 2.8
	hand_speed = move_toward(hand_speed, minf(limit, desired.length()), 4.0 * delta)
	drive(desired.normalized(), hand_speed, delta)

func _update_follow(delta: float) -> void:
	var father_motion = Vector3(father.velocity.x, 0, father.velocity.z)
	var father_speed = father_motion.length()
	if not heading_initialized:
		follow_heading = atan2(father.facing.z, father.facing.x)
		heading_initialized = true
	if father_speed > 0.15:
		follow_heading = lerp_angle(follow_heading, atan2(father_motion.z, father_motion.x), 1.0 - exp(-5.0 * delta))
	var gap = Vector2(global_position.x - father.global_position.x, global_position.z - father.global_position.z).length()
	if gap > RECOVER_START:
		recovering = true
	elif gap < RECOVER_STOP:
		recovering = false
	if not following and gap > FOLLOW_START:
		following = true
	elif following and gap < FOLLOW_STOP and father_speed < 0.15:
		following = false
	if _yield_to_father(delta):
		route_timer = 0.0
		return
	if not following:
		follow_speed = move_toward(follow_speed, 0.0, 5.0 * delta)
		drive(Vector3.ZERO, 0.0, delta)
		follow_direction = Vector3.ZERO
		return
	var goal = _accompany_position()
	agent.target_desired_distance = 0.22
	route_timer -= delta
	if route_timer <= 0.0:
		# Reuse the current route when the father is standing still.
		if not last_goal.is_finite() or goal.distance_to(last_goal) > 0.18:
			agent.target_position = goal
			last_goal = goal
		route_timer = 0.2
	var direction = agent.get_next_path_position() - global_position
	direction.y = 0.0
	if direction.length() < 0.06:
		drive(Vector3.ZERO, 0.0, delta)
		follow_speed = move_toward(follow_speed, 0.0, 5.0 * delta)
		return
	var normal_speed = maxf(walk_speed, minf(father_speed, father.walk_speed))
	var desired_speed = recovery_speed if recovering else normal_speed
	if crouched:
		desired_speed = 1.65 if recovering else maxf(1.2, minf(father_speed, father.crouch_speed))
	# Brake when approaching the slot after the father stops.
	if father_speed < 0.15:
		desired_speed = minf(desired_speed, maxf(0.5, gap - 0.65) * 2.0)
	follow_speed = move_toward(follow_speed, desired_speed, 3.0 * delta)
	var raw_direction = direction.normalized()
	follow_direction = follow_direction.lerp(raw_direction, 1.0 - exp(-10.0 * delta))
	var steering = follow_direction.normalized()
	# Do not smooth a turn through the inside corner of a wall or shelf.
	if test_move(global_transform, steering * maxf(0.3, follow_speed * delta)):
		steering = raw_direction
		follow_direction = raw_direction
	drive(steering, follow_speed, delta)

func _accompany_position() -> Vector3:
	var forward = Vector3(cos(follow_heading), 0, sin(follow_heading))
	var side = Vector3(-forward.z, 0, forward.x)
	var toward_child = global_position - father.global_position
	toward_child.y = 0.0
	var offsets = [-forward * 0.8 + side * 0.45, -forward * 0.9, -side * 0.85, forward * 0.85, toward_child.normalized() * 0.85]
	for offset in offsets:
		var desired: Vector3 = father.global_position + offset
		var candidate = NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), desired)
		if Vector2(desired.x - candidate.x, desired.z - candidate.z).length() > 0.25:
			continue
		if Vector2(candidate.x - father.global_position.x, candidate.z - father.global_position.z).length() < 0.6:
			continue
		var query = PhysicsRayQueryParameters3D.create(father.global_position + Vector3.UP * 0.6, candidate + Vector3.UP * 0.4, 1)
		if get_world_3d().direct_space_state.intersect_ray(query).is_empty():
			return candidate
	# Hold a valid position until a slot clears; never target the father's center.
	return NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), global_position)

func _reset_follow() -> void:
	recovering = false
	following = false
	follow_speed = 0.0
	follow_direction = Vector3.ZERO
	last_goal = Vector3.INF
	route_timer = 0.0

func toggle_wait() -> void:
	mode = Mode.FOLLOW if mode == Mode.WAIT else Mode.WAIT
	_reset_follow()
	mode_changed.emit()

func toggle_hand() -> bool:
	if mode == Mode.HAND:
		mode = Mode.FOLLOW
		_reset_follow()
		mode_changed.emit()
		return true
	if not is_instance_valid(father) or global_position.distance_to(father.global_position) > 1.8:
		return false
	var query = PhysicsRayQueryParameters3D.create(sight_point(), father.sight_point(), 1)
	if not get_world_3d().direct_space_state.intersect_ray(query).is_empty():
		return false
	mode = Mode.HAND
	_reset_follow()
	_begin_hand()
	mode_changed.emit()
	return true

func sight_point() -> Vector3:
	return global_position + Vector3.UP * (0.5 if crouched else 1.0)

func status_text() -> String:
	if danger.is_active():
		var reaction = "Al riparo" if danger.state == ChildDanger.State.HIDDEN else "Pericolo · Cerca riparo" if danger.state == ChildDanger.State.SEEK_COVER else "Pericolo · Fermo"
		return reaction + " · " + ["Segue quando sicuro", "Aspetta", "Mano quando sicuro"][mode]
	return ["Segue", "Aspetta", "Mano nella mano"][mode]

# A small local sidestep prevents the child blocking a narrow doorway when the
# father turns around. Native physics and the navmesh validate both alternatives.
func _yield_to_father(delta: float) -> bool:
	var offset = global_position - father.global_position
	offset.y = 0
	var father_motion = Vector3(father.velocity.x, 0, father.velocity.z)
	if offset.length() > 1.4 or offset.length() < 0.1 or father_motion.length() < 0.1:
		return false
	if father_motion.normalized().dot(offset.normalized()) < 0.7:
		return false
	var side = Vector3(-father.facing.z, 0, father.facing.x)
	for sign_value in [1.0, -1.0]:
		var direction = side * sign_value
		var desired = global_position + direction * 0.65
		var on_mesh = NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), desired)
		if Vector2(desired.x - on_mesh.x, desired.z - on_mesh.z).length() > 0.2:
			continue
		if not test_move(global_transform, direction * 0.65):
			drive(direction, 1.2 if crouched else walk_speed, delta)
			return true
	return false
