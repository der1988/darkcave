extends SceneTree

# Offline, deliberately posed pixel artwork inspired by the supplied travel sheet.
# Clothing/accessories are painted into frames, never generated at runtime.
# Cell 24x48, baseline 46; rows match CharacterSprite, columns facing * 6 + pose.
const CELL = Vector2i(24, 48)
const COLORS = {
	"hair": "33342e", "hair_light": "504c40", "skin": "b1a181",
	"skin_light": "cab996", "skin_dark": "8e7d60", "beard": "48463a",
	"coat": "545249", "coat_light": "6d6959", "coat_dark": "3d403a",
	"seam": "827864", "pants": "353b39", "pants_light": "4b504a",
	"pants_dark": "272e2e", "boot": "66513b", "sole": "3e3c32",
	"scarf": "794c43", "scarf_dark": "513c37",
	"pack": "5d5443", "pack_light": "7c6d51", "pack_dark": "403d32",
	"strap": "8c7958", "hat": "4d4c42", "hat_light": "696858",
}
var palette: Dictionary = {}
var canvas: Image

func _initialize() -> void:
	for child in [false, true]:
		for key in COLORS:
			palette[key] = Color(COLORS[key])
		if child:
			palette.coat = Color("626554")
			palette.coat_light = Color("80816a")
			palette.coat_dark = Color("464d43")
			palette.seam = Color("8e8b73")
		var sheet = Image.create(576, 432, false, Image.FORMAT_RGBA8)
		for row in 9:
			for facing in 4:
				for frame in 6:
					canvas = Image.create(24, 48, false, Image.FORMAT_RGBA8)
					var gait = [0, 1, 2, 3, 4, 0, 1, 3, 4][row]
					paint_pose(child, gait, frame, facing, row >= 5)
					sheet.blit_rect(canvas, Rect2i(Vector2i.ZERO, CELL), Vector2i((facing * 6 + frame) * 24, row * 48))
		var name = "child" if child else "father"
		assert(sheet.save_png("res://assets/characters/" + name + ".png") == OK)
		print("Painted ", name, ": 4 facings, 5 gaits + contact arm variants, 24x48 cells")
	quit()

func dot(point: Vector2, color: String) -> void:
	var p = Vector2i(point.round())
	if p.x >= 0 and p.y >= 0 and p.x < 24 and p.y < 48:
		canvas.set_pixelv(p, palette[color])

func box(x: int, y: int, width: int, height: int, color: String) -> void:
	for yy in range(y, y + height):
		for xx in range(x, x + width):
			dot(Vector2(xx, yy), color)

func polygon(points: Array, color: String) -> void:
	var outline = PackedVector2Array(points)
	for y in 48:
		for x in 24:
			if Geometry2D.is_point_in_polygon(Vector2(x, y), outline):
				dot(Vector2(x, y), color)

func stroke(a: Vector2, b: Vector2, width: int, color: String) -> void:
	var count = int(maxf(absf(b.x - a.x), absf(b.y - a.y)))
	for i in range(count + 1):
		var p = a.lerp(b, float(i) / maxf(1, count)).round()
		box(int(p.x) - width / 2, int(p.y), width, 1, color)

func limb(a: Vector2, b: Vector2, c: Vector2, width: int, color: String, light: String) -> void:
	stroke(a, b, width, color)
	stroke(b, c, width, color)
	if width >= 3:
		stroke(a + Vector2(-1, 1), b + Vector2(-1, 0), 1, light)

func boot(ankle: Vector2, front: bool) -> void:
	box(int(ankle.x) - 1, int(ankle.y) - 1, 3, 2, "boot")
	box(int(ankle.x) - 1, int(ankle.y), 4 if front else 3, 2, "boot")
	box(int(ankle.x) - 1, int(ankle.y) + 1, 4 if front else 3, 1, "sole")
	dot(ankle + Vector2(0,-1), "pack_light")

