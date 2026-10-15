class_name Controls
extends RefCounted

# Physical keys keep WASD consistent across macOS and Windows keyboard layouts.
static func configure() -> void:
	var bindings = {
		"move_left": KEY_A, "move_right": KEY_D,
		"move_up": KEY_W, "move_down": KEY_S,
		"run": KEY_SHIFT, "crouch": KEY_CTRL,
		"interact": KEY_E, "child_wait": KEY_Q,
		"hold_hand": KEY_F, "restart": KEY_R,
	}
	for action in bindings:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		var event = InputEventKey.new()
		event.physical_keycode = bindings[action]
		if not InputMap.action_has_event(action, event):
			InputMap.action_add_event(action, event)

static func world_direction(input: Vector2) -> Vector3:
	return Vector3(input.x + input.y, 0, input.y - input.x).normalized()
