# Blender tooling

`addon/aerometric_helper` contains the installable AEROMETRIC Blender Helper 0.1. It writes the same role contract used by the Profile schema and CLI Validator.

`build_reference_drone_01.py` builds the CC0 lightweight reference quadrotor from Blender primitives, writes the Profile and GLB, and renders the preview without external textures. Run it with `--background --factory-startup` and pass an output package directory after `--`. The script is MIT-licensed as repository code; its output package is separately CC0-licensed. The separately packaged Quadrotor V3 is also CC0-licensed by its rights holder and demonstrates a fuller semantic role set; do not copy its visual form when authoring other compatible models.
