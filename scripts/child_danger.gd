class_name ChildDanger
extends RefCounted

# A small safety controller layered over the requested FOLLOW / WAIT / HAND mode.
enum State { CALM, SEEK_COVER, HIDDEN, HOLD }
const CHECK_INTERVAL: float = 0.2
const SAFE_DELAY: float = 2.0
const NEAR_ENTER: float = 2.6
const NEAR_EXIT: float = 3.4
const COVER_RADIUS: float = 3.6
const LOOK_AHEAD: float = 2.4
var child: ChildCompanion
var enemy: PatrolEnemy
var cover_points: Array[Vector3] = []
var state: State = State.CALM
var cover_goal: Vector3 = Vector3.INF
var safe_time: float = 0.0
var check_timer: float = 0.0
var speed: float = 0.0
var was_crouched: bool = false
var threat: bool = false

func _init(actor: ChildCompanion) -> void:
	child = actor

func is_active() -> bool:
	return state != State.CALM

func _enemy_present() -> bool:
	return is_instance_valid(enemy) and enemy.active

func _blocked(point: Vector3) -> bool:
	var ray = PhysicsRayQueryParameters3D.create(enemy.global_position + Vector3.UP * 1.45, point, 1)
	return not child.get_world_3d().direct_space_state.intersect_ray(ray).is_empty()

func _risky(point: Vector3, releasing: bool = false) -> bool:
	if not _enemy_present():
		return false
	var nearby = Vector2(point.x - enemy.global_position.x, point.z - enemy.global_position.z).length() < (NEAR_EXIT if releasing else NEAR_ENTER)
	return enemy.can_see_point(point) or (nearby and not _blocked(point))

func _path_to(destination: Vector3) -> PackedVector3Array:
	return NavigationServer3D.map_get_path(child.agent.get_navigation_map(), child.global_position, destination, true)

# Sample the actual native route, not a straight line through walls. The second
# component records exposure; hidden children cannot cross a cone to seek cover.
func _path_cost(path: PackedVector3Array, limit: float, releasing: bool = false, height: float = 0.5) -> Vector2:
	if path.is_empty():
		return Vector2(INF, INF)
	var length = 0.0
	var exposure = 0.0
	# The baked surface sits slightly above physical feet (voxel clearance).
	var foot_offset = path[0].y - child.global_position.y
	for index in range(1, path.size()):
		var distance = path[index - 1].distance_to(path[index])
		var steps = maxi(1, ceili(distance / 0.3))
		for step in range(1, steps + 1):
			var stride = distance / steps
			length += stride
			if length > limit:
				return Vector2(length, exposure)
			var point = path[index - 1].lerp(path[index], float(step) / steps)
			point.y += height - foot_offset
			if _risky(point, releasing):
				exposure += stride
	return Vector2(length, exposure)

func _resume_height() -> float:
	var crouch = child.father.crouched
	if child.mode == ChildCompanion.Mode.WAIT:
		crouch = was_crouched if is_active() else child.crouched
	return 0.5 if crouch else 1.0

func _route_risky(releasing: bool) -> bool:
	if child.mode == ChildCompanion.Mode.WAIT or child.global_position.distance_to(child.father.global_position) < 1.45:
		return false
	var cost = _path_cost(_path_to(child.father.global_position), LOOK_AHEAD, releasing, _resume_height())
	return is_finite(cost.x) and cost.y > 0.05

func _choose_cover() -> Vector3:
	var best = Vector3.INF
	var best_score = INF
	var exposed = _risky(child.global_position + Vector3.UP * 0.5)
	for point in cover_points:
		if child.global_position.distance_to(point) > COVER_RADIUS:
			continue
		var on_mesh = NavigationServer3D.map_get_closest_point(child.agent.get_navigation_map(), point)
		if on_mesh.distance_to(child.father.global_position) < 0.65:
			continue
		if on_mesh.distance_to(point) > 0.3 or not _blocked(on_mesh + Vector3.UP * 0.5):
			continue
		var path = _path_to(on_mesh)
		if path.is_empty() or path[-1].distance_to(on_mesh) > 0.3:
			continue
		var cost = _path_cost(path, 4.6)
		if cost.x > 4.5 or cost.y > (1.8 if exposed else 0.05):
			continue
		var score = cost.x + cost.y * 3.0
		if score < best_score:
			best_score = score
			best = on_mesh
	return best

func _assess() -> void:
	var planned_sight = child.global_position + Vector3.UP * _resume_height()
	threat = _risky(planned_sight, is_active()) or (_enemy_present() and _route_risky(is_active()))
	if not is_active() and threat:
		was_crouched = child.crouched
		state = State.HOLD
		child._reset_follow()
		child.mode_changed.emit()
	if not is_active():
		return
	if not _enemy_present():
		return
	# An existing wall/obstacle already provides cover: do not abandon it.
	if _blocked(child.global_position + Vector3.UP * 0.5):
		state = State.HIDDEN
		cover_goal = Vector3.INF
	elif not cover_goal.is_finite() or not _blocked(cover_goal + Vector3.UP * 0.5) or _path_cost(_path_to(cover_goal), 4.6).y > 1.8:
		cover_goal = _choose_cover()
		state = State.SEEK_COVER if cover_goal.is_finite() else State.HOLD
		if cover_goal.is_finite():
			child.agent.target_position = cover_goal

func _resume() -> void:
	state = State.CALM
	cover_goal = Vector3.INF
	safe_time = 0.0
	speed = 0.0
	child.crouched = was_crouched if child.mode == ChildCompanion.Mode.WAIT else child.father.crouched
	child._reset_follow()
	if child.mode == ChildCompanion.Mode.HAND:
		# A broken contact is re-established only at believable hand-taking range.
		if child.global_position.distance_to(child.father.global_position) <= 1.8 and child._hand_slot(child.global_position).is_finite():
			child._begin_hand()
		else:
			child.mode = ChildCompanion.Mode.FOLLOW
	child.mode_changed.emit()

func update(delta: float) -> bool:
	check_timer -= delta
	if check_timer <= 0.0:
		_assess()
		check_timer = CHECK_INTERVAL
	if not is_active():
		return false
	child.crouched = true
	safe_time = 0.0 if threat else safe_time + delta
	if safe_time >= SAFE_DELAY:
		_resume()
		return false
	if state == State.SEEK_COVER:
		child.agent.target_desired_distance = 0.15
		var next = child.agent.get_next_path_position() - child.global_position
		next.y = 0.0
		speed = move_toward(speed, 1.35, 4.0 * delta)
		if child.global_position.distance_to(cover_goal) > 0.2 and next.length() > 0.05:
			child.drive(next.normalized(), speed, delta)
			return true
	child.drive(Vector3.ZERO, 0.0, delta)
	return true
