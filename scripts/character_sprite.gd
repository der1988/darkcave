class_name CharacterSprite
extends Sprite3D

# Supplied sheets: one texture per state, four direction rows, N frame columns.
# Only presentation lives here: no velocity, navigation or collision writes.
enum Gait { IDLE, WALK, RUN, CROUCH_IDLE, CROUCH_WALK }
const FRAME_COUNTS = [2, 6, 6, 2, 6, 2, 6]
const FPS = [4.0, 9.0, 13.0, 4.0, 6.0, 4.0, 9.0]
@export var sheets: Array[Texture2D] = []
@export var feet_y: float = 58.0
@export var child_proportions: bool = false
var animation_index: int = -1
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
		# Pack FPS at nominal speed; physical travel scales the cycle continuously.
		phase = fposmod(phase + distance / cycle_distance(), 1.0)
		idle_time = 0.0
	else:
		idle_time += delta
		phase = 0.0
	var state: int = gait
	# The pack has no crouched HAND sheets: keep the actual crouched poses.
	hand_pose = _holding_hand(actor) and not actor.crouched
	if hand_pose:
		state = 5 if gait == Gait.IDLE else 6
	flip_h = false
	if hand_pose and orientation < 2:
		var partner = actor.child if actor is Father else actor.father
		var offset = partner.global_position - actor.global_position
		flip_h = offset.x - offset.z < 0.0
	if animation_index != state:
		frame = 0
		texture = sheets[state]
		hframes = FRAME_COUNTS[state]
		vframes = 4
		animation_index = state
	var pose = int(phase * hframes) if travelling else int(idle_time * FPS[state]) % hframes
	frame = orientation * hframes + pose
	# All poses share a painted foot baseline; crouching never scales the body.
	scale = Vector3.ONE
	position.y = (feet_y - texture.get_height() / float(vframes) * 0.5 - offset.y) * pixel_size + 0.095

func cycle_distance() -> float:
	var nominal_speed = [0.0, 2.35 if child_proportions else 2.6, 3.35 if child_proportions else 4.2, 0.0, 1.2 if child_proportions else 1.25][gait]
	return nominal_speed * FRAME_COUNTS[gait] / FPS[gait]

func _holding_hand(actor: HumanActor) -> bool:
	var companion: ChildCompanion
	if actor is Father:
		companion = actor.child
	elif actor is ChildCompanion:
		companion = actor
	return is_instance_valid(companion) and companion.mode == ChildCompanion.Mode.HAND and not companion.danger.is_active() and not companion.hand_single_file and is_instance_valid(companion.father) and companion.global_position.distance_to(companion.father.global_position) < 1.3
