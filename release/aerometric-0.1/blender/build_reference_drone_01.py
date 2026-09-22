"""Build AEROMETRIC Reference Drone 01 entirely from Blender primitives.

Run: blender -b --factory-startup --python build_reference_drone_01.py -- <package-dir>
No external meshes, images, fonts, textures, or linked libraries are loaded.
"""

import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector


PACKAGE = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
PACKAGE.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
    for block in list(datablocks):
        if block.users == 0:
            datablocks.remove(block)


def rgba(value):
    value = value.lstrip("#")
    channels = [int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)]
    return tuple(channel / 12.92 if channel <= 0.04045 else
                 ((channel + 0.055) / 1.055) ** 2.4 for channel in channels) + (1,)


def material(name, color, metallic=0.0, roughness=0.55, emission=None, strength=0.0):
    result = bpy.data.materials.new(name)
    result.diffuse_color = rgba(color)
    result.use_nodes = True
    principled = result.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = rgba(color)
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    if emission:
        principled.inputs["Emission Color"].default_value = rgba(emission)
        principled.inputs["Emission Strength"].default_value = strength
    return result


MAT = {
    "body": material("MAT_Body_Main", "#AFBFBD", 0.22, 0.42),
    "cover": material("MAT_TopCover", "#DFE5E0", 0.12, 0.48),
    "arms": material("MAT_Arms", "#333C40", 0.42, 0.40),
    "motors": material("MAT_Motors", "#546068", 0.58, 0.35),
    "rotors": material("MAT_Rotors", "#222C31", 0.18, 0.52),
    "gear": material("MAT_LandingGear", "#555F61", 0.38, 0.48),
    "gimbal": material("MAT_Gimbal", "#677375", 0.34, 0.43),
    "camera": material("MAT_Camera", "#414C52", 0.35, 0.40),
    "lens": material("MAT_Lens", "#101F2D", 0.15, 0.18),
    "accent": material("MAT_Accent", "#C4783D", 0.31, 0.41),
    "recess": material("MAT_LightRecess", "#151F22", 0.10, 0.75),
    "led": material("MAT_StatusLight", "#2C454A", 0.0, 0.65, "#4CBCD2", 1.5),
}


