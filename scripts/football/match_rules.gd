extends Node
## Eleven: identity/points survive changes of actor roles between dead balls.
const START_POINTS = 11
const CONTACT_LABELS = {"foot":"piede","chest":"petto","head":"testa","heel":"tacco","bicycle":"rovesciata"}
const GOAL_COST = {"foot":1,"chest":1,"head":3,"heel":5,"bicycle":5}
var enabled: bool = true
var points = {"X":11,"Y":11,"Z":11}
var keeper_id: String = "Z"
var last_touch: String = ""
var shot_in_flight: bool = false
var rally_live: bool = false
var rally_time: float = 0.0
var resetting: bool = false
var restart_time: float = 0.0
var finished: bool = false
var winner: String = ""
var last_reason: String = ""
@onready var game = get_parent()

func start_match() -> void:
	game.cancel_charge()
	game.volley_buffer = 0.0
	game.pass_receiver = null
	points = {"X":11,"Y":11,"Z":11}
	keeper_id = "Z"
	game.get_node("Player").participant_id = "X"
	game.get_node("Teammate").participant_id = "Y"
	game.get_node("Goalkeeper").participant_id = "Z"
	finished = false
	winner = ""
	last_reason = ""
	game.feedback.text = "Servizio: S o D · poi solo al volo"
	game.feedback_time = 2.5
	game.get_node("VolleyGoal").volley_goals = 0
	game.get_node("VolleyGoal").armed = false
	resetting = false
	game.ball.freeze = false
	game.player = game.get_node("Player")
	game.teammate = game.get_node("Teammate")
	reset_positions()
	refresh_labels()

func contact_kind(actor: FootballPlayer, shot: bool) -> String:
	var relative_height = game.ball.position.y-actor.position.y
	if not shot:
		return "head" if relative_height>=1.35 else ("chest" if relative_height>=0.9 else "foot")
	var goalward = game.ball.goal_center-actor.position
	goalward.y = 0.0
	var backward = actor.facing.dot(goalward.normalized())< -0.35
	if backward and relative_height>=0.8 and not actor.is_on_floor():
		return "bicycle"
	if relative_height>=1.2:
		return "head"
	return "heel" if backward else "foot"

func can_touch(actor: FootballPlayer) -> bool:
	if not enabled:
		return true
	if finished or resetting or actor.participant_id.is_empty():
		return false
	if rally_live and (game.ball.position.y<0.36 or game.ball.bounce_age<0.08):
		fault(last_touch if not last_touch.is_empty() else actor.participant_id,"Palla a terra")
		return false
	return true

func touch(actor: FootballPlayer, kind: String, shot: bool) -> void:
	if not enabled:
		return
	last_touch = actor.participant_id
	shot_in_flight = shot
	rally_live = true
	rally_time = 0.0
	game.ball.last_contact_kind = kind
	game.ball.last_kick_volley = shot and game.ball.position.y>0.36

func goal(kind: String) -> void:
	if not enabled or resetting or finished or not rally_live or not game.ball.last_kick_volley:
		return
	var cost: int = GOAL_COST.get(kind,1)
	points[keeper_id] = maxi(0,int(points[keeper_id])-cost)
	last_reason = "GOL · %s · %s −%d" % [CONTACT_LABELS.get(kind,kind),keeper_id,cost]
	if points[keeper_id]==0:
		last_reason += " · eliminato"
		var survivors: Array = []
		for id in points:
			if points[id]>0:
				survivors.append(id)
		if survivors.size()==1:
			finished = true
			game.cancel_charge()
			game.volley_buffer = 0.0
			winner = survivors[0]
			game.ball.freeze = true
			game.feedback.text = "%s VINCE · R o Nuova partita" % winner
			game.get_node("HUD/Restart").show()
			refresh_labels()
			return
		# The scorer takes over the empty goal after an elimination.
		var successor = last_touch if last_touch in survivors else survivors[0]
		swap_keeper(successor)
	finish_rally()

func fault(id: String, reason: String) -> void:
	if not enabled or resetting or finished or id.is_empty():
		return
	last_reason = "%s · %s va in porta" % [reason,id]
	swap_keeper(id)
	finish_rally()

func swap_keeper(id: String) -> void:
	if id==keeper_id:
		return
	for actor in [game.get_node("Player"),game.get_node("Teammate")]:
		if actor.participant_id==id:
			actor.participant_id = keeper_id if points[keeper_id]>0 else ""
			break
	keeper_id = id
	game.get_node("Goalkeeper").participant_id = id

func finish_rally() -> void:
	rally_live = false
	resetting = true
	restart_time = 1.1
	game.cancel_charge()
	game.volley_buffer = 0.0
	game.pass_receiver = null
	if game.ball.held_by!=null:
		game.ball.held_by.release_ball()
	game.ball.freeze = true
	game.feedback.text = last_reason
	game.feedback_time = 1.5
	refresh_labels()

func reset_positions() -> void:
	if game.ball.held_by!=null:
		game.ball.held_by.release_ball()
	var actors = [game.get_node("Player"),game.get_node("Teammate")]
	if actors[0].participant_id.is_empty():
		actors.reverse()
	game.player = actors[0]
	game.teammate = actors[1]
	for i in 2:
		var actor = actors[i]
		actor.visible = not actor.participant_id.is_empty()
		actor.collision_layer = 16 if actor.visible else 0
		actor.position = Vector3.ZERO if i==0 else Vector3(3,0,-2)
		actor.velocity = Vector3.ZERO
		actor.controlled = i==0
		actor.charging = false
	var keeper = game.get_node("Goalkeeper")
	keeper.position = game.ball.goal_center
	keeper.velocity = Vector3.ZERO
	keeper.state = keeper.State.PROTECT
	keeper.parry_cooldown = 0.2
	game.ball.freeze = false
	game.ball.recall(game.player)
	game.pass_receiver = null
	last_touch = ""
	rally_live = false
	game.get_node("HUD/Restart").hide()

func refresh_labels() -> void:
	for actor in [game.get_node("Player"),game.get_node("Teammate"),game.get_node("Goalkeeper")]:
		var id: String = actor.participant_id
		actor.get_node("NameLabel").text = "%s · %d" % [id,points.get(id,0)] if not id.is_empty() else ""
	var scores = PackedStringArray()
	for id in points:
		scores.append("%s  %d" % [id,points[id]])
	game.get_node("HUD/Score").text = "   ".join(scores)

func _physics_process(delta: float) -> void:
	if not enabled or finished:
		return
	if resetting:
		restart_time -= delta
		if restart_time<=0.0:
			resetting = false
			reset_positions()
		return
	if not rally_live:
		return
	rally_time += delta
	var ball: FootballBall = game.ball
	var normal = -ball.goal_center.normalized()
	var side = Vector3(-normal.z,0,normal.x)
	var offset = ball.position-ball.goal_center
	if ball.held_by!=null:
		last_reason = "Parata · nuovo servizio"
		finish_rally()
	elif absf(offset.dot(side))>7.5 or offset.dot(normal)>13.0 or offset.dot(normal)< -2.0:
		fault(last_touch,"Palla fuori")
	elif rally_time>0.15 and (ball.bounce_age<0.04 or (ball.position.y<=0.24 and ball.linear_velocity.y<=0.2)) and (not shot_in_flight or (rally_time>1.0 and ball.linear_velocity.length()<0.5)):
		fault(last_touch,"Palla a terra")
