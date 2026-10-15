class_name MetalDistraction
extends Node3D

@export var noise_radius: float = 8.0
@export var interaction_radius: float = 1.45
@export var landing_offset: Vector3 = Vector3(-0.35, -1.01, 0)
@onready var audio: AudioStreamPlayer3D = $Audio
var bus: NoiseBus
var used: bool = false

func in_reach(actor: HumanActor) -> bool:
	if used or actor.global_position.distance_to(global_position) > interaction_radius:
		return false
	var ray = PhysicsRayQueryParameters3D.create(actor.sight_point(), global_position, 1)
	return get_world_3d().direct_space_state.intersect_ray(ray).is_empty()

func interact(actor: HumanActor) -> bool:
	if not in_reach(actor) or not is_instance_valid(bus):
		return false
	used = true # Latch before the fall; repeated E cannot queue more impacts.
	var landing = position + landing_offset
	var tween = create_tween()
	var edge = Vector3(landing_offset.x, 0, landing_offset.z).normalized() * 0.16
	tween.tween_property(self, "position", position + edge, 0.08)
	tween.tween_property(self, "position", landing, 0.25).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.parallel().tween_property(self, "rotation:x", PI * 0.5, 0.25)
	tween.tween_callback(_impact)
	return true

func _impact() -> void:
	bus.publish(global_position, noise_radius, NoiseBus.Kind.METAL, self)
	# Headless runs have no speakers; AI events above are still emitted.
	if DisplayServer.get_name() != "headless":
		audio.play()
