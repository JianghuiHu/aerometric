import {defineConfig} from 'vite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({root,base:'./',build:{outDir:path.resolve(root,'../artifacts/web-validator'),emptyOutDir:true}});
