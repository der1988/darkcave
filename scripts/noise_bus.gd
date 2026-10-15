class_name NoiseBus
extends Node

# Gameplay events are independent from audio playback, volume and browser unlock.
enum Kind { WALK, RUN, CROUCH, METAL }
class Event extends RefCounted:
	var position: Vector3
	var radius: float
	var kind: Kind
	var source: Node
	func _init(origin: Vector3, reach: float, type: Kind, producer: Node) -> void:
		position = origin
		radius = reach
		kind = type
		source = producer

signal emitted(event: Event)

func publish(origin: Vector3, radius: float, kind: Kind, source: Node) -> void:
	if radius > 0.0:
		emitted.emit(Event.new(origin, radius, kind, source))
