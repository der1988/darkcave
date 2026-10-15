class_name CharacterSprite
extends Sprite3D

# Baked 24x48 pixel poses, six columns per facing and one row per gait.
# Only presentation lives here: no velocity, navigation or collision writes.
enum Gait { IDLE, WALK, RUN, CROUCH_IDLE, CROUCH_WALK }
const FRAME_COUNTS = [2, 6, 6, 2, 6]
@export var child_proportions: bool = false
var gait: Gait = Gait.IDLE
var phase: float = 0.0
var idle_time: float = 0.0
var travelling: bool = false
var running: bool = false
var orientation: int = 0
var hand_pose: bool = false

func animate(actor: HumanActor, delta: float, displacement: Vector3) -> void:
	var distance = Vector2(displacement.x, displacement.z).length()
	# A reposition in a test/editor is not an animation stride.
	if distance > 0.5:
		distance = 0.0
	var speed = distance / maxf(delta, 0.0001)
	if speed > 0.12:
		travelling = true
	elif speed < 0.07:
		travelling = false
	var run_start = 2.9 if child_proportions else 3.1
	if speed > run_start:
		running = true
	elif speed < run_start - 0.3:
		running = false
	if actor.crouched:
		gait = Gait.CROUCH_WALK if travelling else Gait.CROUCH_IDLE
	else:
		gait = (Gait.RUN if running else Gait.WALK) if travelling else Gait.IDLE
	var screen = Vector2(actor.facing.x - actor.facing.z, actor.facing.x + actor.facing.z)
	if absf(screen.x) > absf(screen.y):
		orientation = 2 if screen.x < 0 else 3
	else:
		orientation = 1 if screen.y < 0 else 0
	if travelling:
		# Complete left/right cycle in metres. Children take shorter, faster steps.
		var stride = 1.5 if child_proportions else 1.8
		if gait == Gait.RUN:
			stride = 1.8 if child_proportions else 2.3
		elif gait == Gait.CROUCH_WALK:
			stride = 1.125 if child_proportions else 1.35
		phase = fposmod(phase + distance / stride, 1.0)
		idle_time = 0.0
	else:
		idle_time += delta
		phase = 0.0
	var row: int = gait
	hand_pose = _holding_hand(actor)
	if hand_pose:
		# Same lower-body poses; only the contact arm is held quietly to the side.
		row = {Gait.IDLE: 5, Gait.WALK: 6, Gait.CROUCH_IDLE: 7, Gait.CROUCH_WALK: 8}.get(gait, row)
	flip_h = false
	if hand_pose and orientation < 2:
		var partner = actor.child if actor is Father else actor.father
		var offset = partner.global_position - actor.global_position
		flip_h = offset.x - offset.z < 0.0
	var pose = int(phase * FRAME_COUNTS[gait]) if travelling else int(idle_time * 0.65) % 2
	frame = row * 24 + orientation * 6 + pose
	# All poses share a painted foot baseline; crouching never scales the body.
	scale = Vector3.ONE
	position.y = 1.04

func _holding_hand(actor: HumanActor) -> bool:
	var companion: ChildCompanion
	if actor is Father:
		companion = actor.child
	elif actor is ChildCompanion:
		companion = actor
	return is_instance_valid(companion) and companion.mode == ChildCompanion.Mode.HAND and not companion.danger.is_active() and not companion.hand_single_file and is_instance_valid(companion.father) and companion.global_position.distance_to(companion.father.global_position) < 1.3
