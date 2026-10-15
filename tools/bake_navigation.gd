extends SceneTree

func _initialize() -> void:
	call_deferred("bake")

func bake() -> void:
	var scene = load("res://scenes/environment/station.tscn").instantiate()
	root.add_child(scene)
	await physics_frame
	var region: NavigationRegion3D = scene.get_node("NavigationRegion3D")
	region.bake_navigation_mesh(false)
	var result = ResourceSaver.save(region.navigation_mesh, "res://scenes/environment/navigation.tres")
	print("Navigation bake: ", region.navigation_mesh.get_polygon_count(), " polygons, save=", result)
	var success = result == OK and region.navigation_mesh.get_polygon_count() > 0
	scene.queue_free()
	await process_frame
	quit(0 if success else 1)
