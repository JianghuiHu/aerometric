bl_info = {
    "name": "AEROMETRIC Helper",
    "author": "AEROMETRIC contributors",
    "version": (0, 1, 0),
    "blender": (4, 2, 0),
    "location": "3D View > Sidebar > AEROMETRIC",
    "description": "Tag, validate, profile, and export controllable drone assets",
    "category": "Import-Export",
}

import json
import re

import bpy
from bpy.props import BoolProperty, EnumProperty, StringProperty
from bpy.types import Operator, Panel, PropertyGroup
from bpy_extras.io_utils import ExportHelper
from mathutils import Vector


ROLE_ITEMS = [
    ("body", "Body", "Main body parts"),
    ("topCover", "Top cover", "Top cover"),
    ("arms", "Arms", "Arm parts"),
    ("motors", "Motors", "Motor parts"),
    ("landingGear", "Landing gear", "Landing gear"),
    ("gimbal", "Gimbal", "Gimbal housing"),
    ("gimbal.yaw", "Gimbal yaw", "Yaw pivot"),
    ("gimbal.pitch", "Gimbal pitch", "Pitch pivot"),
    ("camera", "Camera", "Camera housing"),
    ("rotor", "Rotor", "Rotor; choose its position"),
    ("light.front", "Front light", "Front status light; choose its position"),
    ("light.motor", "Motor light", "Motor status light; choose its position"),
]

POSITION_ITEMS = [
    ("none", "None", "No position"),
    ("front-left", "Front left", "Front left"),
    ("front-right", "Front right", "Front right"),
    ("rear-left", "Rear left", "Rear left"),
    ("rear-right", "Rear right", "Rear right"),
    ("left", "Left", "Left"),
    ("right", "Right", "Right"),
]

POSITION_SUFFIX = {
    "front-left": "frontLeft",
    "front-right": "frontRight",
    "rear-left": "rearLeft",
    "rear-right": "rearRight",
    "left": "Left",
    "right": "Right",
}

KNOWN_ROLES = {
    "DRONE_ROOT": ("root", None),
    "Body_Main": ("body", None),
    "Body_FrontSection": ("body", None),
    "Body_Bottom": ("body", None),
    "Body_Side_L": ("body", None),
    "Body_Side_R": ("body", None),
    "Body_TopCover": ("topCover", None),
    "ARM_FL": ("arms", "front-left"),
    "ARM_FR": ("arms", "front-right"),
    "ARM_RL": ("arms", "rear-left"),
    "ARM_RR": ("arms", "rear-right"),
    "MOTOR_FL": ("motors", "front-left"),
    "MOTOR_FR": ("motors", "front-right"),
    "MOTOR_RL": ("motors", "rear-left"),
    "MOTOR_RR": ("motors", "rear-right"),
    "LANDING_GEAR": ("landingGear", None),
    "ROTOR_FL": ("rotor", "front-left"),
    "ROTOR_FR": ("rotor", "front-right"),
    "ROTOR_RL": ("rotor", "rear-left"),
    "ROTOR_RR": ("rotor", "rear-right"),
    "GIMBAL_ROOT": ("gimbal", None),
    "Gimbal_Yaw": ("gimbal.yaw", None),
    "Gimbal_Pitch": ("gimbal.pitch", None),
    "Camera_Main": ("camera", None),
    "FrontLight_Diffuser_L": ("light.front", "left"),
    "FrontLight_Diffuser_R": ("light.front", "right"),
    "StatusLight_FL": ("light.motor", "front-left"),
    "StatusLight_FR": ("light.motor", "front-right"),
    "StatusLight_RL": ("light.motor", "rear-left"),
    "StatusLight_RR": ("light.motor", "rear-right"),
}


def semantic_role(obj):
    data = obj.get("aerometric")
    return data.get("role") if hasattr(data, "get") else None


def semantic_position(obj):
    data = obj.get("aerometric")
    return data.get("position") if hasattr(data, "get") else None


def set_metadata(obj, role, position=None, editable_color=False, axis=None):
    data = {"role": role}
    if position and position != "none":
        data["position"] = position
    if editable_color:
        data["editableColor"] = True
    if axis:
        data["axis"] = axis
    obj["aerometric"] = data


def set_root_profile(root, profile_id):
    data = dict(root.get("aerometric", {}))
    data["role"] = "root"
    data["profile"] = profile_id
    root["aerometric"] = data
    root["aerometric_profile"] = profile_id


def descendants(obj):
    result = []
    stack = list(obj.children)
    while stack:
        child = stack.pop()
        result.append(child)
        stack.extend(child.children)
    return result


def is_descendant(obj, ancestor):
    current = obj.parent
    while current:
        if current == ancestor:
            return True
        current = current.parent
    return False


