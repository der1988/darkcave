class_name FootballTeammateSupport
extends RefCounted
## Distinct attacking lanes plus separation; everyone keeps looking at the ball.
var clock: float = 0.0
var target = Vector3.ZERO
var steering = Vector3.ZERO
var initialized: bool = false
var moving: bool = false

func direction(carrier: FootballPlayer, teammate: FootballPlayer, ball: FootballBall, delta: float, teammates: Array = [], lane: int = 0, actors: Array = []) -> Vector3:
	clock += delta
	var away = -ball.goal_center.normalized()
	var side = Vector3(-away.z,0,away.x)
	var count = maxi(1,teammates.size())
	var width = lerpf(-4.8,4.8,float(lane)/float(count-1)) if count>1 else (3.5 if (teammate.position-carrier.position).dot(side)>=0 else -3.5)
	var depth = 3.3 if count>1 and absf(width)<1.0 else 5.6
	width += sin(clock*0.55+lane*2.1)*0.9
	depth += cos(clock*0.65+lane*1.7)*1.1
	var ball_offset = ball.position-ball.goal_center
	var ball_width = ball_offset.dot(side)
	depth += clampf((ball_offset.dot(away)-5.5)*0.3,-0.8,1.5)
	width += clampf(ball_width*0.15,-0.7,0.7)
	# A nearby carrier gets his own pocket instead of being crowded by a support run.
	var carrier_width = (carrier.position-ball.goal_center).dot(side)
	var carrier_depth = (carrier.position-ball.goal_center).dot(away)
	if absf(width-carrier_width)<1.8 and absf(depth-carrier_depth)<2.0:
		depth = carrier_depth+2.4
	var destination = ball.goal_center+side*clampf(width,-6.3,6.3)+away*clampf(depth,1.8,11.5)
	target = target.move_toward(destination,1.8*delta) if initialized else destination
	initialized = true
	var gap = target-teammate.position
	gap.y = 0.0
	if gap.length()>0.7:
		moving = true
	elif gap.length()<0.25:
		moving = false
	var desired = gap.normalized()*minf(0.65,gap.length()*0.8) if moving else Vector3.ZERO
	var separation = Vector3.ZERO
	for other in actors:
		if other==teammate:
			continue
		var offset = teammate.position-other.position
		offset.y = 0.0
		var distance = offset.length()
		if distance<2.3:
			var push = offset/distance if distance>0.01 else side*(1.0 if teammate.get_instance_id()>other.get_instance_id() else -1.0)
			separation += push*(2.3-distance)/2.3
	steering = steering.move_toward((desired+separation*1.6).limit_length(0.75),1.8*delta)
	return steering
