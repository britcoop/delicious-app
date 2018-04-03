import '../sass/style.scss';

import { $, $$ } from './modules/bling';

import autocomplete from './modules/autocomplete';

//looks like jquery but its bling - $ just means document.querySelector
autocomplete( $('#address'), $('#lat'), $('#lng') );