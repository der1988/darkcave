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
	assert(root.get_texture().get_image().save_png("res://screenshots/football-02/"+name+".png")==OK)

func run() -> void:
	game = load("res://scenes/football/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await ticks(60)
	await shot("01-campo-libero")
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
	game.queue_free()
	await process_frame
	quit()