def role_key(role, position):
    if role == "rotor" and position in POSITION_SUFFIX:
        return "rotor." + POSITION_SUFFIX[position]
    if role == "light.front" and position in ("left", "right"):
        return "light.front" + POSITION_SUFFIX[position]
    if role == "light.motor" and position in POSITION_SUFFIX:
        return "light.motor" + POSITION_SUFFIX[position][0].upper() + POSITION_SUFFIX[position][1:]
    return role


def collect_roles(objects=None):
    roles = {}
    for obj in objects or bpy.data.objects:
        role = semantic_role(obj)
        if not role:
            continue
        key = role_key(role, semantic_position(obj))
        roles.setdefault(key, []).append(obj.name)
    return {key: sorted(names) for key, names in sorted(roles.items())}


def model_root():
    roots = [obj for obj in bpy.data.objects if semantic_role(obj) == "root"]
    if len(roots) == 1:
        return roots[0]
    return bpy.data.objects.get("DRONE_ROOT")


def issue(level, code, message, objects=()):
    return {"level": level, "code": code, "message": message, "objects": list(objects)}


def validate_scene():
    issues = []
    roles = collect_roles()
    roots = [obj for obj in bpy.data.objects if semantic_role(obj) == "root"]
    if not roots:
        issues.append(issue("ERROR", "ROOT_MISSING", "No object is tagged with role=root."))
    elif len(roots) > 1:
        issues.append(issue("ERROR", "ROOT_MULTIPLE", "Exactly one semantic root is required.", [o.name for o in roots]))
    root = roots[0] if len(roots) == 1 else model_root()
    if root and not root.get("aerometric_profile"):
        issues.append(issue("WARNING", "PROFILE_MISSING", "Root has no aerometric_profile id.", [root.name]))

    rotor_keys = ["rotor.frontLeft", "rotor.frontRight", "rotor.rearLeft", "rotor.rearRight"]
    missing = [key for key in rotor_keys if key not in roles]
    if missing:
        issues.append(issue("ERROR", "ROTORS_INCOMPLETE", "Missing rotor roles: " + ", ".join(missing)))
    for key in rotor_keys:
        names = roles.get(key, [])
        if len(names) > 1:
            issues.append(issue("ERROR", "ROTOR_DUPLICATE", f"{key} resolves to multiple objects.", names))
        if len(names) == 1:
            rotor = bpy.data.objects.get(names[0])
            mesh_nodes = [o for o in [rotor] + descendants(rotor) if o.type == "MESH"]
            points = []
            for mesh in mesh_nodes:
                points.extend(mesh.matrix_world @ Vector(corner) for corner in mesh.bound_box)
            if points:
                low = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
                high = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
                span = max(high - low)
                if (rotor.matrix_world.translation - (low + high) * 0.5).length > max(0.01, span * 0.2):
                    issues.append(issue("WARNING", "ROTOR_PIVOT", f"{key} origin is far from its geometry center.", names))

    yaw_names = roles.get("gimbal.yaw", [])
    pitch_names = roles.get("gimbal.pitch", [])
    camera_names = roles.get("camera", [])
    if not yaw_names or not pitch_names or not camera_names:
        issues.append(issue("ERROR", "GIMBAL_INCOMPLETE", "Gimbal yaw, pitch, and camera roles are required."))
    elif not is_descendant(bpy.data.objects[pitch_names[0]], bpy.data.objects[yaw_names[0]]):
        issues.append(issue("ERROR", "GIMBAL_HIERARCHY", "Gimbal pitch must be a descendant of gimbal yaw.", yaw_names + pitch_names))
    elif not is_descendant(bpy.data.objects[camera_names[0]], bpy.data.objects[pitch_names[0]]):
        issues.append(issue("ERROR", "CAMERA_HIERARCHY", "Camera must be a descendant of gimbal pitch.", pitch_names + camera_names))

    if root:
        controlled = [root] + descendants(root)
        for obj in controlled:
            if any(value < 0 for value in obj.scale):
                issues.append(issue("ERROR", "NEGATIVE_SCALE", "Negative scale is not portable.", [obj.name]))
            elif any(abs(value - 1.0) > 1e-4 for value in obj.scale):
                issues.append(issue("WARNING", "NON_UNIT_SCALE", "Apply scale on controllable nodes before export.", [obj.name]))
            if re.fullmatch(r"(?:Cube|Cylinder|Sphere|Empty|Material)(?:\.\d+)?", obj.name):
                issues.append(issue("WARNING", "GENERIC_NAME", "Use a stable semantic object name.", [obj.name]))
            if obj.type == "MESH" and not obj.material_slots:
                issues.append(issue("WARNING", "MATERIAL_MISSING", "Mesh has no material.", [obj.name]))
            for slot in obj.material_slots:
                if slot.material and re.fullmatch(r"Material(?:\.\d+)?", slot.material.name):
                    issues.append(issue("WARNING", "GENERIC_MATERIAL", "Use a stable material name.", [obj.name, slot.material.name]))
    return issues


