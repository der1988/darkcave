namespace {
constexpr float room_width = 8.0f;
constexpr float room_height = 6.0f;
constexpr float margin = 0.24f;

struct Actor {
  float x;
  float y;
  float heading;
  float stride;
  float moving;
};

Actor player{};
Actor brother{};

float root(float value) {
  if (value <= 0.0f) return 0.0f;
  float result = value > 1.0f ? value : 1.0f;
  for (int i = 0; i < 7; ++i) result = 0.5f * (result + value / result);
  return result;
}

float clamp(float value, float low, float high) {
  return value < low ? low : value > high ? high : value;
}

float absolute(float value) { return value < 0.0f ? -value : value; }

float angle_of(float y, float x) {
  constexpr float half_pi = 1.57079632679f;
  constexpr float pi = 3.14159265359f;
  const float ax = absolute(x);
  const float ay = absolute(y);
  if (ax + ay < 0.00001f) return 0.0f;
  const float ratio = (ax < ay ? ax : ay) / (ax > ay ? ax : ay);
  const float square = ratio * ratio;
  float result =
      (((-0.0464964749f * square + 0.15931422f) * square - 0.327622764f) *
           square * ratio +
       ratio);
  if (ay > ax) result = half_pi - result;
  if (x < 0.0f) result = pi - result;
  return y < 0.0f ? -result : result;
}

void move(Actor& actor, float dx, float dy) {
  actor.x = clamp(actor.x + dx, margin, room_width - margin);
  actor.y = clamp(actor.y + dy, margin, room_height - margin);
}
}  // namespace

extern "C" {

__attribute__((export_name("reset"))) void reset() {
  player = {4.2f, 3.15f, -0.78f, 0.0f, 0.0f};
  brother = {3.76f, 3.47f, -0.78f, 0.0f, 0.0f};
}

__attribute__((export_name("update"))) void update(float dt, float horizontal,
                                                    float vertical, int running) {
  dt = clamp(dt, 0.0f, 0.04f);
  const float world_x = horizontal + vertical;
  const float world_y = -horizontal + vertical;
  const float input_length = root(world_x * world_x + world_y * world_y);
  player.moving = 0.0f;
  if (input_length > 0.001f) {
    const float dx = world_x / input_length;
    const float dy = world_y / input_length;
    const float speed = running ? 3.0f : 2.1f;
    const float old_x = player.x;
    const float old_y = player.y;
    move(player, dx * speed * dt, dy * speed * dt);
    const float travelled = root((player.x - old_x) * (player.x - old_x) +
                                 (player.y - old_y) * (player.y - old_y));
    if (travelled > 0.0f) {
      player.heading = angle_of(dy, dx);
      player.stride += travelled * 8.0f;
      player.moving = 1.0f;
    }
  }

  const float follow_x = player.x - brother.x;
  const float follow_y = player.y - brother.y;
  const float distance = root(follow_x * follow_x + follow_y * follow_y);
  brother.moving = 0.0f;
  constexpr float desired_gap = 0.5f;
  if (distance > desired_gap) {
    const float speed = running ? 3.2f : 2.35f;
    const float step = clamp(distance - desired_gap, 0.0f, speed * dt);
    move(brother, follow_x / distance * step, follow_y / distance * step);
    brother.heading = angle_of(follow_y, follow_x);
    brother.stride += step * 8.0f;
    brother.moving = 1.0f;
  }
}

__attribute__((export_name("player_x"))) float player_x() { return player.x; }
__attribute__((export_name("player_y"))) float player_y() { return player.y; }
__attribute__((export_name("player_heading"))) float player_heading() { return player.heading; }
__attribute__((export_name("player_stride"))) float player_stride() { return player.stride; }
__attribute__((export_name("player_moving"))) float player_moving() { return player.moving; }
__attribute__((export_name("brother_x"))) float brother_x() { return brother.x; }
__attribute__((export_name("brother_y"))) float brother_y() { return brother.y; }
__attribute__((export_name("brother_heading"))) float brother_heading() { return brother.heading; }
__attribute__((export_name("brother_stride"))) float brother_stride() { return brother.stride; }
__attribute__((export_name("brother_moving"))) float brother_moving() { return brother.moving; }
__attribute__((export_name("room_width"))) float exported_room_width() { return room_width; }
__attribute__((export_name("room_height"))) float exported_room_height() { return room_height; }

}
