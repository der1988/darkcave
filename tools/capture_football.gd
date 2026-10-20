extends SceneTree

# Native visual check; the same input/physics path is used as ordinary gameplay.
var game: FootballSandbox

func _initialize() -> void:
	call_deferred("run")

func ticks(count: int) -> void:
	for i in count:
		await physics_frame

func shot(name: String) -> void:
	await RenderingServer.frame_post_draw
	assert(root.get_texture().get_image().save_png("res://screenshots/football-17/"+name+".png")==OK)

func run() -> void:
	game = load("res://scenes/football/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await shot("00-scelta-controlli")
	game.get_node("DeviceUI/ControlMode").choose_mode("smartphone")
	await process_frame
	await shot("00-comandi-touch")
	game.get_node("DeviceUI/ControlMode").choose_mode("pc")
	await ticks(60)
	await shot("01-campo-libero")
	var short_pass = InputEventAction.new()
	short_pass.action = "football_pass"
	short_pass.pressed = true
	game._unhandled_input(short_pass)
	await ticks(100)
	await shot("02-ricezione-compagno")
	game.attempt_pass(0.65,true)
	await ticks(25)
	await shot("03-passaggio-alto")
	await ticks(180)
	game.ball.recall(game.player)
	await ticks(30)
	Input.action_press("football_down")
	await ticks(90)
	Input.action_release("football_down")
	await shot("02-palla-al-piede")
	await ticks(30)
	game.attempt_kick(0.35,true)
	await ticks(30)
	await shot("03-pallonetto")
	await ticks(90)
	game.ball.recall(game.player)
	await ticks(30)
	Input.action_press("football_right")
	await ticks(120)
	Input.action_release("football_right")
	await ticks(30)
	game.player.jump()
	await ticks(14)
	await shot("04-salto")
	await ticks(106)
	game.ball.recall(game.player)
	await ticks(30)
	game.player.facing = FootballControls.world_direction(Vector2.DOWN)
	game.ball.recall(game.player)
	await ticks(30)
	game.attempt_kick(0.35,true)
	var charge = InputEventAction.new()
	charge.action = "football_shoot"
	charge.pressed = true
	game._unhandled_input(charge)
	Input.action_press("football_down")
	await ticks(24)
	game.player.jump()
	await ticks(16)
	Input.action_release("football_down")
	charge.pressed = false
	game._unhandled_input(charge)
	await ticks(1)
	await shot("05-tiro-al-volo")
	var keeper = game.get_node("Goalkeeper")
	game.player.position = Vector3.ZERO
	game.player.velocity = Vector3.ZERO
	keeper.position = keeper.center
	keeper.state = keeper.State.PROTECT
	keeper.parry_cooldown = 0.0
	game.ball.pending_recall = keeper.center+keeper.lateral*1.7+keeper.forward*6.0+Vector3.UP*0.3
	await ticks(2)
	game.ball.linear_velocity = -keeper.forward*24.0
	game.ball.flight_age = 1.0
	await ticks(6)
	await shot("06-tuffo-basso")
	await ticks(100)
	keeper.position = keeper.center
	keeper.state = keeper.State.PROTECT
	keeper.velocity = Vector3.ZERO
	game.ball.pending_recall = keeper.center+keeper.lateral*1.7+keeper.forward*4.0+Vector3.UP*2.0
	await ticks(2)
	game.ball.linear_velocity = -keeper.forward*22.0
	game.ball.flight_age = 1.0
	keeper.choose_dive()
	await ticks(4)
	await shot("07-tuffo-alto")
	game.queue_free()
	await process_frame
	quit()
