extends Node
## Street football: all goals count, rebounds remain live, first to five wins.
const WIN_SCORE = 5
var enabled: bool = true
var finished: bool = false
var resetting: bool = false
var rally_live: bool = false
var shot_in_flight: bool = false
var last_touch: String = ""
var scores = [0,0]
var kickoff_team: int = 0
var restart_time: float = 0.0
var previous = Vector3.ZERO
@onready var game = get_parent()

func start_match() -> void:
	scores = [0,0]
	finished = false
	resetting = false
	kickoff_team = 0
	game.get_node("HUD/Restart").hide()
	reset_positions()
	update_score()

func can_touch(actor: FootballPlayer, _shot: bool = false) -> bool:
	return not resetting and not finished and not actor.participant_id.is_empty() and actor.can_play_ball()

func contact_kind(actor: FootballPlayer, _shot: bool) -> String:
	return "head" if game.ball.position.y-actor.position.y>=1.2 else "foot"

func touch(actor: FootballPlayer, kind: String, shot: bool) -> void:
	last_touch = actor.participant_id
	game.ball.last_contact_kind = kind
	shot_in_flight = shot
	rally_live = true

func score_goal(team: int) -> void:
	if resetting or finished or not enabled: return
	scores[team] += 1
	kickoff_team = 1-team
	game.cancel_charge()
	game.pass_receiver = null
	game.volley_buffer = 0.0
	if game.ball.held_by!=null: game.ball.held_by.release_ball()
	game.ball.freeze = true
	finished = scores[team]>=WIN_SCORE
	resetting = not finished
	restart_time = 1.5
	game.feedback.text = ("ROSSI" if team==0 else "BLU")+(" VINCONO!" if finished else " · GOL!")
	game.feedback_time = 1.5
	if finished: game.get_node("HUD/Restart").show()
	update_score()

func update_score() -> void:
	game.get_node("HUD/Score").text = "ROSSI  %d   —   %d  BLU" % scores

func reset_positions() -> void:
	if game.ball.held_by!=null: game.ball.held_by.release_ball()
	game.cancel_charge()
	game.volley_buffer = 0.0
	game.pass_receiver = null
	game.possession = null
	game.ai_plans.clear()
	game.slide_press = false
	for actor in game.outfield:
		actor.reset_action()
		var sign_value = 1.0 if actor.team==0 else -1.0
		var index = game.team_players(actor.team).find(actor)
		var lane = 0.0 if index==0 else (3.5 if index==1 else -3.5)
		actor.position = game.LENGTH*(-sign_value*(2.0 if index==0 else 5.0))+game.WIDTH*lane*sign_value
		actor.velocity = Vector3.ZERO
		actor.facing = game.attack_direction(actor.team)
	for keeper in game.keepers:
		keeper.position = keeper.center+keeper.forward*0.5
		keeper.velocity = Vector3.ZERO
		keeper.state = keeper.State.PROTECT
		keeper.state_time = 0.0
		keeper.parry_cooldown = 0.3
	game.set_controlled(game.team_players(0)[0])
	var server: FootballPlayer = game.team_players(kickoff_team)[0]
	server.position = -game.attack_direction(kickoff_team)*0.9
	game.ball.freeze = false
	game.ball.sprite.show()
	game.ball.recall(server)
	game.ball.touch_lock = 0.3
	previous = server.position+server.facing*0.85+Vector3.UP*0.22
	last_touch = ""
	rally_live = false
	shot_in_flight = false
	game.switch_cooldown = 1.0
	game.feedback.text = "Calcio d'inizio · "+("rossi" if kickoff_team==0 else "blu")
	game.feedback_time = 1.5

func _physics_process(delta: float) -> void:
	if not enabled or finished: return
	if resetting:
		restart_time -= delta
		if restart_time<=0.0:
			resetting = false
			reset_positions()
		return
	var current: Vector3 = game.ball.position
	for team in 2:
		var sign_value = 1.0 if team==0 else -1.0
		# Whole ball must cross the goal line, through the real post/bar opening.
		var before = previous.dot(game.LENGTH)*sign_value
		var after = current.dot(game.LENGTH)*sign_value
		if before<=12.2 and after>12.2 and game.ball.held_by==null:
			var crossing = previous.lerp(current,(12.2-before)/maxf(after-before,0.00001))
			if absf(crossing.dot(game.WIDTH))<2.2 and crossing.y>=0.15 and crossing.y<2.24:
				score_goal(team)
				break
	# Safety only for engine escapes above the enclosure; ordinary side rebounds stay live.
	if current.y< -3.0 or absf(current.dot(game.LENGTH))>18.0 or absf(current.dot(game.WIDTH))>12.0:
		reset_positions()
	previous = current
