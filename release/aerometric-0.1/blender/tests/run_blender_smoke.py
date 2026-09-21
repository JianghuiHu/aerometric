import importlib
import json
import os
import sys

import bpy

addon_parent = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "addon"))
sys.path.insert(0, addon_parent)
helper = importlib.import_module("aerometric_helper")
helper.register()

settings = bpy.context.scene.aerometric_settings
settings.profile_id = "aerometric.quadrotor-v3"
settings.label = "Quadrotor V3"
bpy.ops.aerometric.adopt_known()
issues = helper.validate_scene()
report = helper.write_report(issues)

output_dir = os.environ["AEROMETRIC_TEST_OUTPUT"]
os.makedirs(output_dir, exist_ok=True)
report_path = os.path.join(output_dir, "blender-helper-report.json")
profile_path = os.path.join(output_dir, "quadrotor-v3.aerometric.json")
glb_path = os.path.join(output_dir, "quadrotor-v3-helper.glb")

with open(report_path, "w", encoding="utf-8") as handle:
    json.dump(report, handle, indent=2, ensure_ascii=False)
with open(profile_path, "w", encoding="utf-8") as handle:
    json.dump(helper.build_profile(bpy.context), handle, indent=2, ensure_ascii=False)
    handle.write("\n")

if report["summary"]["errors"]:
    raise RuntimeError(f"Helper validation failed: {report['summary']}")

result = bpy.ops.aerometric.export_glb(filepath=glb_path)
if "FINISHED" not in result or not os.path.exists(glb_path):
    raise RuntimeError("GLB export did not finish")
print("AEROMETRIC_HELPER_SMOKE=" + json.dumps({
    "report": report_path,
    "profile": profile_path,
    "glb": glb_path,
    "summary": report["summary"],
    "roles": len(report["roles"]),
}))
