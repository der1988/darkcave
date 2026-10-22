class_name FootballTeamAI
extends RefCounted
## One presses; two support or cover separate lanes. Blue uses a gentler profile.
var steering = Vector3.ZERO
var action_cooldown: float = 0.0
var actions: int = 0
var tackles: int = 0
var pressure_time: float = 0.0

func step(game, actor: FootballPlayer, delta: float) -> void:
	action_cooldown = maxf(0.0,action_cooldown-delta)
	var street = actor as StreetPlayer
	if street!=null and street.is_busy():
		actor.drive(Vector3.ZERO,delta)
		return
	var ball: FootballBall = game.ball
	var attack: Vector3 = game.attack_direction(actor.team)
	var mate: FootballPlayer = game.team_outlet(actor.team,actor.position,actor)
	var holder: FootballPlayer = game.possession
	pressure_time = pressure_time+delta if holder!=null and holder.team!=actor.team else 0.0
	var gentle = actor.team==1
	var chaser = game.nearest_outfielder(ball.position,actor.team,true)
	var supports = game.team_players(actor.team).duplicate()
	supports.erase(holder if holder!=null and holder.team==actor.team else chaser)
	var lane_index = supports.find(actor)
	var lane_sign = -1.0 if lane_index%2==0 else 1.0
	if street!=null and holder!=null and holder.team!=actor.team and chaser==actor and action_cooldown<=0.0 and (not gentle or pressure_time>=1.25):
		var gap = holder.position-actor.position
		gap.y = 0.0
		if gap.length()>1.0 and gap.length()<(1.65 if gentle else 2.3) and ball.position.y<0.8 and actor.facing.dot(gap.normalized())>0.4 and street.start_slide(gap):
			action_cooldown = 4.5 if gentle else 2.2
			tackles += 1
			actor.drive(Vector3.ZERO,delta)
			return
	var target: Vector3
	if game.pass_receiver==actor:
		target = ball.position+Vector3(ball.linear_velocity.x,0,ball.linear_velocity.z)*0.22
	elif holder==actor:
		target = actor.attack_goal
		var enemy = game.nearest_outfielder(actor.position,1-actor.team)
		var pressure = enemy.position.distance_to(actor.position)<2.6
		var distance = actor.position.distance_to(actor.attack_goal)
		if action_cooldown<=0.0 and ball.touch_lock<=0.0:
			if distance<10.5 and absf(actor.position.dot(game.WIDTH))<5.3:
				var keeper = game.keepers[1-actor.team]
				var corner = -0.6 if keeper.position.dot(game.WIDTH)>0.0 else 0.6
				corner *= attack.dot(game.LENGTH)
				if ball.kick(actor,0.45+minf(distance/35.0,0.25),false,Vector2(corner,0)):
					action_cooldown = 0.9
					actions += 1
			elif pressure and mate.position.distance_to(actor.position)>3.0:
				if ball.pass_to(actor,mate.position,0.0,false):
					action_cooldown = 1.0
					actions += 1
	elif holder!=null and holder.team==actor.team:
		# Offer a diagonal ahead of the carrier; don't stand on the same passing line.
		var lane = lane_sign
		target = holder.position+attack*3.2+game.WIDTH*lane*3.8
	elif chaser==actor and (not gentle or holder==null or holder.team==actor.team or pressure_time>=0.65):
		target = ball.position+Vector3(ball.linear_velocity.x,0,ball.linear_velocity.z)*0.18
	else:
		# Second defender screens the centre, staying between ball and own goal.
		target = ball.position-attack*3.5
		target += game.WIDTH*lane_sign*2.8
		target = target.lerp(-actor.attack_goal+attack*4.0,0.22)
	target = game.clamp_to_arena(target,0.65)
	var gap = target-actor.position
	gap.y = 0.0
	var desired = gap.normalized()*minf(1.0,gap.length()*1.3) if gap.length()>0.25 else Vector3.ZERO
	for other in game.outfield:
		if other==actor: continue
		var offset: Vector3 = actor.position-other.position
		offset.y = 0.0
		if offset.length()<1.5 and offset.length()>0.01:
			desired += offset.normalized()*(1.5-offset.length())*0.65
	steering = steering.move_toward(desired.limit_length(0.78 if gentle else 1.0),(1.8 if gentle else 2.8)*delta)
	actor.look_at_ball = Vector3.INF if holder==actor else ball.position
	actor.drive(steering,delta)
