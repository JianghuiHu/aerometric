#!/usr/bin/env node
import {formatReport,validateModelPackage} from './index.mjs';

const args=process.argv.slice(2),json=args.includes('--json'),help=args.includes('--help')||args.includes('-h'),values=args.filter(arg=>!['--json','--help','-h'].includes(arg));
if(help){console.log('Usage: aerometric-validator <model.glb|model-folder> [profile.json] [--json]');}
else if(!values[0]){console.error('Usage: aerometric-validator <model.glb|model-folder> [profile.json] [--json]');process.exitCode=1;}
else{const report=await validateModelPackage(values[0],values[1]);console.log(json?JSON.stringify(report,null,2):formatReport(report));if(!report.pass)process.exitCode=1;}
