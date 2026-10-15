class_name PatrolEnemy
extends HumanActor

signal caught(character: HumanActor)
enum State { PATROL, CHASE, INVESTIGATE, SEARCH, RETURN }
@export var sight_distance: float = 7.0
@export var field_of_view: float = 75.0
@export var patrol_speed: float = 1.6
@export var chase_speed: float = 3.1
@export var investigate_speed: float = 2.1
@export var search_speed: float = 1.0
@export var return_speed: float = 1.4
@export var investigate_timeout: float = 6.0
@export var search_duration: float = 5.5
@export var search_pause: float = 0.65
@export var return_timeout: float = 14.0
@export var obstacle_attenuation: float = 0.55
@export var hearing_threshold: float = 0.05
@export var hearing_cooldown: float = 1.5
@export var rehear_distance: float = 1.25
@export var stronger_noise_margin: float = 0.3
@onready var agent: NavigationAgent3D = $NavigationAgent3D
var patrol_points: Array[Vector3] = []
var characters: Array[HumanActor] = []
var state: State = State.PATROL
var target: HumanActor
var last_seen: Vector3
var patrol_index: int = 0
var route_timer: float = 0.0
var state_time: float = 0.0
var travel_speed: float = 0.0
var observed_heading: Vector3 = Vector3.FORWARD
var investigation_goal: Vector3
var search_points: Array[Vector3] = []
var search_index: int = 0
var pause_time: float = 0.0
var last_heard: Vector3
var has_heard: bool = false
var investigating_sound: bool = false
var heard_source_id: int = 0
var heard_strength: float = 0.0
var hearing_left: float = 0.0
var listen_left: float = 0.0

func can_see(character: HumanActor) -> bool:
	return can_see_point(character.sight_point())

# Shared by companion safety checks so cone, range and walls agree with detection.
func can_see_point(point: Vector3) -> bool:
	var origin = global_position + Vector3.UP * 1.45
	var displacement = point - origin
	var flat = Vector3(displacement.x, 0, displacement.z)
	if flat.length() > sight_distance:
		return false
	if flat.length() > 0.75 and facing.dot(flat.normalized()) < cos(deg_to_rad(field_of_view / 2.0)):
		return false
	var query = PhysicsRayQueryParameters3D.create(origin, point, 1)
	return get_world_3d().direct_space_state.intersect_ray(query).is_empty()

func _physics_process(delta: float) -> void:
	if not active or characters.is_empty() or patrol_points.is_empty():
		drive(Vector3.ZERO, 0.0, delta)
		return
	if NavigationServer3D.map_get_iteration_id(agent.get_navigation_map()) == 0:
		return
	hearing_left = maxf(0.0, hearing_left - delta)
	var seen: HumanActor = null
	# Keep a visible target rather than switching every time both enter the cone.
	if is_instance_valid(target) and can_see(target):
		seen = target
	else:
		for character in characters:
			if can_see(character):
				seen = character
				break
	if seen != null:
		if state != State.CHASE:
			_enter_state(State.CHASE)
		target = seen
		investigating_sound = false
		listen_left = 0.0
		# This is the only write to memory: never read an unseen target's position.
		last_seen = seen.global_position
		var bearing = last_seen - global_position
		bearing.y = 0.0
		if bearing.length() > 0.1:
			observed_heading = bearing.normalized()
	elif state == State.CHASE:
		target = null
		_enter_state(State.INVESTIGATE)
	state_time += delta
	match state:
		State.PATROL:
			if _at(patrol_points[patrol_index], 0.45):
				patrol_index = (patrol_index + 1) % patrol_points.size()
			_move_to(patrol_points[patrol_index], patrol_speed, delta)
		State.CHASE:
			_move_to(last_seen, chase_speed, delta)
		State.INVESTIGATE:
			if listen_left > 0.0:
				listen_left -= delta
				_scan(delta)
			elif _at(investigation_goal) or state_time >= investigate_timeout:
				_enter_state(State.SEARCH)
				_scan(delta)
			else:
				_move_to(investigation_goal, investigate_speed, delta)
		State.SEARCH:
			_update_search(delta)
		State.RETURN:
			if _at(patrol_points[patrol_index]) or state_time >= return_timeout:
				_enter_state(State.PATROL)
			_move_to(patrol_points[patrol_index], return_speed if state == State.RETURN else patrol_speed, delta)
	_check_capture()

func _at(point: Vector3, radius: float = 0.65) -> bool:
	return Vector2(point.x - global_position.x, point.z - global_position.z).length() < radius

func _enter_state(next: State) -> void:
	state = next
	state_time = 0.0
	route_timer = 0.0
	match state:
		State.INVESTIGATE:
			investigation_goal = NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), last_heard if investigating_sound else last_seen)
		State.SEARCH:
			_build_search_points()
			search_index = 0
			pause_time = search_pause
		State.RETURN:
			patrol_index = _return_point()

