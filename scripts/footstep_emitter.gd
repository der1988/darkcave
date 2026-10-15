class_name FootstepEmitter
extends Node3D

@export var crouch_radius: float = 0.4
@export var walk_radius: float = 2.5
@export var run_radius: float = 6.0
@export var run_threshold: float = 2.9
@export var stride: float = 0.9
@export var run_stride: float = 1.25
@export var minimum_interval: float = 0.28
@onready var actor: HumanActor = get_parent()
@onready var audio: AudioStreamPlayer3D = $Audio
var bus: NoiseBus
var previous: Vector3
var distance_left: float = 0.0
var elapsed: float = 0.0

func _ready() -> void:
	previous = actor.global_position

func _physics_process(delta: float) -> void:
	var displacement = actor.global_position - previous
	previous = actor.global_position
	var distance = Vector2(displacement.x, displacement.z).length()
	elapsed += delta
	# Ignore initialization/repositioning and solver jitter; only physical travel counts.
	if not actor.active or distance > 0.5:
		distance_left = 0.0
		return
	if distance < 0.002 or not is_instance_valid(bus):
		return
	var running = distance / delta > run_threshold and not actor.crouched
	distance_left += distance
	var spacing = stride * 0.75 if actor.crouched else run_stride if running else stride
	if distance_left < spacing or elapsed < minimum_interval:
		return
	distance_left = 0.0
	elapsed = 0.0
	var kind = NoiseBus.Kind.CROUCH if actor.crouched else NoiseBus.Kind.RUN if running else NoiseBus.Kind.WALK
	var radius = crouch_radius if actor.crouched else run_radius if running else walk_radius
	bus.publish(actor.global_position, radius, kind, actor)
	audio.volume_db = -34.0 if actor.crouched else -23.0 if running else -28.0
	if actor is ChildCompanion:
		audio.volume_db -= 3.0
	# Headless runs have no speakers; AI events above are still emitted.
	if DisplayServer.get_name() != "headless":
		audio.play()
