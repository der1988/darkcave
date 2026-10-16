extends SceneTree
var checks = 0
var failures = 0
var game: FootballSandbox
var ui: Control

func _initialize() -> void:
	call_deferred("run")

func ticks(count: int) -> void:
	for i in count:
		await physics_frame

func check(value: bool, label: String) -> void:
	checks += 1
	if value:
		print("PASS · ",label)
	else:
		failures += 1
		push_error("FAIL · "+label)

func touch(index: int, point: Vector2, pressed: bool) -> void:
	var event = InputEventScreenTouch.new()
	event.index = index
	event.position = point
	event.pressed = pressed
	ui._input(event)

func run() -> void:
	game = load("res://scenes/football/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	ui = game.get_node("DeviceUI/ControlMode")
	var initial_player = game.player.position
	await ticks(20)
	check(paused and ui.picker.visible and game.player.position==initial_player,"Device picker pauses simulation until a mode is selected")
	ui.choose_mode("pc")
	check(not paused and game.help.visible and not ui.picker.visible,"PC selection resumes game with keyboard help")
	ui.choose_mode("smartphone")
	check(not paused and not game.help.visible and ui.mode=="smartphone","Smartphone selection enables touch layout and hides keyboard HUD")
	touch(0,ui.stick_center+Vector2(ui.stick_radius*0.6,0),true)
	await ticks(15)
	check(game.player.position.distance_to(initial_player)>0.1,"Virtual analog stick moves the player")
	check(not Input.is_action_pressed("football_sprint"),"Inner analog travel walks")
	touch(1,ui.button_centers.shoot,true)
	await ticks(20)
	check(game.charging and game.charge_time>0.25 and ui.joystick_finger==0,"Movement and charged A work simultaneously with separate fingers")
	touch(2,ui.button_centers.shoot,true)
	touch(1,ui.button_centers.shoot,false)
	check(game.charging,"One finger releasing does not cancel another finger holding the same button")
	touch(2,ui.button_centers.shoot,false)
	check(not game.charging,"Last A release fires through the existing shot action")
	touch(0,Vector2.ZERO,false)
	check(Input.get_vector("football_left","football_right","football_up","football_down")==Vector2.ZERO,"Analog release anywhere clears movement")
	touch(3,ui.stick_center+Vector2(ui.stick_radius,0),true)
	check(Input.is_action_pressed("football_sprint"),"Outer analog travel enables running")
	touch(4,ui.button_centers.lob,true)
	await ticks(15)
	check(game.charging_lob and game.charge_time>0.15,"Touch D supports held high-pass charging")
	ui._notification(Node.NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(not game.charging and not game.charging_lob and ui.fingers.is_empty() and not Input.is_action_pressed("football_sprint"),"Focus loss clears all touches and cancels charges without firing")
	ui.size = Vector2(400,800)
	ui.update_orientation()
	check(paused and ui.rotate_panel.visible,"Portrait smartphone shows rotate prompt and pauses play")
	ui.size = Vector2(960,540)
	ui.update_orientation()
	check(not paused and not ui.rotate_panel.visible,"Returning to landscape resumes play")
	game.ball.recall(game.player)
	await ticks(30)
	touch(5,ui.button_centers.pass,true)
	check(game.pass_receiver!=null and not game.charging,"Touch S executes the existing short pass")
	touch(5,ui.button_centers.pass,false)
	ui.release_all()
	ui.choose_mode("pc")
	check(ui.fingers.is_empty() and ui.stick==Vector2.ZERO,"Switching mode cannot leave touch movement stuck")
	check(FootballControls.world_direction(Vector2(0.4,0)).length()<0.5,"World direction preserves analog movement strength")
	game.queue_free()
	await process_frame
	print("RESULT controls: ",checks-failures,"/",checks)
	quit(1 if failures else 0)