func running_arm(phase: int, child: bool) -> Array[Vector2]:
	# Distinct recovery/passing poses instead of switching two elbow positions.
	var keys = [[-4,5,-2,0],[-3,5,1,3],[2,4,5,0],[4,3,6,-1],[3,4,5,1],[-1,5,1,2]][phase]
	var elbow = Vector2(keys[0],keys[1])
	var wrist = Vector2(keys[2],keys[3])
	if child:
		elbow = (elbow * 0.7).round()
		wrist = (wrist * 0.7).round()
	return [elbow,wrist]

func draw_pack(p: Vector2, child: bool, back: bool) -> void:
	var height = 7 if child else 10
	if back:
		polygon([p+Vector2(-3,1),p+Vector2(-2,0),p+Vector2(2,0),p+Vector2(3,2),p+Vector2(3,height-1),p+Vector2(-2,height)],"pack_dark")
		box(int(p.x)-2,int(p.y)+2,5,height-3,"pack")
		box(int(p.x)-2,int(p.y)+1,4,2,"pack_light")
		stroke(p+Vector2(-1,3),p+Vector2(-1,height-2),1,"strap")
		box(int(p.x),int(p.y)+height-4,2,2,"pack_dark")
		dot(p+Vector2(0,height-4),"pack_light")
	else:
		polygon([p+Vector2(-1,2),p+Vector2(1,0),p+Vector2(3,1),p+Vector2(4,3),p+Vector2(3,height),p+Vector2(-1,height-1)],"pack_dark")
		box(int(p.x),int(p.y)+2,3,height-3,"pack")
		stroke(p+Vector2(0,1),p+Vector2(2,1),2,"pack_light")
		stroke(p+Vector2(1,3),p+Vector2(1,height-2),1,"strap")
		box(int(p.x)-1,int(p.y)+height-4,2,2,"pack_light")
		dot(p+Vector2(1,3),"pack_dark")

func paint_pose(child: bool, gait: int, frame: int, facing: int, hand: bool) -> void:
	var phase = frame % 6
	var crouch = gait >= 3
	var moving = gait == 1 or gait == 2 or gait == 4
	var run = gait == 2
	var hip_y = (35 if child else 30) if not crouch else (40 if child else 38)
	var shoulder_y = (26 if child else 16) if not crouch else (33 if child else 28)
	# Contact, recoil, passing, opposite contact, opposite recoil, passing.
	var bob = [0, 1, 0, 0, 1, 0][phase] if moving else 0
	if run:
		bob = [0, 1, -1, 0, 1, -1][phase]
	var lean = (3 if child else 4) if run else (2 if child else 3) if crouch else 0
	var hip = Vector2(11, hip_y + bob)
	var shoulder = Vector2(11 + lean, shoulder_y + bob)
	if gait == 0:
		shoulder.x += 1 # A resting stoop, rather than a military straight spine.
	elif gait == 4:
		hip.x -= 1
		shoulder += Vector2(1,-1) # Cautious forward transfer, distinct from a resting squat.
	elif run:
		hip.x -= 1
	var side = facing >= 2
	# Explicitly bent joints, never a vertically compressed standing drawing.
	var knees: Array
	var ankles: Array
	if gait == 1:
		knees = [[3,8,-3,7],[1,8,-3,9],[-2,8,3,6],[-3,7,3,8],[-3,9,1,8],[3,6,-2,8]][phase]
		ankles = [[6,14,-5,13],[2,14,-6,13],[-2,14,3,10],[-5,13,6,14],[-6,13,2,14],[3,10,-2,14]][phase]
	elif run:
		knees = [[5,7,-5,4],[1,9,-5,3],[-4,6,5,2],[-5,4,5,7],[-5,3,1,9],[5,2,-4,6]][phase]
		ankles = [[8,14,-7,8],[-1,13,-7,4],[-7,8,2,8],[-7,8,8,14],[-7,4,-1,13],[2,8,-7,8]][phase]
	elif gait == 4:
		knees = [[5,0,0,2],[4,1,-1,2],[3,1,2,0],[0,2,5,0],[-1,2,4,1],[2,0,3,1]][phase]
		ankles = [[4,6,-4,6],[2,6,-4,5],[0,6,2,4],[-4,6,4,6],[-4,5,2,6],[2,4,0,6]][phase]
	elif crouch:
		knees = [5,0,-1,2]
		ankles = [2,6,-4,6]
	else:
		knees = [1,7,-2,7]
		ankles = [2,14,-2,14]
	var knee_a = Vector2(knees[0], knees[1])
	var knee_b = Vector2(knees[2], knees[3])
	var ankle_a = Vector2(ankles[0], ankles[1])
	var ankle_b = Vector2(ankles[2], ankles[3])
	if child:
		# Short child legs with its own foot timing/compact stride, larger head ratio.
		knee_a = Vector2(round(knee_a.x * 0.65), round(knee_a.y * 0.64))
		knee_b = Vector2(round(knee_b.x * 0.65), round(knee_b.y * 0.64))
		ankle_a = Vector2(round(ankle_a.x * 0.65), round(ankle_a.y * 0.64))
		ankle_b = Vector2(round(ankle_b.x * 0.65), round(ankle_b.y * 0.64))
		if crouch:
			ankle_a.y = 4
			ankle_b.y = 4 if phase != 2 else 3
		elif moving and phase in [2, 5]:
			shoulder.x += 1 # Slight unevenness, confined to painted poses.
	# Grounded stance ankle is fixed at y44; flight/swing feet remain lifted.
	var base = (9 if child else 14) if not crouch else (4 if child else 6)
	if not run or phase in [0, 3]:
		if ankle_a.y == base:
			ankle_a.y -= bob
		if ankle_b.y == base:
			ankle_b.y -= bob
	if side:
		draw_side(child, gait, phase, hand, hip, shoulder, knee_a, knee_b, ankle_a, ankle_b)
		if facing == 2:
			canvas.flip_x()
	else:
		draw_front(child, gait, phase, hand, facing == 1, hip, shoulder, knee_a, knee_b, ankle_a, ankle_b)

