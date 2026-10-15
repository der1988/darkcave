class_name IsometricCameraRig
extends Node3D

@export var target: Node3D
@export var follow_response: float = 7.0
@export var minimum_zoom: float = 10.0
@export var maximum_zoom: float = 22.0
@onready var camera: Camera3D = $Camera3D
var desired_zoom: float = 12.5
@export var readability_targets: Array[NodePath] = []
var base_colors: Dictionary[HumanActor, Color] = {}
var obscured: Dictionary[HumanActor, bool] = {}

func _ready() -> void:
	for path in readability_targets:
		var actor = get_node(path) as HumanActor
		if actor != null:
			base_colors[actor] = actor.sprite.modulate
			obscured[actor] = false
	if is_instance_valid(target):
		global_position = target.global_position

func _process(delta: float) -> void:
	if is_instance_valid(target):
		global_position = global_position.lerp(target.global_position, 1.0 - exp(-follow_response * delta))
	camera.size = lerpf(camera.size, desired_zoom, 1.0 - exp(-10.0 * delta))
	_update_readability(delta)

func zoom_step(direction: float) -> void:
	desired_zoom = clampf(desired_zoom + direction * 1.5, minimum_zoom, maximum_zoom)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			zoom_step(-1)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			zoom_step(1)

# Presentation-only queries: do not touch collision masks, walls or enemy sight.
func _physics_process(_delta: float) -> void:
	for actor in base_colors:
		var torso = actor.global_position + Vector3.UP * (0.4 if actor.crouched else 0.7)
		var query = PhysicsRayQueryParameters3D.create(camera.global_position, torso, 1)
		obscured[actor] = not get_world_3d().direct_space_state.intersect_ray(query).is_empty()

func _update_readability(delta: float) -> void:
	for actor in base_colors:
		var sprite = actor.sprite
		var color: Color = base_colors[actor]
		if obscured[actor] and not sprite.no_depth_test:
			# Fade the small ghost in, instead of flashing a fully opaque sprite.
			sprite.modulate.a = 0.0
			sprite.no_depth_test = true
			sprite.alpha_cut = SpriteBase3D.ALPHA_CUT_DISABLED
		color.a = lerpf(sprite.modulate.a, 0.42 if obscured[actor] else 1.0, 1.0 - exp(-12.0 * delta))
		sprite.modulate = color
		if not obscured[actor] and color.a > 0.99:
			sprite.no_depth_test = false
			sprite.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