def write_report(issues):
    report = {
        "profile": (model_root() or {}).get("aerometric_profile", "") if model_root() else "",
        "roles": collect_roles(),
        "summary": {
            "errors": sum(i["level"] == "ERROR" for i in issues),
            "warnings": sum(i["level"] == "WARNING" for i in issues),
        },
        "issues": issues,
    }
    text = bpy.data.texts.get("AEROMETRIC_Validation_Report") or bpy.data.texts.new("AEROMETRIC_Validation_Report")
    text.clear()
    text.write(json.dumps(report, indent=2, ensure_ascii=False))
    return report


class AEROMETRIC_Settings(PropertyGroup):
    role: EnumProperty(name="Role", items=ROLE_ITEMS, default="body")
    position: EnumProperty(name="Position", items=POSITION_ITEMS, default="none")
    editable_color: BoolProperty(name="Editable color", default=True)
    profile_id: StringProperty(name="Profile", default="aerometric.custom-drone")
    label: StringProperty(name="Label", default="Custom Drone")
    forward_axis: EnumProperty(name="Forward", items=[("+Z", "+Z", ""), ("-Z", "-Z", ""), ("+X", "+X", ""), ("-X", "-X", "")], default="+Z")


class AEROMETRIC_OT_assign(Operator):
    bl_idname = "aerometric.assign"
    bl_label = "Assign selected"
    bl_description = "Assign the chosen semantic role to selected objects"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.aerometric_settings
        if not context.selected_objects:
            self.report({"ERROR"}, "Select at least one object")
            return {"CANCELLED"}
        if settings.role in {"rotor", "light.front", "light.motor"} and settings.position == "none":
            self.report({"ERROR"}, "This role requires a position")
            return {"CANCELLED"}
        axis = "+Z" if settings.role == "rotor" else None
        for obj in context.selected_objects:
            set_metadata(obj, settings.role, settings.position, settings.editable_color, axis)
        self.report({"INFO"}, f"Tagged {len(context.selected_objects)} object(s)")
        return {"FINISHED"}


class AEROMETRIC_OT_clear(Operator):
    bl_idname = "aerometric.clear"
    bl_label = "Clear selected tags"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        for obj in context.selected_objects:
            if "aerometric" in obj:
                del obj["aerometric"]
        return {"FINISHED"}


class AEROMETRIC_OT_adopt_known(Operator):
    bl_idname = "aerometric.adopt_known"
    bl_label = "Adopt recognized structure"
    bl_description = "Tag exact canonical AEROMETRIC object names without renaming geometry"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.aerometric_settings
        tagged = 0
        for name, (role, position) in KNOWN_ROLES.items():
            obj = bpy.data.objects.get(name)
            if not obj:
                continue
            set_metadata(obj, role, position, role not in {"root", "rotor"}, "+Z" if role == "rotor" else None)
            tagged += 1
        root = bpy.data.objects.get("DRONE_ROOT")
        if root:
            set_root_profile(root, settings.profile_id)
        self.report({"INFO"}, f"Tagged {tagged} recognized objects")
        return {"FINISHED"}


class AEROMETRIC_OT_validate(Operator):
    bl_idname = "aerometric.validate"
    bl_label = "Validate model"
    bl_description = "Validate roles, pivots, hierarchy, scale, and materials"

    def execute(self, context):
        report = write_report(validate_scene())
        context.scene["aerometric_last_errors"] = report["summary"]["errors"]
        context.scene["aerometric_last_warnings"] = report["summary"]["warnings"]
        level = {"ERROR"} if report["summary"]["errors"] else {"INFO"}
        self.report(level, f"{report['summary']['errors']} errors, {report['summary']['warnings']} warnings; see Text Editor")
        return {"FINISHED"}


def build_profile(context):
    settings = context.scene.aerometric_settings
    root = model_root()
    roles = collect_roles([root] + descendants(root) if root else None)
    role_names = set(roles)
    return {
        "id": settings.profile_id,
        "version": "0.1.0",
        "label": settings.label,
        "units": "meter",
        "forwardAxis": settings.forward_axis,
        "roles": roles,
        "capabilities": {
            "partColors": any(semantic_role(o) in {"body", "topCover", "arms", "motors", "landingGear", "gimbal", "camera"} for o in bpy.data.objects),
            "partVisibility": bool(roles),
            "rotorControl": all(key in role_names for key in ("rotor.frontLeft", "rotor.frontRight", "rotor.rearLeft", "rotor.rearRight")),
            "gimbalControl": all(key in role_names for key in ("gimbal.yaw", "gimbal.pitch", "camera")),
            "statusLights": any(key.startswith("light.") for key in role_names),
            "statusField": False,
        },
        "metadata": {"generator": "AEROMETRIC Blender Helper 0.1"},
    }


