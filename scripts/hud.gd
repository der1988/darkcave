class_name PrototypeHUD
extends CanvasLayer

@onready var objective: Label = $Margin/VBox/Objective
@onready var child_status: Label = $Margin/VBox/ChildStatus
@onready var hint: Label = $Bottom/Hint
@onready var narrative: Label = $Bottom/Narrative
@onready var end_panel: PanelContainer = $EndPanel
@onready var end_title: Label = $EndPanel/Margin/VBox/Title
@onready var end_text: Label = $EndPanel/Margin/VBox/Description
@onready var game: PrototypeGame = get_parent()

@onready var controls_label: Label = $Controls
@export var controls_seconds: float = 7.0
var controls_left: float = 0.0

func _ready() -> void:
	controls_label.text = Controls.help_text()
	$ControlsHint.text = Controls.key_label("show_controls") + " · Comandi"
	controls_left = controls_seconds

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("show_controls") and not event.is_echo() and game.phase == PrototypeGame.Phase.PLAYING:
		controls_left = 0.0 if controls_left > 0.0 else controls_seconds
		get_viewport().set_input_as_handled()

func _process(delta: float) -> void:
	controls_left = maxf(0.0, controls_left - delta)
	controls_label.visible = controls_left > 0.0 and game.phase == PrototypeGame.Phase.PLAYING
	controls_label.modulate.a = minf(0.8, controls_left / 0.6)
	$ControlsHint.visible = not controls_label.visible and game.phase == PrototypeGame.Phase.PLAYING
	objective.text = "Raggiungi l'uscita insieme a tuo figlio." if game.resource_collected else "Trova una risorsa nel distributore."
	child_status.text = "FIGLIO · " + game.child.status_text()
	hint.text = game.interaction_hint()
	if game.resource_collected and game.at_exit(game.father) and not game.at_exit(game.child):
		hint.text = "Aspetta tuo figlio: dovete uscire insieme."
	narrative.text = game.narrative if game.narrative_time > 0.0 else ""
	narrative.visible = not narrative.text.is_empty()
	hint.visible = not hint.text.is_empty()
	end_panel.visible = game.phase != PrototypeGame.Phase.PLAYING
	$Margin.visible = not end_panel.visible
	$Bottom.visible = not end_panel.visible
	if end_panel.visible:
		var won = game.phase == PrototypeGame.Phase.COMPLETE
		end_title.text = "INSIEME, ANCORA" if won else "IL VIAGGIO SI INTERROMPE"
		end_text.text = ("Avete preso l'acqua e lasciato il distributore insieme." if won else "Il nemico ha raggiunto uno di voi.") + "\n\nR · Ricomincia"