func draw_side(child: bool, gait: int, phase: int, hand: bool, hip: Vector2, shoulder: Vector2, ka: Vector2, kb: Vector2, aa: Vector2, ab: Vector2) -> void:
	var crouch = gait >= 3
	var run = gait == 2
	var swing = [4, 2, -2, -4, -2, 2][phase] if gait in [1, 2, 4] else 0
	var arm_length = 8 if child else 12
	var far_shoulder = shoulder + Vector2(-1, 1)
	var far_elbow = far_shoulder + Vector2(round(swing * 0.55), arm_length * 0.55)
	var far_hand = far_shoulder + Vector2(swing + 1, arm_length)
	if run:
		var opposite = running_arm((phase + 3) % 6, child)
		far_elbow = far_shoulder + opposite[0]
		far_hand = far_shoulder + opposite[1]
	elif crouch:
		far_elbow = far_shoulder + Vector2(3, 4)
		far_hand = far_elbow + Vector2(2, 2)
	limb(far_shoulder, far_elbow, far_hand, 2, "coat_dark", "coat_dark")
	box(int(far_hand.x), int(far_hand.y), 2, 2, "skin_dark")
	limb(hip + Vector2(-1, 0), hip + kb, hip + ab, 3, "pants_dark", "pants")
	boot(hip + ab, true)
	# Two separate coat tails leave the alternating legs readable.
	if not child:
		var trail = [0,1,2,1,0,1][phase] if gait in [1,2,4] else 0
		var tail = hip + Vector2(-4 - trail - (2 if run else 0), 7 if not crouch else 3)
		polygon([shoulder+Vector2(-3,4),hip+Vector2(1,-2),hip+Vector2(2,4),tail,hip+Vector2(-3,0)],"coat_dark")
		stroke(hip+Vector2(-3,-1),tail+Vector2(1,-1),1,"coat_light")
	draw_pack(shoulder + Vector2(-6,2), child, false)
	# A shaped coat, with an imperfect shoulder and visible elbow separation.
	polygon([shoulder + Vector2(-3,0), shoulder + Vector2(1,-1), shoulder + Vector2(3,3), hip + Vector2(3,1), hip + Vector2(-3,1), shoulder + Vector2(-4,5)], "coat")
	stroke(shoulder + Vector2(-2, 2), hip + Vector2(-2, -2), 1, "coat_light")
	stroke(shoulder + Vector2(2, 4), hip + Vector2(2, 0), 1, "coat_dark")
	stroke(shoulder + Vector2(-2,0),hip+Vector2(-1,-4),1,"strap")
	box(int(hip.x),int(hip.y)-4,2,2,"coat_dark")
	dot(hip+Vector2(1,-4),"seam")
	if not child:
		polygon([hip+Vector2(0,-1),hip+Vector2(3,1),hip+Vector2(2,7 if not crouch else 4),hip+Vector2(-1,3)],"coat")
	limb(hip, hip + ka, hip + aa, 3, "pants", "pants_light")
	boot(hip + aa, true)
	var elbow = shoulder + Vector2(round(-swing * 0.55), arm_length * 0.55)
	var wrist = shoulder + Vector2(-swing - 1, arm_length)
	if run:
		var arm = running_arm(phase, child)
		elbow = shoulder + arm[0]
		wrist = shoulder + arm[1]
	elif crouch:
		if gait == 4:
			elbow = shoulder + Vector2(-2, 5 if not child else 3)
			wrist = elbow + Vector2(4, -3)
		else:
			elbow = shoulder + Vector2(2, 6 if not child else 3)
			wrist = elbow + Vector2(1, 3 if not child else 2)
	if hand:
		elbow = shoulder + Vector2(-2, 6 if not child else 3)
		wrist = elbow + Vector2(4, 2 if not child else -1)
	limb(shoulder, elbow, wrist, 3, "coat", "coat_light")
	stroke(wrist+Vector2(-1,-1),wrist+Vector2(1,-1),1,"seam")
	box(int(wrist.x) - 1, int(wrist.y), 2, 2, "skin")
	var head = shoulder + Vector2(-1, -8 if not child else -7)
	if gait == 0 and phase % 2 == 1:
		dot(shoulder + Vector2(2, 3), "coat_light")
	draw_head(head, child, false, true)
	if child:
		stroke(shoulder + Vector2(-2,-1), shoulder + Vector2(2,0), 2, "scarf")
		stroke(shoulder + Vector2(2,0), shoulder + Vector2(3,4), 2, "scarf_dark")
		if run:
			stroke(shoulder+Vector2(-2,0),shoulder+Vector2(-7,-1+(phase%3)),2,"scarf")
	else:
		dot(shoulder + Vector2(2,3), "skin_dark")
		dot(shoulder + Vector2(2,7), "skin_dark")

