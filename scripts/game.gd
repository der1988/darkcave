class_name PrototypeGame
extends Node3D

enum Phase { PLAYING, FAILED, COMPLETE }
@onready var level: Node3D = $Level
@onready var father: Father = $Father
@onready var child: ChildCompanion = $Child
@onready var enemy: PatrolEnemy = $Enemy
@onready var rig: IsometricCameraRig = $CameraRig
@onready var hud: PrototypeHUD = $HUD
var phase: Phase = Phase.PLAYING
var resource_collected: bool = false
var narrative: String = "«Restami vicino. Vediamo se è rimasto qualcosa.»"
var narrative_time: float = 6.0

func _ready() -> void:
	Controls.configure()
	father.child = child
	child.father = father
	enemy.characters = [father, child]
	for point in $Level/Patrol.get_children():
		enemy.patrol_points.append(point.global_position)
	enemy.caught.connect(_on_caught)
	rig.target = father
	rig.global_position = father.global_position

func _unhandled_input(event: InputEvent) -> void:
	if phase != Phase.PLAYING:
		if event.is_action_pressed("restart"):
			get_tree().reload_current_scene()
		return
	if event.is_action_pressed("child_wait"):
		child.toggle_wait()
	elif event.is_action_pressed("hold_hand"):
		if not child.toggle_hand():
			narrative = "Avvicinati a tuo figlio per prendergli la mano."
			narrative_time = 2.5
	elif event.is_action_pressed("interact"):
		try_interact()

func resource_in_reach() -> bool:
	var point: Vector3 = $Level/Resource.global_position
	if father.global_position.distance_to(point) > 1.65:
		return false
	var query = PhysicsRayQueryParameters3D.create(father.sight_point(), point, 1)
	return get_world_3d().direct_space_state.intersect_ray(query).is_empty()

func try_interact() -> bool:
	if phase != Phase.PLAYING or resource_collected or not resource_in_reach():
		return false
	resource_collected = true
	$Level/Resource.hide()
	narrative = "«Una bottiglia d'acqua. Adesso andiamo, insieme.»"
	narrative_time = 5.0
	return true

func at_exit(character: Node3D) -> bool:
	var offset: Vector3 = character.global_position - $Level/Exit.global_position
	return absf(offset.x) < 1.5 and absf(offset.z) < 1.5

func _physics_process(delta: float) -> void:
	narrative_time = maxf(0.0, narrative_time - delta)
	if phase == Phase.PLAYING and resource_collected and at_exit(father) and at_exit(child):
		end_run(Phase.COMPLETE)

func _on_caught(_character: HumanActor) -> void:
	if phase == Phase.PLAYING:
		end_run(Phase.FAILED)

func end_run(result: Phase) -> void:
	phase = result
	father.active = false
	child.active = false
	enemy.active = false
