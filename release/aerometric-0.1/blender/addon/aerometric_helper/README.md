# AEROMETRIC Blender Helper 0.1

This Blender 4.2+ add-on annotates a drone model with AEROMETRIC semantics, checks its controllable hierarchy, exports a sidecar Profile, and exports the model root as GLB.

## Install

1. Zip the `aerometric_helper` folder, or use the release ZIP.
2. In Blender, open **Edit → Preferences → Add-ons → Install from Disk**.
3. Enable **AEROMETRIC Helper**.
4. Open **3D View → Sidebar → AEROMETRIC**.

## Workflow

1. Set a lowercase Profile id such as `studio.my-drone`.
2. For the bundled naming convention, choose **Adopt recognized structure**. This uses exact names and never renames geometry.
3. For other assets, select objects and assign their role and position.
4. Run **Validate model**. The complete JSON report is written to the Blender text block `AEROMETRIC_Validation_Report`.
5. Export the `.aerometric.json` Profile and GLB.

The GLB command exports the semantic root and visible descendants, includes custom properties as glTF `extras`, and excludes Blender cameras and lights. Hidden parts are omitted by selection. Environment, flight route, and runtime shader effects do not belong under the semantic model root.

## Validation scope

Errors block export. The helper checks the unique root, four unique rotor positions, gimbal yaw/pitch/camera hierarchy, negative scale, and required role coverage. Warnings cover distant rotor pivots, non-unit scale, generic names, and missing or generic materials.

The add-on does not modify mesh geometry, fix pivots, unwrap UVs, reduce polygons, or infer arbitrary third-party naming. Those operations need an authoring decision.
