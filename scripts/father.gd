class_name Father
extends HumanActor

@export var walk_speed: float = 2.6
@export var run_speed: float = 4.2
@export var crouch_speed: float = 1.25
var hand_pace: float = 1.0
var child: ChildCompanion

func _physics_process(delta: float) -> void:
	crouched = Input.is_action_pressed("crouch")
	var direction = Controls.world_direction(Input.get_vector("move_left", "move_right", "move_up", "move_down"))
	var speed = crouch_speed if crouched else (run_speed if Input.is_action_pressed("run") else walk_speed)
	if is_instance_valid(child) and child.mode == ChildCompanion.Mode.HAND and not child.danger.is_active():
		speed = minf(speed, 2.0)
		hand_pace = move_toward(hand_pace, child.hand_pace_scale(), 1.8 * delta)
		speed *= hand_pace
	else:
		hand_pace = 1.0
	drive(direction, speed, delta)
