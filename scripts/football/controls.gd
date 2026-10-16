class_name FootballControls
extends RefCounted

const KEYS = {
	"left": [KEY_A,KEY_LEFT], "right": [KEY_D,KEY_RIGHT],
	"up": [KEY_W,KEY_UP], "down": [KEY_S,KEY_DOWN],
	"sprint": [KEY_SHIFT], "shoot": [KEY_SPACE], "lob": [KEY_E],
	"recall": [KEY_R], "help": [KEY_H],
}

static func configure() -> void:
	for name in KEYS:
		var action = "football_"+name
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for key in KEYS[name]:
			var event = InputEventKey.new()
			event.physical_keycode = key
			if not InputMap.action_has_event(action,event):
				InputMap.action_add_event(action,event)

static func world_direction(input: Vector2) -> Vector3:
	return Vector3(input.x+input.y,0,input.y-input.x).normalized()

static func screen_direction(direction: Vector3) -> Vector2:
	return Vector2(direction.x-direction.z,(direction.x+direction.z)*0.5773503)

static func orientation(direction: Vector3) -> int:
	var projected = screen_direction(direction)
	return posmod(roundi(projected.angle()/(PI/4.0)),8)

static func help_text() -> String:
	return "WASD / Frecce · Muovi    %s · Scatta    %s · Carica e tira\n%s · Pallonetto    %s · Richiama palla    %s · Comandi    Rotellina · Zoom" % [OS.get_keycode_string(KEYS.sprint[0]),OS.get_keycode_string(KEYS.shoot[0]),OS.get_keycode_string(KEYS.lob[0]),OS.get_keycode_string(KEYS.recall[0]),OS.get_keycode_string(KEYS.help[0])]
