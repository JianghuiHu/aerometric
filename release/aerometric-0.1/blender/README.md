# Blender tooling

`addon/aerometric_helper` contains the installable AEROMETRIC Blender Helper 0.1. It writes the same role contract used by the Profile schema and CLI Validator.

`build_reference_drone_01.py` builds the CC0 reference quadrotor from Blender primitives, writes the Profile and GLB, and renders the preview without external textures. Run it with `--background --factory-startup` and pass an output package directory after `--`. The script is MIT-licensed as repository code; its output package is separately CC0-licensed. Neither license grants rights to Quadrotor V3.
