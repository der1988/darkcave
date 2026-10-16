extends Node3D
## Decorative ground cover only: no change to ball or character collisions.
## Twenty-five reusable world-anchored chunks keep the infinite field bounded in memory.
const CHUNK_SIZE = 16.0
var center = Vector2i(999999,999999)
var chunks: Dictionary = {}
var tuft_mesh: ArrayMesh
var stone_mesh: SphereMesh
@onready var player: Node3D = get_parent().get_node("Player")

func _ready() -> void:
	var surface = SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for blade in 5:
		var angle = blade*2.4
		var base = Vector3(cos(angle),0,sin(angle))*0.09
		var side = Vector3(cos(angle+1.57),0,sin(angle+1.57))*0.035
		var top = Vector3(0.0,0.25+blade*0.04,0)
		for point in [base-side,base+side,base+side+top,base-side,base+side+top,base-side+top]:
			surface.set_color(Color(0.18,0.32,0.23) if point.y<0.01 else Color(0.43,0.56,0.31))
			surface.add_vertex(point)
	tuft_mesh = surface.commit()
	var grass_material = StandardMaterial3D.new()
	grass_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	grass_material.vertex_color_use_as_albedo = true
	grass_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	tuft_mesh.surface_set_material(0,grass_material)
	stone_mesh = SphereMesh.new()
	stone_mesh.radius = 0.12
	stone_mesh.height = 0.14
	stone_mesh.radial_segments = 5
	stone_mesh.rings = 2
	var stone_material = StandardMaterial3D.new()
	stone_material.albedo_color = Color(0.40,0.39,0.31)
	stone_material.roughness = 1.0
	stone_mesh.material = stone_material
	_process(0.0)

func _process(_delta: float) -> void:
	var next = Vector2i(floori(player.position.x/CHUNK_SIZE),floori(player.position.z/CHUNK_SIZE))
	if next==center:
		return
	center = next
	for key in chunks.keys():
		if absi(key.x-center.x)>2 or absi(key.y-center.y)>2:
			chunks[key].queue_free()
			chunks.erase(key)
	for x in range(center.x-2,center.x+3):
		for z in range(center.y-2,center.y+3):
			var key = Vector2i(x,z)
			if not chunks.has(key):
				chunks[key] = make_chunk(key)

func make_chunk(key: Vector2i) -> Node3D:
	var chunk = Node3D.new()
	add_child(chunk)
	chunk.position = Vector3(key.x*CHUNK_SIZE,0,key.y*CHUNK_SIZE)
	var random = RandomNumberGenerator.new()
	random.seed = hash(key)
	for kind in 2:
		var instances = MultiMesh.new()
		instances.transform_format = MultiMesh.TRANSFORM_3D
		instances.mesh = tuft_mesh if kind==0 else stone_mesh
		instances.instance_count = 18 if kind==0 else 2
		for i in instances.instance_count:
			var point = Vector3(random.randf()*CHUNK_SIZE,0.01,random.randf()*CHUNK_SIZE)
			var scale_size = random.randf_range(0.55,1.55)
			var basis = Basis(Vector3.UP,random.randf()*TAU).scaled(Vector3.ONE*scale_size)
			instances.set_instance_transform(i,Transform3D(basis,point))
		var cover = MultiMeshInstance3D.new()
		cover.multimesh = instances
		cover.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		chunk.add_child(cover)
	return chunk