func draw_head(p: Vector2, child: bool, back: bool, side: bool) -> void:
	var x = int(p.x)
	var y = int(p.y)
	box(x-2, y, 5, 6 if child else 7, "skin")
	box(x-2, y-1, 5, 3, "hair")
	box(x-1, y-1, 3, 1, "hair_light")
	if back:
		box(x-2, y+1, 5, 4, "hair")
		dot(Vector2(x+2,y+4), "skin_dark")
	else:
		box(x-2, y+2, 2 if side else 1, 2, "hair")
		if side:
			dot(Vector2(x+3,y+3), "skin_light")
			dot(Vector2(x+2,y+2), "hair")
		else:
			dot(Vector2(x-1,y+3), "beard")
			dot(Vector2(x+2,y+3), "beard")
		if not child:
			box(x, y+5, 3, 2, "beard")
	box(x-1, y+(6 if child else 7), 3, 2, "skin_dark")
	if child:
		# A small knitted cap, with a rounded crown and a separate folded band.
		box(x-1,y-1,3,1,"hat")
		box(x-2,y,5,2,"hat")
		box(x-3,y+1,6,2,"hat")
		box(x-2,y+2,4,1,"hat_light")
		dot(Vector2(x-1,y),"hat_light")
		dot(Vector2(x+2,y+1),"hat_light")
	elif not back:
		dot(Vector2(x-2,y+5),"beard")
		dot(Vector2(x-1,y+6),"beard")
		dot(Vector2(x-1,y+3),"skin_dark")

