extends Control
## Device selection and multi-touch controls. Routes actions through the existing input map.
@export var mobile_walk_scale: float = 0.85
@export var stick_response: float = 1.35
var mode: String = ""
var fingers: Dictionary = {}
var joystick_finger: int = -1
var stick = Vector2.ZERO
var stick_center = Vector2.ZERO
var stick_radius: float = 58.0
var button_centers: Dictionary = {}
var action_radius: float = 35.0
var last_portrait: bool = false
var picker: VBoxContainer
var rotate_panel: VBoxContainer
@onready var game = get_parent().get_parent()

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	get_tree().paused = true
	picker = make_panel("CAMPO LIBERO", "Scegli come giocare")
	add_choice(picker,"PC · Tastiera",func(): choose_mode("pc"))
	add_choice(picker,"SMARTPHONE · Touch",func(): choose_mode("smartphone"))
	rotate_panel = make_panel("RUOTA IL TELEFONO", "Gioca in orizzontale per vedere campo e comandi.")
	add_choice(rotate_panel,"Schermo intero",request_mobile_screen)
	rotate_panel.hide()
	resized.connect(layout)
	layout()

func make_panel(title: String, description: String) -> VBoxContainer:
	var panel = VBoxContainer.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.offset_left = -220
	panel.offset_right = 220
	panel.offset_top = -120
	panel.offset_bottom = 120
	panel.add_theme_constant_override("separation",18)
	for text_value in [title,description]:
		var label = Label.new()
		label.text = text_value
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.add_theme_font_size_override("font_size",22 if text_value==title else 15)
		panel.add_child(label)
	add_child(panel)
	return panel

func add_choice(panel: VBoxContainer, text_value: String, callback: Callable) -> void:
	var button = Button.new()
	button.text = text_value
	button.custom_minimum_size = Vector2(0,56)
	button.pressed.connect(callback)
	panel.add_child(button)

func choose_mode(value: String) -> void:
	if value!="pc" and value!="smartphone":
		return
	release_all()
	mode = value
	picker.hide()
	game.help.visible = mode=="pc"
	if mode=="smartphone":
		game.feedback.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
		game.feedback.offset_left = 24
		game.feedback.offset_right = -24
		game.feedback.offset_top = 80
		game.feedback.offset_bottom = 108
		game.feedback.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	else:
		game.feedback.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
		game.feedback.offset_left = 24
		game.feedback.offset_right = -24
		game.feedback.offset_top = -104
		game.feedback.offset_bottom = -78
		game.feedback.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	if mode=="smartphone":
		request_mobile_screen()
	update_orientation()
	queue_redraw()

func request_mobile_screen() -> void:
	if DisplayServer.get_name()=="headless":
		return
	if OS.has_feature("web"):
		JavaScriptBridge.eval("""(function(){
 const root=document.documentElement;
 const lock=()=>{if(screen.orientation&&screen.orientation.lock){screen.orientation.lock('landscape').catch(()=>{});}};
 if(!document.fullscreenElement&&root.requestFullscreen){root.requestFullscreen().then(lock).catch(()=>{});}else{lock();}
 })();""",true)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
		if OS.has_feature("mobile"):
			DisplayServer.screen_set_orientation(DisplayServer.SCREEN_LANDSCAPE)

func layout() -> void:
	var panel_scale = maxf(1.15,minf(2.0,size.y/maxf(size.x,1.0)))
	for panel in [picker,rotate_panel]:
		if is_instance_valid(panel):
			panel.pivot_offset = Vector2(220,120)
			panel.scale = Vector2.ONE*panel_scale
	stick_radius = clampf(size.y*0.135,45.0,66.0)
	action_radius = clampf(size.y*0.075,28.0,38.0)
	stick_center = Vector2(stick_radius+30,size.y-stick_radius-32)
	button_centers = {
		"shoot":Vector2(size.x-65,size.y-145),
		"pass":Vector2(size.x-145,size.y-70),
		"lob":Vector2(size.x-60,size.y-60),
	}
	queue_redraw()

