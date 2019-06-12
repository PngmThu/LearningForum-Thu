import web3 from './web3';

import RentalFactory from './build/RentalFactory.json';

const instance = new web3.eth.Contract(
    JSON.parse(RentalFactory.interface),
    '0x148187ef034224ef23ddab5c0dd360d15eeea9ec'
);

export default instance;

//'0x99cfd858eF78E25E6679EC0EdC915ED9C1793e4d'