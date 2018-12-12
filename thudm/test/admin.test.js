const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');

let test_session = null;
let auth_session = null;

beforeAll (() => {
    test_session = session(app);
});

describe('POST /auth/login/', () => {
    test('It should login success', (done) => {
        const input_id = 'bbb';
        const input_pw = '12345678';
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: input_pw })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    auth_session = test_session;
                    done();
                }, 500);
            });
    });
});

describe('GET /', () => {
    test('It should return main admin page', () => {
        return request(app)
            .get('/')
            .then(res => {
                expect(res.statusCode).toBe(200);
            });
    });
});
