const {assert} = require('chai');

const app = require('../src/app');

require('./tests.less');
describe('TimelineJS', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.querySelector('body').appendChild(container);
    });

    afterEach(() => {
        document.querySelector('body').removeChild(container);
    });
});