def empty(name, parent=None, location=(0, 0, 0), role=None, position=None, extra=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    obj.location = location
    if role:
        data = {"role": role}
        if position:
            data["position"] = position
        if extra:
            data.update(extra)
        obj["aerometric"] = data
    return obj


def tag(obj, role=None, position=None, light=False, light_role=None):
    if role:
        data = {"role": role}
        if position:
            data["position"] = position
        obj["aerometric"] = data
    if light:
        obj["status_light"] = True
        obj["light_fixture"] = True
        obj["light_role"] = light_role or "motor"
    return obj


def finish(obj, name, mat, parent=None, location=(0, 0, 0), bevel=0.0):
    obj.name = name
    obj.data.name = f"GEO_{name}"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("Soft machined edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        modifier.affect = "EDGES"
        normal = obj.modifiers.new("Weighted face normals", "WEIGHTED_NORMAL")
        normal.keep_sharp = True
    if parent:
        obj.parent = parent
    obj.location = location
    return obj


def box(name, dimensions, mat, parent, location, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.scale = dimensions
    return finish(obj, name, mat, parent, location, bevel)


def cylinder(name, radius, depth, mat, parent, location, vertices=24, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth)
    return finish(bpy.context.object, name, mat, parent, location, bevel)


def tube(name, start, end, radius, mat, parent, vertices=12):
    start, end = Vector(start), Vector(end)
    obj = cylinder(name, radius, (end - start).length, mat, parent, (start + end) / 2, vertices)
    obj.rotation_euler = (end - start).to_track_quat("Z", "Y").to_euler()
    return obj


def mesh(name, vertices, faces, mat, parent, bevel=0.0):
    data = bpy.data.meshes.new(f"GEO_{name}")
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    obj.parent = parent
    if bevel:
        modifier = obj.modifiers.new("Machined edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        modifier.affect = "EDGES"
    return obj


PROFILE_ID = "aerometric-reference-drone-01"
ROOT = empty("DRONE_ROOT", role="root", extra={
    "profile": PROFILE_ID,
    "forwardAxis": "-Z",
    "capabilities": {
        "partColors": True, "partVisibility": True, "rotorControl": True,
        "gimbalControl": True, "statusLights": True, "statusField": True,
    },
})

# Distinct octagonal shell: a compact survey platform, not a V3 fuselage copy.
stations = [(-0.145, 0.050, 0.027, -0.028), (-0.105, 0.100, 0.042, -0.040),
            (0.065, 0.099, 0.042, -0.040), (0.135, 0.067, 0.031, -0.028),
            (0.161, 0.037, 0.022, -0.020)]
vertices = []
for y, width, top, bottom in stations:
    vertices.extend([(width * 0.72, y, top), (width, y, top - 0.012),
                     (width, y, bottom + 0.012), (width * 0.72, y, bottom),
                     (-width * 0.72, y, bottom), (-width, y, bottom + 0.012),
                     (-width, y, top - 0.012), (-width * 0.72, y, top)])
faces = [tuple(reversed(range(8)))]
for section in range(len(stations) - 1):
    for index in range(8):
        next_index = (index + 1) % 8
        faces.append((section * 8 + index, section * 8 + next_index,
                      (section + 1) * 8 + next_index, (section + 1) * 8 + index))
faces.append(tuple((len(stations) - 1) * 8 + index for index in range(8)))
body = mesh("Body_Main", vertices, faces, MAT["body"], ROOT, 0.0014)
tag(body, "body")

cover = box("Body_TopCover", (0.137, 0.188, 0.009), MAT["cover"], ROOT,
            (0, -0.007, 0.047), 0.004)
tag(cover, "topCover")
box("Cover_Latch", (0.024, 0.016, 0.004), MAT["accent"], ROOT,
    (0, -0.073, 0.054), 0.002)
belly = box("Belly_Plate", (0.120, 0.198, 0.008), MAT["body"], ROOT,
            (0, -0.005, -0.044), 0.003)
tag(belly, "body")

positions = [
    ("FL", "front-left", -1, 1), ("FR", "front-right", 1, 1),
    ("RL", "rear-left", -1, -1), ("RR", "rear-right", 1, -1),
]
rotor_roles = {"FL": "rotor.frontLeft", "FR": "rotor.frontRight",
               "RL": "rotor.rearLeft", "RR": "rotor.rearRight"}
light_roles = {"FL": "light.motorFrontLeft", "FR": "light.motorFrontRight",
               "RL": "light.motorRearLeft", "RR": "light.motorRearRight"}


def arc(name, radius, z_bottom, z_top, center_angle, angle_width, mat, parent):
    sections = 14
    vertices = []
    for index in range(sections + 1):
        angle = center_angle - angle_width / 2 + angle_width * index / sections
        for z in (z_bottom, z_top):
            vertices.append((radius * math.cos(angle), radius * math.sin(angle), z))
    faces = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(sections)]
    return mesh(name, vertices, faces, mat, parent)


def blade(name, parent, angle):
    # A simple tapered asymmetric blade, authored here as vertices.
    local = [(0.011, -0.009, 0), (0.034, -0.015, 0.002),
             (0.078, -0.011, 0.003), (0.095, -0.004, 0.002),
             (0.091, 0.006, 0), (0.055, 0.013, -0.001),
             (0.018, 0.011, 0)]
    c, s = math.cos(angle), math.sin(angle)
    top = [(x * c - y * s, x * s + y * c, z) for x, y, z in local]
    bottom = [(x, y, z - 0.0025) for x, y, z in top]
    points = top + bottom
    count = len(top)
    sides = [(i, (i + 1) % count, (i + 1) % count + count, i + count)
             for i in range(count)]
    return mesh(name, points, [tuple(range(count)),
                               tuple(reversed(range(count, count * 2))), *sides],
                MAT["rotors"], parent, 0.0008)


for code, direction, side, fore in positions:
    arm = empty(f"ARM_{code}", ROOT, role="arms", position=direction)
    start = (side * 0.074, fore * 0.076, 0.001)
    end = (side * 0.246, fore * 0.221, 0.012)
    tube(f"Arm_Tube_{code}", start, end, 0.014, MAT["arms"], arm, 16)
    shoulder = tube(f"Arm_Shoulder_{code}", start,
                    (side * 0.111, fore * 0.104, 0.002), 0.023,
                    MAT["arms"], arm, 12)
    motor = empty(f"MOTOR_{code}", ROOT, end)
    housing = cylinder(f"Motor_Housing_{code}", 0.030, 0.047,
                       MAT["motors"], motor, (0, 0, 0.006), 24, 0.002)
    tag(housing, "motors", direction)
    cap = cylinder(f"Motor_Cap_{code}", 0.026, 0.006, MAT["motors"], motor,
                   (0, 0, 0.033), 24, 0.001)
    tag(cap, "motors", direction)
    cylinder(f"Motor_Accent_{code}", 0.028, 0.003, MAT["accent"], motor,
             (0, 0, 0.025), 24)
    center_angle = math.atan2(fore, side)
    arc(f"MotorLight_Recess_{code}", 0.0306, -0.0100, -0.0030,
        center_angle, math.radians(128), MAT["recess"], motor)
    led = arc(f"StatusLight_{code}", 0.0310, -0.0089, -0.0041,
              center_angle, math.radians(116), MAT["led"], motor)
    tag(led, light_roles[code], direction, True, "motor")
    rotor = empty(f"ROTOR_{code}", motor, (0, 0, 0.041),
                  role="rotor", position=direction,
                  extra={"axis": "+Y", "direction": 1 if code in ("FL", "RR") else -1})
    rotor["spin_axis"] = "+Y"
    rotor["spin_direction"] = 1 if code in ("FL", "RR") else -1
    cylinder(f"Rotor_Hub_{code}", 0.014, 0.009, MAT["rotors"], rotor,
             (0, 0, 0), 20, 0.001)
    blade(f"Rotor_Blade_A_{code}", rotor, 0)
    blade(f"Rotor_Blade_B_{code}", rotor, math.pi)

gear = empty("LANDING_GEAR", ROOT, role="landingGear")
for side, label in [(-1, "L"), (1, "R")]:
    for fore, endpoint in [(-1, -0.083), (1, 0.086)]:
        tube(f"Gear_Strut_{label}_{'F' if fore > 0 else 'R'}",
             (side * 0.063, endpoint, -0.039),
             (side * 0.104, endpoint, -0.126), 0.006,
             MAT["gear"], gear, 10)
    tube(f"Gear_Skid_{label}", (side * 0.104, -0.130, -0.130),
         (side * 0.104, 0.132, -0.130), 0.008, MAT["gear"], gear, 12)

gimbal = empty("GIMBAL_ROOT", ROOT, (0, 0.123, -0.050), role="gimbal")
yaw = empty("Gimbal_Yaw", gimbal, (0, 0, -0.013), role="gimbal.yaw",
            extra={"axis": "+Y"})
cylinder("Gimbal_Yaw_Collar", 0.024, 0.017, MAT["gimbal"], yaw,
         (0, 0, 0), 20, 0.001)
pitch = empty("Gimbal_Pitch", yaw, (0, 0.012, -0.029),
              role="gimbal.pitch", extra={"axis": "+X"})
for side, label in [(-1, "L"), (1, "R")]:
    box(f"Gimbal_Yoke_{label}", (0.008, 0.041, 0.039), MAT["gimbal"], pitch,
        (side * 0.029, 0.002, 0), 0.002)
camera = box("Camera_Main", (0.050, 0.053, 0.039), MAT["camera"], pitch,
             (0, 0.020, -0.001), 0.006)
tag(camera, "camera")
lens = cylinder("Camera_Lens", 0.014, 0.016, MAT["lens"], camera,
                (0, 0.034, 0), 24, 0.001)
lens.rotation_euler[0] = -math.pi / 2
cylinder("Camera_Lens_Glass", 0.009, 0.0015, MAT["lens"], camera,
         (0, 0.043, 0), 24).rotation_euler[0] = -math.pi / 2

for side, suffix, semantic in [(-1, "L", "left"), (1, "R", "right")]:
    recess = box(f"FrontLight_Recess_{suffix}", (0.047, 0.006, 0.008),
                 MAT["recess"], ROOT, (side * 0.050, 0.147, 0.013), 0.002)
    recess.rotation_euler[2] = side * math.radians(18)
    led = box(f"FrontLight_Diffuser_{suffix}", (0.039, 0.0065, 0.0035),
              MAT["led"], ROOT, (side * 0.050, 0.151, 0.013), 0.0015)
    led.rotation_euler[2] = side * math.radians(18)
    tag(led, "light.frontLeft" if side < 0 else "light.frontRight",
        semantic, True, "front")

profile = {
    "id": PROFILE_ID,
    "version": "0.1.0",
    "label": "AEROMETRIC Reference Drone 01",
    "units": "meter",
    "forwardAxis": "-Z",
    "roles": {
        "root": ["DRONE_ROOT"],
        "body": ["Body_Main", "Belly_Plate"],
        "topCover": ["Body_TopCover"],
        "arms": [f"ARM_{code}" for code, *_ in positions],
        "motors": [f"Motor_Housing_{code}" for code, *_ in positions] +
                  [f"Motor_Cap_{code}" for code, *_ in positions],
        "rotor.frontLeft": ["ROTOR_FL"],
        "rotor.frontRight": ["ROTOR_FR"],
        "rotor.rearLeft": ["ROTOR_RL"],
        "rotor.rearRight": ["ROTOR_RR"],
        "landingGear": ["LANDING_GEAR"],
        "gimbal": ["GIMBAL_ROOT"],
        "gimbal.yaw": ["Gimbal_Yaw"],
        "gimbal.pitch": ["Gimbal_Pitch"],
        "camera": ["Camera_Main"],
        "light.frontLeft": ["FrontLight_Diffuser_L"],
        "light.frontRight": ["FrontLight_Diffuser_R"],
        "light.motorFrontLeft": ["StatusLight_FL"],
        "light.motorFrontRight": ["StatusLight_FR"],
        "light.motorRearLeft": ["StatusLight_RL"],
        "light.motorRearRight": ["StatusLight_RR"],
    },
    "capabilities": ROOT["aerometric"]["capabilities"].to_dict(),
    "metadata": {
        "origin": "Generated by the repository Blender script from native primitives; no external assets",
        "generator": "release/aerometric-0.1/blender/build_reference_drone_01.py",
    },
}
(PACKAGE / "model.aerometric.json").write_text(
    json.dumps(profile, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

bpy.ops.object.select_all(action="DESELECT")
ROOT.select_set(True)
for child in ROOT.children_recursive:
    child.select_set(True)
bpy.context.view_layer.objects.active = ROOT
bpy.ops.export_scene.gltf(
    filepath=str(PACKAGE / "model.glb"), export_format="GLB",
    use_selection=True, export_extras=True, export_yup=True,
    export_animations=False, export_apply=False,
)

# Studio-independent preview. Camera, floor and lights are created after GLB export.
floor_mat = material("PREVIEW_Floor", "#BAC6C7", 0, 0.85)
box("PREVIEW_Floor", (200, 200, 0.015), floor_mat, None,
    (0, 0, -0.175), 0)
world = bpy.context.scene.world or bpy.data.worlds.new("Preview World")
bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.42, 0.49, 0.51, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.34
camera_data = bpy.data.cameras.new("PREVIEW_Camera")
camera_obj = bpy.data.objects.new("PREVIEW_Camera", camera_data)
bpy.context.collection.objects.link(camera_obj)
camera_obj.location = (0.78, 0.84, 0.57)
camera_obj.rotation_euler = (Vector((0, 0, 0.005)) - camera_obj.location).to_track_quat("-Z", "Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = 1.10
bpy.context.scene.camera = camera_obj
for name, location, energy, size in [
    ("Key", (0.2, 0.5, 1.1), 180, 1.0),
    ("Fill", (-0.8, 0.0, 0.6), 110, 1.2),
    ("Rim", (0.1, -0.8, 0.8), 210, 0.8),
]:
    data = bpy.data.lights.new(f"PREVIEW_{name}", "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(f"PREVIEW_{name}", data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (-obj.location).to_track_quat("-Z", "Y").to_euler()
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.quality = 92
scene.render.filepath = str(PACKAGE / "preview.webp")
scene.render.film_transparent = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.exposure = -0.45
bpy.ops.render.render(write_still=True)
print(f"REFERENCE_DRONE_01_READY {PACKAGE}")
