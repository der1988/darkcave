class_name Controls
extends RefCounted

const BINDINGS = {
	"move_left": KEY_A, "move_right": KEY_D,
	"move_up": KEY_W, "move_down": KEY_S,
	"run": KEY_SHIFT, "crouch": KEY_CTRL,
	"interact": KEY_E, "child_wait": KEY_Q,
	"hold_hand": KEY_F, "restart": KEY_R,
	"show_controls": KEY_H,
}

# Physical keys keep WASD consistent across macOS and Windows keyboard layouts.
static func configure() -> void:
	for action in BINDINGS:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		var event = InputEventKey.new()
		event.physical_keycode = BINDINGS[action]
		if not InputMap.action_has_event(action, event):
			InputMap.action_add_event(action, event)

static func world_direction(input: Vector2) -> Vector3:
	return Vector3(input.x + input.y, 0, input.y - input.x).normalized()

static func key_label(action: String) -> String:
	return OS.get_keycode_string(BINDINGS[action])

static func help_text() -> String:
	var move = key_label("move_up") + key_label("move_left") + key_label("move_down") + key_label("move_right")
	return "%s · Movimento    %s · Corsa    %s · Accovacciati    %s · Interagisci\n%s · Segui / Aspetta    %s · Mano    Rotellina · Zoom    %s · Ricomincia alla fine    %s · Comandi" % [move, key_label("run"), key_label("crouch"), key_label("interact"), key_label("child_wait"), key_label("hold_hand"), key_label("restart"), key_label("show_controls")]
