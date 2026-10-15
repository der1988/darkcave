class_name ChildCompanion
extends HumanActor

signal mode_changed

enum Mode { FOLLOW, WAIT, HAND }
@export var walk_speed: float = 2.35
@onready var agent: NavigationAgent3D = $NavigationAgent3D
var father: Father
var mode: Mode = Mode.FOLLOW
var route_timer: float = 0.0

func _physics_process(delta: float) -> void:
	if not is_instance_valid(father):
		return
	crouched = father.crouched
	if not active or mode == Mode.WAIT:
		drive(Vector3.ZERO, 0.0, delta)
		return
	if NavigationServer3D.map_get_iteration_id(agent.get_navigation_map()) == 0:
		return
	if mode == Mode.FOLLOW and _yield_to_father(delta):
		return
	var gap = global_position.distance_to(father.global_position)
	var stop_distance = 0.72 if mode == Mode.HAND else 1.0
	if gap <= stop_distance:
		drive(Vector3.ZERO, 0.0, delta)
		return
	route_timer -= delta
	if route_timer <= 0.0:
		agent.target_position = father.global_position
		route_timer = 0.18
	var next = agent.get_next_path_position()
	var direction = next - global_position
	direction.y = 0
	var speed = 1.2 if crouched else walk_speed
	drive(direction.normalized(), speed, delta)

func toggle_wait() -> void:
	mode = Mode.FOLLOW if mode == Mode.WAIT else Mode.WAIT
	mode_changed.emit()

func toggle_hand() -> bool:
	if mode == Mode.HAND:
		mode = Mode.FOLLOW
		mode_changed.emit()
		return true
	if not is_instance_valid(father) or global_position.distance_to(father.global_position) > 1.8:
		return false
	var query = PhysicsRayQueryParameters3D.create(sight_point(), father.sight_point(), 1)
	if not get_world_3d().direct_space_state.intersect_ray(query).is_empty():
		return false
	mode = Mode.HAND
	mode_changed.emit()
	return true

func sight_point() -> Vector3:
	return global_position + Vector3.UP * (0.5 if crouched else 1.0)

func status_text() -> String:
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
