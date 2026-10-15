class_name IsometricCameraRig
extends Node3D

@export var target: Node3D
@export var follow_response: float = 7.0
@export var minimum_zoom: float = 10.0
@export var maximum_zoom: float = 22.0
@onready var camera: Camera3D = $Camera3D
var desired_zoom: float = 16.0

func _ready() -> void:
	if is_instance_valid(target):
		global_position = target.global_position

func _process(delta: float) -> void:
	if is_instance_valid(target):
		global_position = global_position.lerp(target.global_position, 1.0 - exp(-follow_response * delta))
	camera.size = lerpf(camera.size, desired_zoom, 1.0 - exp(-10.0 * delta))

func zoom_step(direction: float) -> void:
	desired_zoom = clampf(desired_zoom + direction * 1.5, minimum_zoom, maximum_zoom)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			zoom_step(-1)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			zoom_step(1)
