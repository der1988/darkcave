class_name PrototypeGame
extends Node3D

enum Phase { PLAYING, FAILED, COMPLETE }
@onready var level: Node3D = $Level
@onready var father: Father = $Father
@onready var child: ChildCompanion = $Child
@onready var enemy: PatrolEnemy = $Enemy
@onready var rig: IsometricCameraRig = $CameraRig
@onready var noises: NoiseBus = $NoiseBus
@onready var metal_can: MetalDistraction = $Level/MetalCan
@onready var hud: PrototypeHUD = $HUD
var phase: Phase = Phase.PLAYING
var resource_collected: bool = false
var narrative: String = "«Restami vicino. Vediamo se è rimasto qualcosa.»"
var narrative_time: float = 6.0

func _ready() -> void:
	Controls.configure()
	noises.emitted.connect(enemy.hear_noise)
	father.get_node("AudioListener3D").make_current()
	father.get_node("Footsteps").bus = noises
	child.get_node("Footsteps").bus = noises
	metal_can.bus = noises
	father.child = child
	child.father = father
	child.danger.enemy = enemy
	for point in $Level/CoverPoints.get_children():
		child.danger.cover_points.append(point.global_position)
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

func interaction_target() -> Node3D:
	var selected: Node3D = $Level/Resource if not resource_collected and resource_in_reach() else null
	if metal_can.in_reach(father):
		if selected == null or father.global_position.distance_squared_to(metal_can.global_position) < father.global_position.distance_squared_to(selected.global_position):
			selected = metal_can
	return selected

func interaction_hint() -> String:
	var selected = interaction_target()
	if selected == metal_can:
		return "E · Fai cadere la lattina"
	return "E · Raccogli la bottiglia d'acqua" if selected != null else ""

func try_interact() -> bool:
	if phase != Phase.PLAYING:
		return false
	var selected = interaction_target()
	if selected == null:
		return false
	if selected == metal_can:
		return metal_can.interact(father)
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