func draw_front(child: bool, gait: int, phase: int, hand: bool, back: bool, hip: Vector2, shoulder: Vector2, ka: Vector2, kb: Vector2, aa: Vector2, ab: Vector2) -> void:
	var crouch = gait >= 3
	var run = gait == 2
	# Front/back projection retains alternating bent knees and foot lifts.
	var knee_a = Vector2(hip.x + 2 + round(ka.x * 0.25), hip.y + ka.y)
	var knee_b = Vector2(hip.x - 2 + round(kb.x * 0.25), hip.y + kb.y)
	var ankle_a = Vector2(hip.x + 2 + round(aa.x * 0.2), hip.y + aa.y)
	var ankle_b = Vector2(hip.x - 2 + round(ab.x * 0.2), hip.y + ab.y)
	limb(hip + Vector2(-2,0), knee_b, ankle_b, 3, "pants_dark", "pants")
	boot(ankle_b, false)
	limb(hip + Vector2(2,0), knee_a, ankle_a, 3, "pants", "pants_light")
	boot(ankle_a, false)
	shoulder.x = 11
	# The long coat divides over the legs; it is not a solid skirt over the stride.
	if not child:
		var hem = 8 if not crouch else 4
		polygon([hip+Vector2(-3,-2),hip+Vector2(0,1),hip+Vector2(-1,hem),hip+Vector2(-4,hem-1)],"coat_dark")
		polygon([hip+Vector2(0,1),hip+Vector2(3,-2),hip+Vector2(4,hem-1),hip+Vector2(1,hem)],"coat")
	box(int(shoulder.x)-5,int(shoulder.y)+3,2,5 if child else 8,"pack_dark")
	box(int(shoulder.x)+4,int(shoulder.y)+3,2,5 if child else 8,"pack")
	polygon([shoulder + Vector2(-3,0), shoulder + Vector2(3,0), shoulder + Vector2(4,4), hip + Vector2(3,1), hip + Vector2(-3,1), shoulder + Vector2(-4,4)], "coat")
	stroke(shoulder+Vector2(-2,2), hip+Vector2(-2,-1),1,"coat_light")
	if not back:
		stroke(shoulder+Vector2(1,2),hip+Vector2(1,-1),1,"coat_dark")
		stroke(shoulder+Vector2(-2,1),hip+Vector2(-2,-3),1,"strap")
		stroke(shoulder+Vector2(2,1),hip+Vector2(2,-3),1,"pack_dark")
		box(int(hip.x)+1,int(hip.y)-3,2,2,"coat_dark")
	else:
		draw_pack(shoulder+Vector2(0,2),child,true)
	var swing = [2,1,-2,-2,-1,2][phase] if gait in [1,2,4] else 0
	var length = 7 if child else 12
	for sign_value in [-1,1]:
		var start = shoulder + Vector2(sign_value*4,1)
		var elbow = start + Vector2(sign_value, length * 0.5)
		var wrist = start + Vector2(0, length + sign_value*swing)
		if run:
			elbow += Vector2(sign_value, 0)
			var arm = running_arm(phase if sign_value == 1 else (phase+3)%6,child)
			wrist = elbow + Vector2(-sign_value,arm[1].y-3)
		elif crouch:
			elbow = start+Vector2(sign_value,4)
			wrist = elbow+Vector2(-sign_value*2,-2)
		if hand and sign_value == 1:
			elbow = start+Vector2(2,4 if not child else 2)
			wrist = elbow+Vector2(3,3 if not child else -1)
		limb(start,elbow,wrist,2,"coat_dark" if sign_value == -1 else "coat","coat_light")
		box(int(wrist.x),int(wrist.y),2,2,"skin_dark" if back else "skin")
	draw_head(shoulder+Vector2(0,-7 if child else -8),child,back,false)
	if child:
		stroke(shoulder+Vector2(-2,0),shoulder+Vector2(2,0),2,"scarf_dark" if back else "scarf")
		if not back:
			stroke(shoulder+Vector2(1,1),shoulder+Vector2(1,4),2,"scarf")
		else:
			stroke(shoulder+Vector2(-2,0),shoulder+Vector2(-3,3),1,"scarf")
	elif not back:
		dot(shoulder+Vector2(1,4),"skin_dark")
		dot(shoulder+Vector2(1,8),"skin_dark")
	if gait in [0,3] and phase%2 == 1:
		dot(shoulder+Vector2(2,3),"coat_light")
