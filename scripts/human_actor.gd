class_name HumanActor
extends CharacterBody3D

@export var standing_height: float = 1.7
@onready var sprite: Sprite3D = $Sprite3D
@onready var body_shape: CollisionShape3D = $CollisionShape3D
var crouched: bool = false
var facing: Vector3 = Vector3.FORWARD
var moving: bool = false
var active: bool = true
var animation_time: float = 0.0

func drive(direction: Vector3, speed: float, delta: float) -> void:
	var target = direction * speed if active else Vector3.ZERO
	velocity.x = move_toward(velocity.x, target.x, 14.0 * delta)
	velocity.z = move_toward(velocity.z, target.z, 14.0 * delta)
	if not is_on_floor():
		velocity.y -= 20.0 * delta
	else:
		velocity.y = 0.0
	var previous = global_position
	move_and_slide()
	moving = Vector2(global_position.x - previous.x, global_position.z - previous.z).length() > 0.001
	if direction.length_squared() > 0.01 and active:
		facing = direction.normalized()
	update_visual(delta)

func update_visual(delta: float) -> void:
	if sprite is CharacterSprite:
		sprite.animate(self, delta, get_position_delta())
	else:
		_update_legacy_sprite(delta)
	# Each actor scene owns its capsule resource, so crouching is independent.
	var capsule = body_shape.shape as CapsuleShape3D
	capsule.height = standing_height * 0.66 if crouched else standing_height
	body_shape.position.y = capsule.height / 2.0

# The enemy keeps its existing sheet and timing.
func _update_legacy_sprite(delta: float) -> void:
	animation_time += delta * (8.0 if moving else 1.0)
	var screen = Vector2(facing.x - facing.z, facing.x + facing.z)
	var direction: int = 0
	if absf(screen.x) > absf(screen.y):
		direction = 2 if screen.x < 0 else 3
	elif screen.y < 0:
		direction = 1
	var frame: int = int(animation_time) % 2 + 1 if moving else 0
	sprite.frame = direction * 3 + frame
	sprite.scale.y = 0.72 if crouched else 1.0
	sprite.position.y = 0.76 if crouched else 1.04

func sight_point() -> Vector3:
	return global_position + Vector3.UP * (0.72 if crouched else 1.45)
