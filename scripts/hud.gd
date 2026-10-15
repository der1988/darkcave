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

func _process(_delta: float) -> void:
	objective.text = "Raggiungi l'uscita insieme a tuo figlio." if game.resource_collected else "Trova una risorsa nel distributore."
	child_status.text = "FIGLIO · " + game.child.status_text()
	hint.text = "E · Raccogli la bottiglia d'acqua" if not game.resource_collected and game.resource_in_reach() else ""
	if game.resource_collected and game.at_exit(game.father) and not game.at_exit(game.child):
		hint.text = "Aspetta tuo figlio: dovete uscire insieme."
	narrative.text = game.narrative if game.narrative_time > 0.0 else ""
	end_panel.visible = game.phase != PrototypeGame.Phase.PLAYING
	$Margin.visible = not end_panel.visible
	$Bottom.visible = not end_panel.visible
	if end_panel.visible:
		var won = game.phase == PrototypeGame.Phase.COMPLETE
		end_title.text = "INSIEME, ANCORA" if won else "IL VIAGGIO SI INTERROMPE"
		end_text.text = ("Avete preso l'acqua e lasciato il distributore insieme." if won else "Il nemico ha raggiunto uno di voi.") + "\n\nR · Ricomincia"
