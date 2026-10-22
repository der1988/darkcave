extends Node
## Quiet synthesized percussion; no downloads, music or per-frame dribbling sounds.
const RATE = 22050
var enabled: bool = false
var cooldowns: Dictionary = {}
var previous_velocity = Vector3.ZERO
var planar_peak: float = 0.0
var played: Dictionary = {}
var voices: Array[AudioStreamPlayer] = []
var sounds: Dictionary = {}
@onready var ball: FootballBall = get_parent()

func _ready() -> void:
	for kind in ["shot","pass","bounce","wall"]:
		sounds[kind] = make_sound(kind)
	for i in 4:
		var voice = AudioStreamPlayer.new()
		voice.volume_db = -13.0
		add_child(voice)
		voices.append(voice)
	ball.contact_monitor = true
	ball.max_contacts_reported = 8
	ball.body_entered.connect(on_contact)
	ball.struck.connect(on_struck)

func make_sound(kind: String) -> AudioStreamWAV:
	var duration = 0.16 if kind=="shot" else 0.10
	var bytes = PackedByteArray()
	bytes.resize(int(RATE*duration)*2)
	var rng = RandomNumberGenerator.new()
	rng.seed = 947
	var phase = 0.0
	for i in bytes.size()/2:
		var t = float(i)/RATE
		var f = (115.0 if kind=="wall" else 78.0)+90.0*exp(-t*65.0)
		phase += TAU*f/RATE
		var thump = sin(phase)*exp(-t*32.0)
		var click = rng.randf_range(-1.0,1.0)*exp(-t*105.0)*0.35
		var sample = clampf((thump+click)*minf(t*1400.0,1.0)*0.6,-1,1)
		bytes.encode_s16(i*2,int(sample*32767))
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = RATE
	stream.data = bytes
	return stream

func _physics_process(delta: float) -> void:
	for kind in cooldowns: cooldowns[kind] = maxf(0,cooldowns[kind]-delta)
	previous_velocity = ball.linear_velocity
	planar_peak = maxf(Vector2(previous_velocity.x,previous_velocity.z).length(),planar_peak-20.0*delta)

func play_effect(kind: String, strength: float) -> void:
	if not enabled or not sounds.has(kind): return
	if kind in ["bounce","wall"] and cooldowns.get(kind,0.0)>0.0: return
	var voice: AudioStreamPlayer = voices[0]
	for candidate in voices:
		if not candidate.playing:
			voice = candidate
			break
	voice.stream = sounds[kind]
	voice.volume_db = lerpf(-24.0,-12.0,clampf(strength,0,1))
	voice.pitch_scale = 0.92 if kind=="shot" else (1.15 if kind=="pass" else 1.0)
	voice.play()
	played[kind] = played.get(kind,0)+1
	cooldowns[kind] = 0.10

func on_struck(kind: String, strength: float) -> void:
	play_effect(kind,strength)

func on_contact(body: Node) -> void:
	if ball.freeze or ball.held_by!=null or ball.pending_recall.is_finite() or ball.flight_age>50.0: return
	if body.name=="Floor":
		if absf(previous_velocity.y)>1.1: play_effect("bounce",minf(absf(previous_velocity.y)/8.0,1.0))
	elif body is StaticBody3D and planar_peak>2.0:
		play_effect("wall",minf(planar_peak/18.0,1.0))

func _exit_tree() -> void:
	for voice in voices:
		if is_instance_valid(voice):
			voice.stop()
			voice.stream = null
	sounds.clear()
