import activity from '@tabler/icons/outline/activity.svg?raw';
import palette from '@tabler/icons/outline/palette.svg?raw';
import radar from '@tabler/icons/outline/radar.svg?raw';
import mountain from '@tabler/icons/outline/mountain.svg?raw';
import download from '@tabler/icons/outline/download.svg?raw';
import focus from '@tabler/icons/outline/focus-2.svg?raw';
import refresh from '@tabler/icons/outline/refresh.svg?raw';
import sun from '@tabler/icons/outline/sun.svg?raw';
import rain from '@tabler/icons/outline/cloud-rain.svg?raw';
import moon from '@tabler/icons/outline/moon.svg?raw';
import swatch from '@tabler/icons/outline/color-swatch.svg?raw';
import eye from '@tabler/icons/outline/eye.svg?raw';
import navigation from '@tabler/icons/outline/navigation.svg?raw';
import photo from '@tabler/icons/outline/photo.svg?raw';
import box from '@tabler/icons/outline/box.svg?raw';
import play from '@tabler/icons/outline/player-play.svg?raw';
import stop from '@tabler/icons/outline/player-stop.svg?raw';
import up from '@tabler/icons/outline/arrow-up.svg?raw';
import down from '@tabler/icons/outline/arrow-down.svg?raw';
import left from '@tabler/icons/outline/arrow-left.svg?raw';
import right from '@tabler/icons/outline/arrow-right.svg?raw';
import perspective from '@tabler/icons/outline/cube-3d-sphere.svg?raw';
import drone from '@tabler/icons/outline/drone.svg?raw';
import propeller from '@tabler/icons/outline/propeller.svg?raw';
import github from '@tabler/icons/outline/brand-github.svg?raw';
import book from '@tabler/icons/outline/book-2.svg?raw';

const ICONS={activity,palette,radar,mountain,download,focus,refresh,sun,rain,moon,swatch,eye,navigation,photo,box,play,stop,up,down,left,right,perspective,drone,propeller,github,book};
export function UIIcon(name,{label='',size=18}={}){const svg=ICONS[name]||ICONS.box;return svg.replace('<svg ',`<svg width="${size}" height="${size}" stroke-width="1.8" ${label?`role="img" aria-label="${label}"`:'aria-hidden="true"'} `);}