class AEROMETRIC_OT_export_profile(Operator, ExportHelper):
    bl_idname = "aerometric.export_profile"
    bl_label = "Export AEROMETRIC Profile"
    filename_ext = ".aerometric.json"
    filter_glob: StringProperty(default="*.aerometric.json", options={"HIDDEN"})

    def execute(self, context):
        issues = validate_scene()
        if any(i["level"] == "ERROR" for i in issues):
            write_report(issues)
            self.report({"ERROR"}, "Fix validation errors before exporting a profile")
            return {"CANCELLED"}
        with open(self.filepath, "w", encoding="utf-8") as handle:
            json.dump(build_profile(context), handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        self.report({"INFO"}, "Profile exported")
        return {"FINISHED"}


class AEROMETRIC_OT_export_glb(Operator, ExportHelper):
    bl_idname = "aerometric.export_glb"
    bl_label = "Export AEROMETRIC GLB"
    filename_ext = ".glb"
    filter_glob: StringProperty(default="*.glb", options={"HIDDEN"})

    def execute(self, context):
        issues = validate_scene()
        if any(i["level"] == "ERROR" for i in issues):
            write_report(issues)
            self.report({"ERROR"}, "Fix validation errors before exporting GLB")
            return {"CANCELLED"}
        root = model_root()
        if not root:
            self.report({"ERROR"}, "No semantic root")
            return {"CANCELLED"}
        set_root_profile(root, context.scene.aerometric_settings.profile_id)
        selected = list(context.selected_objects)
        active = context.view_layer.objects.active
        bpy.ops.object.select_all(action="DESELECT")
        exported = [root] + descendants(root)
        for obj in exported:
            if not obj.hide_get() and not obj.hide_render:
                obj.select_set(True)
        try:
            bpy.ops.export_scene.gltf(
                filepath=self.filepath,
                export_format="GLB",
                use_selection=True,
                export_extras=True,
                export_cameras=False,
                export_lights=False,
                export_yup=True,
            )
        finally:
            bpy.ops.object.select_all(action="DESELECT")
            for obj in selected:
                if obj.name in bpy.data.objects:
                    obj.select_set(True)
            context.view_layer.objects.active = active
        self.report({"INFO"}, f"Exported {len(exported)} model objects")
        return {"FINISHED"}


class AEROMETRIC_PT_main(Panel):
    bl_label = "AEROMETRIC Helper 0.1"
    bl_idname = "AEROMETRIC_PT_main"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "AEROMETRIC"

    def draw(self, context):
        layout = self.layout
        settings = context.scene.aerometric_settings
        box = layout.box()
        box.label(text="Model contract")
        box.prop(settings, "profile_id")
        box.prop(settings, "label")
        box.prop(settings, "forward_axis")
        box.operator("aerometric.adopt_known", icon="FILE_REFRESH")
        box = layout.box()
        box.label(text="Selected objects")
        box.prop(settings, "role")
        box.prop(settings, "position")
        box.prop(settings, "editable_color")
        row = box.row(align=True)
        row.operator("aerometric.assign", icon="CHECKMARK")
        row.operator("aerometric.clear", icon="X")
        box = layout.box()
        box.label(text="Validate and export")
        box.operator("aerometric.validate", icon="VIEWZOOM")
        errors = context.scene.get("aerometric_last_errors")
        warnings = context.scene.get("aerometric_last_warnings")
        if errors is not None:
            box.label(text=f"Last result: {errors} errors, {warnings} warnings")
        box.operator("aerometric.export_profile", icon="FILE_TEXT")
        box.operator("aerometric.export_glb", icon="EXPORT")


CLASSES = (
    AEROMETRIC_Settings,
    AEROMETRIC_OT_assign,
    AEROMETRIC_OT_clear,
    AEROMETRIC_OT_adopt_known,
    AEROMETRIC_OT_validate,
    AEROMETRIC_OT_export_profile,
    AEROMETRIC_OT_export_glb,
    AEROMETRIC_PT_main,
)


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.Scene.aerometric_settings = bpy.props.PointerProperty(type=AEROMETRIC_Settings)


def unregister():
    del bpy.types.Scene.aerometric_settings
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
