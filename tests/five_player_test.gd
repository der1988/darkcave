extends SceneTree
var failures = 0
var checks = 0
func _initialize():
	call_deferred("run")
func check(value: bool, label: String):
	checks += 1
	if not value:
		failures += 1
		push_error(label)
func run():
	var game = load("res://scenes/football/eleven.tscn").instantiate()
	root.add_child(game)
	game.get_node("DeviceUI/ControlMode").choose_mode("pc")
	game.rules.enabled = false
	check(game.outfield.size()==4,"Four outfield players plus keeper")
	var colors = []
	for actor in game.outfield+[game.get_node("Goalkeeper")]:
		var kit = actor.sprite.material_override.get_shader_parameter("kit_color")
		check(kit==FootballRoster.COLORS[actor.participant_id],"Identity keeps its kit")
		check(not colors.has(kit),"Each participant has a different kit")
		colors.append(kit)
	check(colors.size()==5 and colors.count(colors[0])==1,"Five colored kits")
	var minimum = INF
	var facing_error = 0.0
	for frame in 420:
		await physics_frame
		for a in game.outfield:
			for b in game.outfield:
				if a!=b: minimum = minf(minimum,a.position.distance_to(b.position))
			if a!=game.player and frame>20:
				var look = game.ball.position-a.position
				look.y = 0
				if look.length()>0.2: facing_error = maxf(facing_error,a.facing.angle_to(look.normalized()))
	check(minimum>1.4,"Support runs avoid crowding")
	check(facing_error<0.15,"All supporting players face the ball")
	var widths = []
	var side = Vector3(-0.70710678,0,0.70710678)
	for a in game.outfield:
		widths.append(a.position.dot(side))
	widths.sort()
	check(widths[-1]-widths[0]>7.0,"Players occupy distinct court lanes")
	check(game.choose_pass_target()!=null and game.choose_pass_target()!=game.player,"Pass targets an active teammate")
	game.rules.swap_keeper("Marco")
	game.rules.refresh_labels()
	var keeper = game.get_node("Goalkeeper")
	check(keeper.participant_id=="Marco" and keeper.sprite.material_override.get_shader_parameter("kit_color")==FootballRoster.COLORS.Marco,"Keeper swaps preserve personal colors")
	game.queue_free()
	await process_frame
	print("RESULT five players: ",checks-failures,"/",checks," minimum spacing ",minimum)
	quit(1 if failures else 0)
