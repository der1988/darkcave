extends Sprite3D
const DIRECTIONS = ["right","front_right","front","front_left","left","back_left","back","back_right"]
var data = JSON.parse_string(FileAccess.get_file_as_string("res://assets/football/goalkeeper.json"))
var sequence: Array = []
var elapsed: float = 0.0
var sequence_name: String = ""
var current_name: String = ""

func pose(name: String) -> void:
	current_name = "goalkeeper_"+name
	assert(data.frames.has(current_name),"Missing goalkeeper frame: "+current_name)
	frame = int(data.frames[current_name])

func animate(names: Array) -> void:
	sequence.clear()
	elapsed = 0.0
	sequence_name = str(names[0])
	for name in names:
		var animation = data.animations[name]
		for index in animation.frames.split(","):
			sequence.append({"name":animation.prefix+index,"delay":float(animation.delay)})
	update_sequence(0.0)

func update_sequence(delta: float) -> bool:
	if sequence.is_empty():
		return false
	elapsed += delta
	var time = elapsed
	for entry in sequence:
		if time<entry.delay:
			pose(entry.name)
			return true
		time -= entry.delay
	pose(sequence[-1].name)
	return false

func locomotion(facing: Vector3, phase: float, moving: bool, held: bool = false) -> void:
	sequence.clear()
	var direction = DIRECTIONS[FootballControls.orientation(facing)]
	if moving:
		pose(("run_ball_" if held else "run_")+direction+"_"+str(int(phase)%4))
	elif held:
		pose("back_ball_0" if direction.begins_with("back") else "front_ball_0")
	else:
		pose(direction+"_0")
