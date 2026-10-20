class_name FootballTeammateSupport
extends RefCounted
## Distinct attacking lanes plus separation; everyone keeps looking at the ball.
var clock: float = 0.0
var target = Vector3.ZERO

func direction(carrier: FootballPlayer, teammate: FootballPlayer, ball: FootballBall, delta: float, teammates: Array = [], lane: int = 0, actors: Array = []) -> Vector3:
	clock += delta
	var away = -ball.goal_center.normalized()
	var side = Vector3(-away.z,0,away.x)
	var count = maxi(1,teammates.size())
	var width = lerpf(-4.8,4.8,float(lane)/float(count-1)) if count>1 else (3.5 if (teammate.position-carrier.position).dot(side)>=0 else -3.5)
	var depth = 3.3 if count>1 and absf(width)<1.0 else 5.6
	width += sin(clock*0.9+lane*2.1)*0.55
	depth += cos(clock*0.7+lane)*0.7
	var ball_width = (ball.position-ball.goal_center).dot(side)
	width += clampf(ball_width*0.15,-0.7,0.7)
	# A nearby carrier gets his own pocket instead of being crowded by a support run.
	var carrier_width = (carrier.position-ball.goal_center).dot(side)
	var carrier_depth = (carrier.position-ball.goal_center).dot(away)
	if absf(width-carrier_width)<1.8 and absf(depth-carrier_depth)<2.0:
		depth = carrier_depth+2.4
	target = ball.goal_center+side*clampf(width,-6.3,6.3)+away*clampf(depth,1.8,11.5)
	var gap = target-teammate.position
	gap.y = 0.0
	var desired = gap.normalized()*minf(0.65,gap.length()*1.2) if gap.length()>0.2 else Vector3.ZERO
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
	return (desired+separation*1.6).limit_length(0.75)