func update_orientation() -> void:
	var portrait = mode=="smartphone" and size.y>size.x
	if portrait and not last_portrait:
		release_all()
	last_portrait = portrait
	rotate_panel.visible = portrait
	get_tree().paused = mode.is_empty() or portrait

func _process(_delta: float) -> void:
	if not mode.is_empty():
		update_orientation()

func _draw() -> void:
	if mode.is_empty() or last_portrait:
		draw_rect(Rect2(Vector2.ZERO,size),Color(0.025,0.055,0.035,0.94))
		return
	if mode!="smartphone":
		return
	draw_circle(stick_center,stick_radius,Color(0.04,0.09,0.05,0.48))
	draw_arc(stick_center,stick_radius,0,TAU,32,Color(0.8,0.9,0.75,0.55),2)
	draw_circle(stick_center+stick*stick_radius*0.6,stick_radius*0.38,Color(0.8,0.9,0.75,0.65))
	var font = ThemeDB.fallback_font
	for action in button_centers:
		var center: Vector2 = button_centers[action]
		var pressed = fingers.values().has(action)
		draw_circle(center,action_radius,Color(0.8,0.9,0.75,0.65) if pressed else Color(0.04,0.09,0.05,0.60))
		draw_arc(center,action_radius,0,TAU,24,Color(0.8,0.9,0.75,0.75),2)
		var text_value = OS.get_keycode_string(FootballControls.KEYS[action][0])
		draw_string(font,center+Vector2(-8,8),text_value,HORIZONTAL_ALIGNMENT_LEFT,-1,24,Color.WHITE)

func _input(event: InputEvent) -> void:
	if mode!="smartphone" or last_portrait:
		return
	if event is InputEventScreenTouch:
		if event.pressed:
			begin_touch(event.index,event.position)
		else:
			end_touch(event.index)
		get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag:
		if event.index==joystick_finger:
			move_stick(event.position)
		get_viewport().set_input_as_handled()

func begin_touch(index: int, point: Vector2) -> void:
	if fingers.has(index):
		return
	if joystick_finger<0 and point.distance_to(stick_center)<stick_radius*1.5:
		joystick_finger = index
		fingers[index] = "stick"
		move_stick(point)
		return
	for action in button_centers:
		if point.distance_to(button_centers[action])<=action_radius*1.3:
			var already_held = fingers.values().has(action)
			fingers[index] = action
			if not already_held:
				send_action(action,true)
			queue_redraw()
			return

func move_stick(point: Vector2) -> void:
	stick = ((point-stick_center)/stick_radius).limit_length(1.0)
	if stick.length()<0.16:
		stick = Vector2.ZERO
	var strength = pow(clampf((stick.length()-0.16)/0.84,0.0,1.0),stick_response)*mobile_walk_scale
	var movement = stick.normalized()*strength
	for pair in [["left",-movement.x],["right",movement.x],["up",-movement.y],["down",movement.y]]:
		if pair[1]>0.0:
			Input.action_press("football_"+pair[0],pair[1])
		else:
			Input.action_release("football_"+pair[0])
	# Touch movement stays in a gradual walking range; no automatic sprint jump.
	Input.action_release("football_sprint")
	queue_redraw()

func end_touch(index: int) -> void:
	if not fingers.has(index):
		return
	var action: String = fingers[index]
	fingers.erase(index)
	if action=="stick":
		joystick_finger = -1
		move_stick(stick_center)
	elif not fingers.values().has(action):
		send_action(action,false)
	queue_redraw()

func send_action(action: String, pressed: bool) -> void:
	var event = InputEventAction.new()
	event.action = "football_"+action
	event.pressed = pressed
	game._unhandled_input(event)

func release_all() -> void:
	# Cancel before releasing: losing focus must not shoot accidentally.
	if is_instance_valid(game.player):
		game.cancel_charge()
		game.volley_buffer = 0.0
	fingers.clear()
	joystick_finger = -1
	stick = Vector2.ZERO
	for action in ["left","right","up","down","sprint"]:
		Input.action_release("football_"+action)
	queue_redraw()

func _notification(what: int) -> void:
	if what==NOTIFICATION_APPLICATION_FOCUS_OUT and is_instance_valid(game):
		release_all()