func _move_to(destination: Vector3, speed: float, delta: float) -> void:
	route_timer -= delta
	if route_timer <= 0.0:
		agent.target_position = destination
		route_timer = 0.2
	var direction = agent.get_next_path_position() - global_position
	direction.y = 0.0
	travel_speed = move_toward(travel_speed, speed, 5.0 * delta)
	drive(direction.normalized(), travel_speed, delta)

func _scan(delta: float) -> void:
	# Deliberate looking pauses reuse the existing directional sprite frames.
	facing = facing.rotated(Vector3.UP, delta * 1.6).normalized()
	travel_speed = move_toward(travel_speed, 0.0, 5.0 * delta)
	drive(Vector3.ZERO, 0.0, delta)

func _reachable_path(point: Vector3) -> PackedVector3Array:
	var path = NavigationServer3D.map_get_path(agent.get_navigation_map(), global_position, point, true)
	if path.is_empty() or path[-1].distance_to(point) > 0.35:
		return PackedVector3Array()
	return path

func _path_length(path: PackedVector3Array) -> float:
	var length = 0.0
	for index in range(1, path.size()):
		length += path[index - 1].distance_to(path[index])
	return length

func _build_search_points() -> void:
	search_points.clear()
	var side = Vector3(-observed_heading.z, 0, observed_heading.x)
	for offset in [side * 1.3, observed_heading * 1.6, -side * 1.3]:
		var desired: Vector3 = (last_heard if investigating_sound else last_seen) + offset
		var point = NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), desired)
		if point.distance_to(desired) > 0.5:
			continue
		var path = _reachable_path(point)
		if not path.is_empty() and _path_length(path) <= 4.5:
			search_points.append(point)

func _update_search(delta: float) -> void:
	if state_time >= search_duration:
		_enter_state(State.RETURN)
		_scan(delta)
		return
	if pause_time > 0.0:
		pause_time -= delta
		_scan(delta)
	elif search_index < search_points.size():
		if _at(search_points[search_index]):
			search_index += 1
			pause_time = search_pause
			_scan(delta)
		else:
			_move_to(search_points[search_index], search_speed, delta)
	else:
		_scan(delta)

func _return_point() -> int:
	var best = patrol_index
	var best_length = INF
	for index in patrol_points.size():
		var point = NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), patrol_points[index])
		var path = _reachable_path(point)
		if not path.is_empty() and _path_length(path) < best_length:
			best_length = _path_length(path)
			best = index
	return best

func _check_capture() -> void:
	# Preserve physical proximity and obstruction checks in every state.
	for character in characters:
		if global_position.distance_to(character.global_position) < 0.8:
			var query = PhysicsRayQueryParameters3D.create(global_position + Vector3.UP * 0.7, character.sight_point(), 1)
			if get_world_3d().direct_space_state.intersect_ray(query).is_empty():
				caught.emit(character)
				return

# A heard origin is a snapshot, never a target reference or a visual observation.
func hear_noise(event: NoiseBus.Event) -> void:
	if not active or event.source == self or state == State.CHASE:
		return
	if NavigationServer3D.map_get_iteration_id(agent.get_navigation_map()) == 0:
		return
	var distance = global_position.distance_to(event.position)
	if distance >= event.radius:
		return
	# Vision wins even if a producer emitted before this physics tick's scan.
	for character in characters:
		if can_see(character):
			return
	var reach = event.radius
	var ray = PhysicsRayQueryParameters3D.create(sight_point(), event.position + Vector3.UP * 0.35, 1)
	if not get_world_3d().direct_space_state.intersect_ray(ray).is_empty():
		reach *= obstacle_attenuation
	var strength = 1.0 - distance / maxf(0.01, reach)
	if strength < hearing_threshold:
		return
	var source_id = event.source.get_instance_id() if is_instance_valid(event.source) else 0
	if has_heard and state in [State.INVESTIGATE, State.SEARCH]:
		var stronger = strength > heard_strength + stronger_noise_margin
		if hearing_left > 0.0 and not stronger:
			return
		if source_id == heard_source_id and event.position.distance_to(last_heard) < rehear_distance and not stronger:
			return
	last_heard = event.position
	has_heard = true
	heard_source_id = source_id # Used only for throttling; never look up the producer.
	heard_strength = strength
	hearing_left = hearing_cooldown
	investigating_sound = true
	target = null
	var bearing = event.position - global_position
	bearing.y = 0.0
	if bearing.length() > 0.1:
		observed_heading = bearing.normalized()
		facing = observed_heading
	_enter_state(State.INVESTIGATE)
	listen_left = 0.2
