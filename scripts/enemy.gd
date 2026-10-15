class_name PatrolEnemy
extends HumanActor

signal caught(character: HumanActor)
enum State { PATROL, CHASE }
@export var sight_distance: float = 7.0
@export var field_of_view: float = 75.0
@export var patrol_speed: float = 1.6
@export var chase_speed: float = 3.1
@onready var agent: NavigationAgent3D = $NavigationAgent3D
var patrol_points: Array[Vector3] = []
var characters: Array[HumanActor] = []
var state: State = State.PATROL
var target: HumanActor
var last_seen: Vector3
var patrol_index: int = 0
var route_timer: float = 0.0
var lost_time: float = 0.0

func can_see(character: HumanActor) -> bool:
	var origin = global_position + Vector3.UP * 1.45
	var displacement = character.sight_point() - origin
	var flat = Vector3(displacement.x, 0, displacement.z)
	if flat.length() > sight_distance:
		return false
	if flat.length() > 0.75 and facing.dot(flat.normalized()) < cos(deg_to_rad(field_of_view / 2.0)):
		return false
	var query = PhysicsRayQueryParameters3D.create(origin, character.sight_point(), 1)
	return get_world_3d().direct_space_state.intersect_ray(query).is_empty()

func _physics_process(delta: float) -> void:
	if not active or characters.is_empty() or patrol_points.is_empty():
		drive(Vector3.ZERO, 0.0, delta)
		return
	if NavigationServer3D.map_get_iteration_id(agent.get_navigation_map()) == 0:
		return
	var seen: HumanActor = null
	for character in characters:
		if can_see(character):
			seen = character
			break
	if seen != null:
		state = State.CHASE
		target = seen
		last_seen = seen.global_position
		lost_time = 0.0
	elif state == State.CHASE:
		lost_time += delta
		if lost_time > 2.5:
			state = State.PATROL
			target = null
	var destination = patrol_points[patrol_index] if state == State.PATROL else last_seen
	if state == State.PATROL and global_position.distance_to(destination) < 0.45:
		patrol_index = (patrol_index + 1) % patrol_points.size()
		destination = patrol_points[patrol_index]
	route_timer -= delta
	if route_timer <= 0.0:
		agent.target_position = destination
		route_timer = 0.2
	var direction = agent.get_next_path_position() - global_position
	direction.y = 0
	drive(direction.normalized(), chase_speed if state == State.CHASE else patrol_speed, delta)
	for character in characters:
		if global_position.distance_to(character.global_position) < 0.8:
			var query = PhysicsRayQueryParameters3D.create(global_position + Vector3.UP * 0.7, character.sight_point(), 1)
			if get_world_3d().direct_space_state.intersect_ray(query).is_empty():
				caught.emit(character)
				return
