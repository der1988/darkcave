class_name Father
extends HumanActor

@export var walk_speed: float = 2.6
@export var run_speed: float = 4.2
@export var crouch_speed: float = 1.25
var child: ChildCompanion

func _physics_process(delta: float) -> void:
	crouched = Input.is_action_pressed("crouch")
	var direction = Controls.world_direction(Input.get_vector("move_left", "move_right", "move_up", "move_down"))
	var speed = crouch_speed if crouched else (run_speed if Input.is_action_pressed("run") else walk_speed)
	if is_instance_valid(child) and child.mode == ChildCompanion.Mode.HAND:
		speed = minf(speed, 2.0)
		if global_position.distance_to(child.global_position) > 1.35:
			speed = minf(speed, 0.4)
	drive(direction, speed, delta)
