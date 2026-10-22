extends Node3D
## One selection shared by the preview and both pass buttons.
var selected: FootballPlayer
var carrier: FootballPlayer
@onready var game = get_parent()
@onready var marker: MeshInstance3D = $Marker

func choose(owner: FootballPlayer, actors: Array, direction: Vector3) -> FootballPlayer:
	var best: FootballPlayer
	var best_score = -INF
	var previous_score = -INF
	for actor in actors:
		if actor==owner:
			continue
		var gap: Vector3 = actor.position-owner.position
		gap.y = 0.0
		var score = direction.normalized().dot(gap.normalized())-gap.length()*0.025
		if actor==selected and owner==carrier:
			previous_score = score
		if score>best_score:
			best_score = score
			best = actor
	# Retain a nearly tied target; deliberate direction changes still win immediately.
	if previous_score>=best_score-0.07 and is_finite(previous_score):
		best = selected
	selected = best
	carrier = owner
	return selected

func _process(_delta: float) -> void:
	var target: FootballPlayer = game.choose_pass_target()
	if game.pass_receiver!=null:
		target = game.pass_receiver
	marker.visible = target!=null and not (game.rules.enabled and (game.rules.finished or game.rules.resetting))
	if marker.visible:
		global_position = target.global_position+Vector3.UP*1.9
