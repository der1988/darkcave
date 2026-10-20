extends Node
## Swept goal-line test, so even fast volleys cannot skip the goal plane.
var previous = Vector3.ZERO
var counted_play: int = -1
var armed: bool = false
var volley_goals: int = 0
@onready var game = get_parent()

func _ready() -> void:
	previous = game.get_node("Ball").position

func _physics_process(_delta: float) -> void:
	var ball: FootballBall = game.ball
	var center = ball.goal_center
	var normal = -center.normalized()
	var lateral = Vector3(-normal.z,0,normal.x)
	var current = ball.position
	var before = (previous-center).dot(normal)
	var after = (current-center).dot(normal)
	if ball.flight_age<0.1 and ball.last_kick_volley and (before>0.0 or after>0.0):
		armed = true
	if before>0.0 and after<=0.0 and armed and ball.held_by==null and ball.play_id!=counted_play:
		var weight = before/maxf(before-after,0.0001)
		var crossing = previous.lerp(current,weight)
		if absf((crossing-center).dot(lateral))<ball.goal_half_width-0.2 and crossing.y>=0.15 and crossing.y<=2.44:
			if ball.last_kick_volley:
				counted_play = ball.play_id
				volley_goals += 1
				game.feedback.text = "GOL AL VOLO · %d" % volley_goals
				game.feedback_time = 3.0
				game.get_node("MatchRules").goal(ball.last_contact_kind)
			armed = false
	if not ball.last_kick_volley:
		armed = false
	previous = current
