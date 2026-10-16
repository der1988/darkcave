extends Node3D
## Bounded pool of flattened grass marks. No marks while airborne or stationary.
const CAPACITY = 128
const LIFETIME = 6.0
var ages = PackedFloat32Array()
var instances: MultiMesh
var cursor = 0
var last_step = Vector3.ZERO
var left_foot = false
@onready var player: FootballPlayer = get_parent().get_node("Player")

func _ready() -> void:
	ages.resize(CAPACITY)
	ages.fill(LIFETIME)
	instances = MultiMesh.new()
	instances.transform_format = MultiMesh.TRANSFORM_3D
	instances.use_colors = true
	var mesh = BoxMesh.new()
	mesh.size = Vector3(0.13,0.002,0.27)
	var material = StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.vertex_color_use_as_albedo = true
	mesh.material = material
	instances.mesh = mesh
	instances.instance_count = CAPACITY
	for i in CAPACITY:
		instances.set_instance_color(i,Color(0.20,0.32,0.17,0))
	var cover = MultiMeshInstance3D.new()
	cover.multimesh = instances
	cover.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(cover)
	last_step = player.global_position

func _physics_process(delta: float) -> void:
	for i in CAPACITY:
		if ages[i]<LIFETIME:
			ages[i] = minf(LIFETIME,ages[i]+delta)
			var opacity = 0.50*(1.0-smoothstep(1.0,LIFETIME,ages[i]))
			instances.set_instance_color(i,Color(0.20,0.32,0.17,opacity))
	var position_now = player.global_position
	if not player.is_on_floor():
		last_step = position_now
		return
	var distance = Vector2(position_now.x-last_step.x,position_now.z-last_step.z).length()
	if distance<0.42:
		return
	# Explicit sandbox relocation must not draw a trail across the world.
	last_step = position_now
	if distance>1.0:
		return
	left_foot = not left_foot
	var side = player.facing.cross(Vector3.UP)*(0.11 if left_foot else -0.11)
	var mark_position = Vector3(position_now.x,0.008,position_now.z)+side
	var basis = Basis(Vector3.UP,atan2(player.facing.x,player.facing.z))
	instances.set_instance_transform(cursor,Transform3D(basis,mark_position))
	instances.set_instance_color(cursor,Color(0.20,0.32,0.17,0.50))
	ages[cursor] = 0.0
	cursor = (cursor+1)%CAPACITY
