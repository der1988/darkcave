extends SceneTree

# Isolated visual acceptance harness. Never used by the game or Web export.
# --write-movie /tmp/father.avi --fixed-fps 60 -- --actor=father
# Five 150-frame takes: trim the first 30 settling frames from each for 2s/state.
const STATES = ["FERMO", "CAMMINATA", "CORSA", "ACCUCCIATO FERMO", "CAMMINATA FURTIVA"]
var game: PrototypeGame
var subject: HumanActor
var title: Label
var counter: int = 0
var ready_to_record: bool = false

func _initialize() -> void:
	call_deferred("setup")

func setup() -> void:
	root.content_scale_size = Vector2i(1280,720)
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	game.set_process(false)
	game.enemy.active = false
	game.enemy.set_physics_process(false)
	game.father.set_physics_process(false)
	game.child.set_physics_process(false)
	game.hud.hide()
	game.rig.set_process(false)
	game.rig.set_physics_process(false)
	var child = "--actor=child" in OS.get_cmdline_user_args()
	subject = game.child if child else game.father
	var other = game.father if child else game.child
	other.active = false
	other.position = Vector3(8, 0, 8)
	subject.position = Vector3(-8, 0, 9)
	subject.velocity = Vector3.ZERO
	subject.facing = Vector3(0.12, 0, -1).normalized()
	game.rig.camera.size = 4.0
	game.rig.position = subject.position + Vector3.UP * 0.6
	var overlay = CanvasLayer.new()
	root.add_child(overlay)
	title = Label.new()
	title.position = Vector2(36, 24)
	title.add_theme_font_size_override("font_size", 26)
	overlay.add_child(title)
	var info = Label.new()
	info.position = Vector2(36, 670)
	info.text = "0.6B · Pose su Sprite3D · Scala costante · Prova controllata, IA sospesa"
	info.add_theme_font_size_override("font_size", 18)
	overlay.add_child(info)
	# No settling frames are recorded: the same physical floor is directly below.
	ready_to_record = true
	physics_frame.connect(step)

func step() -> void:
	if not ready_to_record:
		return
	if counter >= 750:
		game.queue_free()
		quit()
		return
	var stage = counter / 150
	var child = subject is ChildCompanion
	title.text = ("FIGLIO" if child else "PADRE") + " · " + STATES[stage] + " · " + str(stage * 2) + "–" + str(stage * 2 + 2) + " s"
	subject.crouched = stage >= 3
	var speed = [0.0, 2.6, 3.35 if child else 4.2, 0.0, 1.25][stage]
	subject.drive(Vector3(0.12, 0, -1).normalized() if speed > 0 else Vector3.ZERO, speed, 1.0 / 60.0)
	game.rig.position = subject.position + Vector3.UP * 0.6
	# The other actor is parked off-camera; listen beside the demonstrated actor.
	game.father.get_node("AudioListener3D").global_position = subject.position + Vector3.UP * 1.4
	if counter in [75,225,375,525,675]:
		print("DEMO ","child" if child else "father"," ",STATES[stage]," gait=",subject.sprite.gait," speed=",Vector2(subject.velocity.x,subject.velocity.z).length()," frame=",subject.sprite.frame)
	counter += 1
