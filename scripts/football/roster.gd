class_name FootballRoster
extends RefCounted
const NAMES = ["Marco","Simone","Brad","Matt","David"]
const COLORS = {
	"Marco":Color("ec4549"), "Simone":Color("448bea"),
	"Brad":Color("edc64a"), "Matt":Color("59ba73"), "David":Color("b77ee1"),
}
const KIT = preload("res://assets/football/kit.gdshader")
static func apply_kit(actor: Node3D) -> void:
	var sprite: Sprite3D = actor.get_node("Sprite3D")
	var material = ShaderMaterial.new()
	material.shader = KIT
	material.set_shader_parameter("sprite_texture",sprite.texture)
	material.set_shader_parameter("kit_color",COLORS.get(actor.participant_id,Color.WHITE))
	sprite.material_override = material
