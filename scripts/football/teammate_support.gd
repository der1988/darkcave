class_name FootballTeammateSupport
extends RefCounted
## Small supporting runs around the carrier; all movement still uses collisions.
var clock: float = 0.0
var next_run: float = 0.0
var target = Vector3.ZERO
var carrier_id: int = 0

func direction(carrier: FootballPlayer, teammate: FootballPlayer, ball: FootballBall, delta: float) -> Vector3:
	clock += delta
	if carrier.get_instance_id()!=carrier_id or clock>=next_run or carrier.position.distance_to(target)>7.0:
		carrier_id = carrier.get_instance_id()
		next_run = clock+1.6
		var forward = ball.goal_center-carrier.position
		forward.y = 0.0
		forward = forward.normalized()
		var side = Vector3(-forward.z,0,forward.x)
		var sign_side = 1.0 if (teammate.position-carrier.position).dot(side)>=0.0 else -1.0
		target = carrier.position+side*sign_side*(3.4+sin(clock*1.7)*0.9)+forward*(0.7+cos(clock*1.3)*1.2)
		# Stay in front of the tree goal rather than running through the keeper.
		var away = -ball.goal_center.normalized()
		var depth = (target-ball.goal_center).dot(away)
		target += away*(clampf(depth,1.6,11.8)-depth)
		var width_axis = Vector3(-away.z,0,away.x)
		var width = (target-ball.goal_center).dot(width_axis)
		target += width_axis*(clampf(width,-6.3,6.3)-width)
	var gap = target-teammate.position
	gap.y = 0.0
	return gap.normalized()*minf(0.65,gap.length()*1.5) if gap.length()>0.25 else Vector3.ZERO
